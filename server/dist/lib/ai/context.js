"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAgentTaskContext = buildAgentTaskContext;
exports.formatAgentMarkdownPrompt = formatAgentMarkdownPrompt;
/**
 * Menghasilkan bounded payload context yang dirancang khusus untuk di-feed
 * ke AI coding agent CLI (Claude Code, Cursor, Aider, atau project-ai CLI)
 * tanpa membawa context bloat (hanya informasi yang esensial untuk 1 task ini).
 */
function buildAgentTaskContext(task, projectName, projectDesc, stacks = []) {
    return {
        taskId: task.id,
        sequence: task.sequence,
        title: task.title,
        layer: task.layer,
        priority: task.priority,
        projectOverview: {
            name: projectName,
            description: projectDesc,
            stacks,
        },
        instructions: task.ai_context.instructions,
        targetFiles: {
            create: task.ai_context.files_to_create,
            modify: task.ai_context.files_to_modify,
        },
        acceptanceCriteria: task.acceptance_criteria,
        testCriteria: task.ai_context.test_criteria,
        boundedContextRules: [
            'Hanya kerjakan file yang tercantum dalam targetFiles.',
            'Jangan memodifikasi skema atau API di luar lingkup layer task ini.',
            'Pastikan seluruh acceptance criteria teruji sebelum menandai task selesai.',
            'Jika menemukan blocker dependensi, laporkan dengan status BLOCKED.',
        ],
    };
}
/**
 * Menghasilkan format prompt Markdown siap tempel untuk LLM coding agent
 */
function formatAgentMarkdownPrompt(context) {
    return `### [TASK ${context.taskId}] ${context.title}
**Layer**: \`${context.layer}\` | **Priority**: \`${context.priority.toUpperCase()}\` | **Sequence**: #${context.sequence}

#### 📋 Deskripsi & Instruksi Eksekusi
${context.instructions}

#### 🎯 Target Files
- **Buat Baru**: ${context.targetFiles.create.length > 0 ? context.targetFiles.create.map(f => `\`${f}\``).join(', ') : 'None'}
- **Modifikasi**: ${context.targetFiles.modify.length > 0 ? context.targetFiles.modify.map(f => `\`${f}\``).join(', ') : 'None'}

#### ✅ Kriteria Penerimaan (Acceptance Criteria)
${context.acceptanceCriteria.map((c, i) => `${i + 1}. [ ] ${c}`).join('\n')}

#### 🧪 Kriteria Pengujian
> ${context.testCriteria}

#### 🛡️ Bounded Context Rules
${context.boundedContextRules.map(r => `- ${r}`).join('\n')}
`;
}
