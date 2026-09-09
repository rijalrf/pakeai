import { z } from 'zod';
import { getAIService } from './ai-service';
import { query } from '@/lib/db/postgres';
import type { PRDDocument } from './prd';
import type { RoadmapDocument } from './roadmap';
import type { TaskItemData } from './tasks';

export const reviewIssueSchema = z.object({
  severity: z.enum(['critical', 'warning', 'info']),
  category: z.enum(['completeness', 'consistency', 'security', 'dependency', 'bounded_context']),
  message: z.string(),
  suggestion: z.string(),
});

export const reviewResultSchema = z.object({
  score: z.number().min(0).max(100),
  verdict: z.enum(['pass', 'warning', 'fail']),
  summary: z.string(),
  issues: z.array(reviewIssueSchema),
});

export type ReviewIssue = z.infer<typeof reviewIssueSchema>;
export type ReviewResult = z.infer<typeof reviewResultSchema>;

export async function persistReview(
  projectId: string,
  stage: 'prd' | 'roadmap' | 'tasks',
  result: ReviewResult,
  autoFixed: boolean = false
): Promise<void> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(projectId);
  if (!isUuid) return;

  try {
    await query(
      `INSERT INTO ai_reviews (project_id, stage, score, verdict, issues, auto_fixed)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        projectId,
        stage,
        Math.round(result.score),
        result.verdict,
        JSON.stringify(result.issues),
        autoFixed,
      ]
    );
  } catch (err: any) {
    console.error(`Gagal menyimpan ai_review untuk stage ${stage}:`, err.message);
  }
}

/**
 * Reviewer untuk Dokumen PRD
 */
export async function reviewPRD(
  prd: PRDDocument,
  discoveryContext: { idea: string; projectType: string; stacks: any[] }
): Promise<ReviewResult> {
  const issues: ReviewIssue[] = [];

  // 1. Validasi Rule-based
  if (!prd.features || prd.features.length < 3) {
    issues.push({
      severity: 'warning',
      category: 'completeness',
      message: 'Jumlah fitur MVP kurang dari 3 fitur inti.',
      suggestion: 'Tambahkan minimal 3-5 fitur inti untuk mencakup alur pengguna secara menyeluruh.',
    });
  }

  const hasMustHave = prd.features?.some((f) => f.priority === 'must');
  if (!hasMustHave) {
    issues.push({
      severity: 'critical',
      category: 'completeness',
      message: 'Tidak ada fitur dengan prioritas "must" (wajib).',
      suggestion: 'Tandai fitur-fitur kritis sebagai prioritas "must".',
    });
  }

  // 2. Evaluasi AI Second-Pass
  try {
    const ai = getAIService();
    const prompt = `Anda adalah Senior Software Architect & Product Reviewer.
Tinjau dokumen PRD berikut terhadap ide awal pengguna.

Ide Awal: "${discoveryContext.idea}"
Tipe Proyek: "${discoveryContext.projectType}"
Stacks: ${JSON.stringify(discoveryContext.stacks)}

Dokumen PRD yang Dihasilkan:
${JSON.stringify(prd, null, 2)}

Evaluasi:
1. Kelengkapan fitur terhadap masalah yang ingin diselesaikan.
2. Konsistensi teknis antara stack dan requirement.
3. Ketiadaan scope creep atau fitur yang kontradiktif.
4. Skor keseluruhan dari 0 hingga 100.
5. Verdict: "pass" jika skor >= 75 tanpa isu kritis, "warning" jika skor 60-74, "fail" jika skor < 60 atau ada isu kritis.`;

    const aiReview = await ai.generateJSON<ReviewResult>({
      systemPrompt:
        'Anda adalah AI Reviewer yang teliti, objektif, dan kritis. Berikan evaluasi dalam Bahasa Indonesia dengan format JSON.',
      userPrompt: prompt,
      schema: reviewResultSchema,
      temperature: 0.1,
    });

    // Gabungkan isu rule-based dan hasil LLM
    const mergedIssues = [...issues, ...(aiReview.issues || [])];
    const hasCritical = mergedIssues.some((i) => i.severity === 'critical');
    const finalScore = hasCritical ? Math.min(aiReview.score, 65) : aiReview.score;
    const finalVerdict = finalScore >= 75 && !hasCritical ? 'pass' : finalScore >= 60 ? 'warning' : 'fail';

    return {
      score: finalScore,
      verdict: finalVerdict,
      summary: aiReview.summary || 'Tinjauan PRD selesai dievaluasi.',
      issues: mergedIssues,
    };
  } catch (err: any) {
    console.warn('AI Reviewer PRD offline / fallback:', err.message);
    const hasCritical = issues.some((i) => i.severity === 'critical');
    return {
      score: hasCritical ? 65 : 85,
      verdict: hasCritical ? 'warning' : 'pass',
      summary: 'Pemeriksaan otomatis dasar PRD selesai (Reviewer LLM offline).',
      issues,
    };
  }
}

/**
 * Reviewer untuk Dokumen Roadmap
 */
export async function reviewRoadmap(
  roadmap: RoadmapDocument,
  prd: PRDDocument
): Promise<ReviewResult> {
  const issues: ReviewIssue[] = [];

  // 1. Validasi Siklus DAG (Circular Dependency Check via DFS)
  const phases = roadmap.phases || [];
  const phaseMap = new Map<string, string[]>();
  for (const p of phases) {
    phaseMap.set(p.id, p.depends_on_phase_ids || []);
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();
  let hasCycle = false;

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    inStack.add(nodeId);

    const neighbors = phaseMap.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (inStack.has(neighbor)) {
        return true;
      }
    }

    inStack.delete(nodeId);
    return false;
  }

  for (const p of phases) {
    if (!visited.has(p.id)) {
      if (dfs(p.id)) {
        hasCycle = true;
        break;
      }
    }
  }

  if (hasCycle) {
    issues.push({
      severity: 'critical',
      category: 'dependency',
      message: 'Terdeteksi dependensi melingkar (circular dependency) antar fase roadmap.',
      suggestion: 'Pastikan urutan ketergantungan fase bersifat satu arah (Directed Acyclic Graph).',
    });
  }

  // 2. Evaluasi AI Second-Pass
  try {
    const ai = getAIService();
    const prompt = `Anda adalah Principal Architect.
Tinjau dokumen Roadmap fase-fase proyek berikut terhadap PRD:

PRD Features:
${JSON.stringify(prd.features || [], null, 2)}

Roadmap Phases:
${JSON.stringify(phases, null, 2)}

Evaluasi:
1. Kelogisan alur layer arsitektur (apakah DATABASE di awal sebelum BACKEND dan FRONTEND).
2. Kelengkapan fitur PRD yang dialokasikan ke fase roadmap.
3. Realisme estimasi durasi dan batasan deliverable per fase.
4. Skor 0-100 dan verdict (pass/warning/fail).`;

    const aiReview = await ai.generateJSON<ReviewResult>({
      systemPrompt: 'Anda adalah AI Reviewer Roadmap. Berikan evaluasi terstruktur dalam Bahasa Indonesia.',
      userPrompt: prompt,
      schema: reviewResultSchema,
      temperature: 0.1,
    });

    const mergedIssues = [...issues, ...(aiReview.issues || [])];
    const hasCritical = mergedIssues.some((i) => i.severity === 'critical');
    const finalScore = hasCritical ? Math.min(aiReview.score, 60) : aiReview.score;
    const finalVerdict = finalScore >= 75 && !hasCritical ? 'pass' : finalScore >= 60 ? 'warning' : 'fail';

    return {
      score: finalScore,
      verdict: finalVerdict,
      summary: aiReview.summary || 'Tinjauan roadmap selesai dievaluasi.',
      issues: mergedIssues,
    };
  } catch (err: any) {
    console.warn('AI Reviewer Roadmap offline / fallback:', err.message);
    const hasCritical = issues.some((i) => i.severity === 'critical');
    return {
      score: hasCritical ? 60 : 85,
      verdict: hasCritical ? 'warning' : 'pass',
      summary: 'Pemeriksaan dependensi roadmap selesai (Reviewer LLM offline).',
      issues,
    };
  }
}

/**
 * Reviewer untuk Kumpulan Atomic Tasks & Bounded Context
 */
export async function reviewTasks(
  tasks: TaskItemData[],
  roadmap: RoadmapDocument
): Promise<ReviewResult> {
  const issues: ReviewIssue[] = [];

  // 1. Validasi Rule-based Bounded Context
  const forbiddenPatterns = ['.env', 'prisma', 'migrations', 'agent'];
  for (const t of tasks) {
    const files = [
      ...(t.ai_context?.files_to_create || []),
      ...(t.ai_context?.files_to_modify || []),
    ];

    for (const f of files) {
      if (forbiddenPatterns.some((p) => f.toLowerCase().includes(p))) {
        issues.push({
          severity: 'critical',
          category: 'bounded_context',
          message: `Task #${t.sequence} "${t.title}" mencoba menyentuh file terproteksi: ${f}`,
          suggestion: 'Keluarkan file konfigurasi sensitif dari lingkup modifikasi task.',
        });
      }
    }

    if (!t.ai_context?.test_criteria || t.ai_context.test_criteria.trim().length < 5) {
      issues.push({
        severity: 'warning',
        category: 'completeness',
        message: `Task #${t.sequence} "${t.title}" tidak memiliki kriteria pengujian yang jelas.`,
        suggestion: 'Sertakan perintah atau langkah pengujian spesifik untuk memvalidasi task ini.',
      });
    }
  }

  // 2. Evaluasi AI Second-Pass
  try {
    const ai = getAIService();
    const prompt = `Anda adalah QA Lead & Security Reviewer.
Tinjau kumpulan atomic task yang akan dieksekusi oleh AI Coding Agent berikut:

Daftar Task:
${JSON.stringify(
  tasks.map((t) => ({
    seq: t.sequence,
    title: t.title,
    layer: t.layer,
    files_create: t.ai_context?.files_to_create,
    files_modify: t.ai_context?.files_to_modify,
    test_criteria: t.ai_context?.test_criteria,
    acceptance_criteria: t.acceptance_criteria,
  })),
  null,
  2
)}

Evaluasi:
1. Atomisitas: apakah setiap task memiliki instruksi yang dapat diselesaikan secara independen?
2. Bounded Context: apakah target file jelas dan tidak tumpang tindih secara destruktif?
3. Kriteria pengujian dan penerimaan yang dapat diuji.
4. Skor 0-100 dan verdict.`;

    const aiReview = await ai.generateJSON<ReviewResult>({
      systemPrompt: 'Anda adalah AI Task Reviewer. Berikan evaluasi terstruktur dalam Bahasa Indonesia.',
      userPrompt: prompt,
      schema: reviewResultSchema,
      temperature: 0.1,
    });

    const mergedIssues = [...issues, ...(aiReview.issues || [])];
    const hasCritical = mergedIssues.some((i) => i.severity === 'critical');
    const finalScore = hasCritical ? Math.min(aiReview.score, 60) : aiReview.score;
    const finalVerdict = finalScore >= 75 && !hasCritical ? 'pass' : finalScore >= 60 ? 'warning' : 'fail';

    return {
      score: finalScore,
      verdict: finalVerdict,
      summary: aiReview.summary || 'Tinjauan atomic tasks selesai dievaluasi.',
      issues: mergedIssues,
    };
  } catch (err: any) {
    console.warn('AI Reviewer Tasks offline / fallback:', err.message);
    const hasCritical = issues.some((i) => i.severity === 'critical');
    return {
      score: hasCritical ? 60 : 85,
      verdict: hasCritical ? 'warning' : 'pass',
      summary: 'Pemeriksaan bounded context selesai (Reviewer LLM offline).',
      issues,
    };
  }
}
