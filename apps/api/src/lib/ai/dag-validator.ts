// Validasi DAG Deterministik (Bab 35 & 36).
// Memastikan task graph bebas dari circular dependency, membersihkan referensi invalid,
// dan mengurutkan task secara topologis sebelum disimpan ke database.
import type { TaskGen } from './tasks.js';

export type DagValidationResult = {
  tasks: TaskGen[];
  warnings: string[];
  healed: boolean;
};

/**
 * Validasi dan normalisasi daftar task agar membentuk Directed Acyclic Graph (DAG) valid.
 */
export function validateAndNormalizeDAG(rawTasks: TaskGen[]): DagValidationResult {
  const warnings: string[] = [];
  let healed = false;

  // 1. Normalisasi taskId dan depends_on
  const tasks: TaskGen[] = rawTasks.map((t, idx) => {
    const fallbackId = `TASK-${String(idx + 1).padStart(3, '0')}`;
    const taskId = (t.taskId && t.taskId.trim()) ? t.taskId.trim() : fallbackId;
    const cleanDeps = (t.depends_on ?? [])
      .map((d) => d.trim())
      .filter((d) => d.length > 0 && d.toLowerCase() !== taskId.toLowerCase()); // hapus self-dep

    if (cleanDeps.length !== (t.depends_on ?? []).length) {
      warnings.push(`Task ${taskId}: Menghapus self-dependency atau dependensi kosong.`);
      healed = true;
    }

    return {
      ...t,
      taskId,
      depends_on: cleanDeps,
    };
  });

  // Kumpulan ID yang dikenal (taskId, featureId, task-order, order)
  const knownIds = new Set<string>();
  for (const t of tasks) {
    if (t.taskId) knownIds.add(t.taskId.toLowerCase());
    if (t.featureId) knownIds.add(t.featureId.toLowerCase());
    knownIds.add(`task-${t.order}`.toLowerCase());
    knownIds.add(String(t.order).toLowerCase());
  }

  // 2. Buang dependensi ke ID yang tidak dikenal (unknown)
  for (const t of tasks) {
    const validDeps = t.depends_on.filter((d) => knownIds.has(d.toLowerCase()));
    if (validDeps.length !== t.depends_on.length) {
      const dropped = t.depends_on.filter((d) => !knownIds.has(d.toLowerCase()));
      warnings.push(`Task ${t.taskId}: Menghapus dependensi tidak dikenal: [${dropped.join(', ')}]`);
      t.depends_on = validDeps;
      healed = true;
    }
  }

  // 3. Deteksi & putus siklus dependensi (Cycle Detection & Breaking via DFS)
  // Mapping: taskId -> array of prerequisite taskIds
  const taskById = new Map<string, TaskGen>();
  for (const t of tasks) {
    if (t.taskId) taskById.set(t.taskId.toLowerCase(), t);
  }

  // Helper untuk mencari taskId target dari sembarang string dep
  function resolveDepTaskId(dep: string): string | null {
    const clean = dep.toLowerCase();
    const direct = taskById.get(clean);
    if (direct?.taskId) return direct.taskId.toLowerCase();
    const found = tasks.find(
      (t) =>
        (t.featureId && t.featureId.toLowerCase() === clean) ||
        `task-${t.order}`.toLowerCase() === clean ||
        String(t.order) === clean
    );
    return found?.taskId ? found.taskId.toLowerCase() : null;
  }

  const visited = new Map<string, number>(); // 0: unvisited, 1: visiting, 2: visited
  const cycleEdgesToRemove: Array<{ fromId: string; toDep: string }> = [];

  function dfs(currId: string, path: string[]): void {
    visited.set(currId, 1);
    const currTask = taskById.get(currId);
    if (!currTask) {
      visited.set(currId, 2);
      return;
    }

    for (const dep of [...currTask.depends_on]) {
      const targetId = resolveDepTaskId(dep);
      if (!targetId) continue;

      const state = visited.get(targetId) ?? 0;
      if (state === 1) {
        // Siklus terdeteksi!
        const cycleStr = [...path, currId, targetId].join(' -> ');
        warnings.push(`Siklus dependensi terdeteksi (${cycleStr}). Memutus back-edge.`);
        cycleEdgesToRemove.push({ fromId: currId, toDep: dep });
        healed = true;
      } else if (state === 0) {
        dfs(targetId, [...path, currId]);
      }
    }

    visited.set(currId, 2);
  }

  for (const t of tasks) {
    const id = (t.taskId ?? '').toLowerCase();
    if ((visited.get(id) ?? 0) === 0) {
      dfs(id, []);
    }
  }

  // Terapkan pemutusan back-edge yang membentuk siklus
  for (const edge of cycleEdgesToRemove) {
    const t = taskById.get(edge.fromId);
    if (t) {
      t.depends_on = t.depends_on.filter((d) => d.toLowerCase() !== edge.toDep.toLowerCase());
    }
  }

  // 4. Topological Sort (Kahn's Algorithm) untuk penataan order deterministik
  // In-degree dihitung dari berapa banyak prerequisite task yang harus diselesaikan
  const inDegree = new Map<string, number>();
  const dependentsMap = new Map<string, string[]>(); // targetId -> list of tasks that depend on it

  for (const t of tasks) {
    const id = (t.taskId ?? '').toLowerCase();
    inDegree.set(id, 0);
    dependentsMap.set(id, []);
  }

  for (const t of tasks) {
    const id = (t.taskId ?? '').toLowerCase();
    for (const dep of t.depends_on) {
      const targetId = resolveDepTaskId(dep);
      if (targetId && targetId !== id) {
        inDegree.set(id, (inDegree.get(id) ?? 0) + 1);
        dependentsMap.get(targetId)?.push(id);
      }
    }
  }

  // Antrean task yang tidak memiliki prasyarat (in-degree = 0)
  const queue: TaskGen[] = [];
  for (const t of tasks) {
    const id = (t.taskId ?? '').toLowerCase();
    if ((inDegree.get(id) ?? 0) === 0) {
      queue.push(t);
    }
  }

  const sortedTasks: TaskGen[] = [];
  while (queue.length > 0) {
    // Ambil task dengan order terkecil terlebih dahulu untuk determinisme
    queue.sort((a, b) => a.order - b.order);
    const curr = queue.shift()!;
    sortedTasks.push(curr);

    const currId = (curr.taskId ?? '').toLowerCase();
    const dependents = dependentsMap.get(currId) ?? [];
    for (const depId of dependents) {
      const newDeg = (inDegree.get(depId) ?? 1) - 1;
      inDegree.set(depId, newDeg);
      if (newDeg === 0) {
        const depTask = taskById.get(depId);
        if (depTask) queue.push(depTask);
      }
    }
  }

  // Jika ada sisa task yang belum masuk sortedTasks (karena siklus yang tidak terurai),
  // masukkan sisa task tersebut di akhir
  if (sortedTasks.length < tasks.length) {
    const sortedSet = new Set(sortedTasks.map((t) => t.taskId));
    for (const t of tasks) {
      if (!sortedSet.has(t.taskId)) {
        sortedTasks.push(t);
      }
    }
  }

  // Tata ulang field `order` secara berurutan 1..N
  sortedTasks.forEach((t, idx) => {
    t.order = idx + 1;
  });

  return {
    tasks: sortedTasks,
    warnings,
    healed,
  };
}
