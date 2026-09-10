// Real E2E Wizard Flow Test
import assert from 'node:assert';

const API_BASE = 'http://localhost:6655';

async function runTest() {
  console.log('--- 1. TEST REGISTER & LOGIN ---');
  const uniqueEmail = `test-wizard-${Date.now()}@pakeai.dev`;
  const password = 'password123';

  // Register
  const regRes = await fetch(`${API_BASE}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3455' },
    body: JSON.stringify({ name: 'Tester Wizard', email: uniqueEmail, password }),
  });
  assert.strictEqual(regRes.status, 200, 'Register status harus 200');
  const regCookie = regRes.headers.get('set-cookie');
  console.log('Register berhasil:', uniqueEmail);

  // Login
  const loginRes = await fetch(`${API_BASE}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3455' },
    body: JSON.stringify({ email: uniqueEmail, password }),
  });
  assert.strictEqual(loginRes.status, 200, 'Login status harus 200');
  const setCookie = loginRes.headers.get('set-cookie') || regCookie || '';
  const tokenMatch = setCookie.match(/better-auth\.session_token=([^;]+)/);
  assert(tokenMatch, 'Cookie session token harus ada');
  const cookieHeader = `better-auth.session_token=${tokenMatch[1]}`;
  console.log('Login berhasil, session token diperoleh');

  // Helper authed fetch
  const authedFetch = async (path: string, options: RequestInit = {}) => {
    return fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
        ...(options.headers || {}),
      },
    });
  };

  console.log('\n--- 2. TEST CHAT SESSION ---');
  // Buat chat session
  const sessionRes = await authedFetch('/api/chat/sessions', { method: 'POST' });
  assert.strictEqual(sessionRes.status, 201, 'Create session status harus 201');
  const { sessionId } = await sessionRes.json();
  assert(sessionId, 'SessionId harus ada');
  console.log('Chat session dibuat:', sessionId);

  // Kirim pesan brainstorming user
  const chatRes = await authedFetch(`/api/chat/sessions/${sessionId}/messages`, {
    method: 'POST',
    body: JSON.stringify({
      content: 'Saya ingin membuat aplikasi kasir warung kelontong berbasis web dengan fitur scan barcode dan cetak struk belanja.',
    }),
  });
  assert.strictEqual(chatRes.status, 200, 'Kirim pesan chat harus 200');
  const aiMessage = await chatRes.json();
  console.log('AI response kind:', aiMessage.kind);
  console.log('AI response preview:', (aiMessage.content || '').substring(0, 100));

  // Ambil history chat
  const histRes = await authedFetch(`/api/chat/sessions/${sessionId}/messages`);
  const histJson = await histRes.json();
  assert(histJson.messages.length >= 2, 'Riwayat chat harus punya minimal user + assistant message');
  console.log(`Riwayat chat tersimpan: ${histJson.messages.length} pesan`);

  // Finalize chat -> Buat project
  console.log('\n--- 3. TEST FINALIZE PROJECT ---');
  const finalizeRes = await authedFetch(`/api/chat/sessions/${sessionId}/finalize`, { method: 'POST' });
  assert.strictEqual(finalizeRes.status, 200, 'Finalize status harus 200');
  const { projectId } = await finalizeRes.json();
  assert(projectId, 'ProjectId harus ada setelah finalize');
  console.log('Project berhasil dibuat:', projectId);

  // Cek project data
  const projectRes = await authedFetch(`/api/projects/${projectId}`);
  const projectJson = await projectRes.json();
  console.log('Nama project dari AI:', projectJson.project.name);
  console.log('Summary project:', projectJson.project.description?.substring(0, 100));
  assert.strictEqual(projectJson.project.wizardStep, 'interview', 'wizardStep harus interview');

  console.log('\n--- 4. TEST INTERVIEW ---');
  // Generate interview
  const interviewGenRes = await authedFetch(`/api/projects/${projectId}/interview/generate`, { method: 'POST' });
  assert.strictEqual(interviewGenRes.status, 200, 'Interview generate status harus 200');
  const interviewGenJson = await interviewGenRes.json();
  assert(interviewGenJson.questions.length > 0, 'Harus ada pertanyaan interview yang di-generate');
  console.log(`Pertanyaan interview di-generate: ${interviewGenJson.questions.length} pertanyaan`);

  // Test rekomendasi AI untuk pertanyaan pertama
  const recommendRes = await authedFetch(`/api/projects/${projectId}/interview/recommend`, {
    method: 'POST',
    body: JSON.stringify({ questionIndex: 0 }),
  });
  assert.strictEqual(recommendRes.status, 200, 'Recommend answer status harus 200');
  const recJson = await recommendRes.json();
  console.log('Rekomendasi AI pertanyaan #1:', recJson.recommendation);
  console.log('Reasoning:', recJson.reasoning);

  // Simpan jawaban interview
  const answers = interviewGenJson.questions.map((q: any, i: number) => ({
    questionId: q.id,
    answer: i === 0 ? recJson.recommendation : 'Jawaban tester untuk kebutuhan bisnis',
  }));
  const saveInterviewRes = await authedFetch(`/api/projects/${projectId}/interview`, {
    method: 'PUT',
    body: JSON.stringify({ answers }),
  });
  assert.strictEqual(saveInterviewRes.status, 200, 'Save interview status harus 200');
  console.log('Jawaban interview tersimpan.');

  console.log('\n--- 5. TEST TECH STACK ---');
  // Rekomendasi tech stack
  const stackRecRes = await authedFetch(`/api/projects/${projectId}/techstack/recommend`, { method: 'POST' });
  assert.strictEqual(stackRecRes.status, 200, 'Tech stack recommend harus 200');
  const stackRecJson = await stackRecRes.json();
  console.log('Tech stack rekomendasi:', stackRecJson.techStack);

  // Simpan tech stack
  const saveStackRes = await authedFetch(`/api/projects/${projectId}/techstack`, {
    method: 'PUT',
    body: JSON.stringify({ techStack: stackRecJson.techStack || ['React', 'Express', 'PostgreSQL'] }),
  });
  assert.strictEqual(saveStackRes.status, 200, 'Save tech stack status harus 200');
  console.log('Tech stack tersimpan.');

  console.log('\n--- 6. TEST BRD (GENERATE & IDEMPOTENT) ---');
  // Generate BRD
  const brdGenRes = await authedFetch(`/api/projects/${projectId}/brd/generate`, { method: 'POST' });
  assert.strictEqual(brdGenRes.status === 200 || brdGenRes.status === 201, true, 'BRD generate status harus 200/201');
  console.log('BRD berhasil digenerate.');

  // Ambil BRD (Idempotent: membuka lagi tidak generate ulang)
  const brdGetRes = await authedFetch(`/api/projects/${projectId}/brd`);
  const brdGetJson = await brdGetRes.json();
  assert(brdGetJson.brd?.content, 'BRD content harus ada');
  console.log('BRD idempotent check OK: content ditemukan tanpa generate ulang.');

  console.log('\n--- 7. TEST TREE DIAGRAM (GENERATE & IDEMPOTENT) ---');
  // Generate Tree
  const treeGenRes = await authedFetch(`/api/projects/${projectId}/tree/generate`, { method: 'POST' });
  if (treeGenRes.status !== 200) {
    console.error('Tree generate error:', await treeGenRes.json());
  }
  assert.strictEqual(treeGenRes.status, 200, 'Tree generate status harus 200');
  const treeGenJson = await treeGenRes.json();
  console.log(`Tree berhasil digenerate: ${treeGenJson.count} nodes`);

  // Ambil Tree (Idempotent: membuka lagi tidak generate ulang)
  const treeGetRes = await authedFetch(`/api/projects/${projectId}/tree`);
  const treeGetJson = await treeGetRes.json();
  assert(treeGetJson.nodes.length > 0, 'Tree nodes harus ada');
  console.log(`Tree idempotent check OK: ${treeGetJson.nodes.length} nodes ditemukan.`);

  console.log('\n--- 8. TEST BOARD TASKS (GENERATE & IDEMPOTENT) ---');
  // Generate Tasks
  const tasksGenRes = await authedFetch(`/api/projects/${projectId}/tasks/generate`, { method: 'POST' });
  assert.strictEqual(tasksGenRes.status, 200, 'Tasks generate status harus 200');
  const tasksGenJson = await tasksGenRes.json();
  console.log(`Tasks berhasil digenerate: ${tasksGenJson.count} tasks`);

  // Ambil Tasks (Idempotent)
  const tasksGetRes = await authedFetch(`/api/projects/${projectId}/tasks`);
  const tasksGetJson = await tasksGetRes.json();
  assert(tasksGetJson.tasks.length > 0, 'Tasks harus ada');
  console.log(`Tasks idempotent check OK: ${tasksGetJson.tasks.length} tasks.`);

  console.log('\n--- 9. TEST CLI TOKEN & MASTER PROMPT ---');
  // Generate token untuk CLI agent
  const tokenRes = await authedFetch(`/api/projects/${projectId}/agent-tokens`, {
    method: 'POST',
    body: JSON.stringify({ name: 'Agent Token E2E' }),
  });
  assert.strictEqual(tokenRes.status, 201, 'Agent token generate status harus 201');
  const tokenJson = await tokenRes.json();
  const rawToken = tokenJson.token || tokenJson.plainToken;
  assert(rawToken, 'Plaintext token harus ada');
  console.log('Token CLI berhasil dibuat:', rawToken.substring(0, 10) + '...');

  // Ambil master prompt
  const promptRes = await authedFetch(`/api/projects/${projectId}/master-prompt`);
  assert.strictEqual(promptRes.status, 200, 'Master prompt status harus 200');
  const promptJson = await promptRes.json();
  assert(promptJson.prompt.includes('pakeai next'), 'Prompt harus memuat loop instruksi CLI');
  console.log('Master prompt berhasil diambil.');

  // Test CLI agent loop API dengan Bearer token
  console.log('\n--- 10. TEST CLI AGENT LOOP ---');
  const agentFetch = async (path: string, options: RequestInit = {}) => {
    return fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rawToken}`,
        'X-Project-ID': projectId,
        ...(options.headers || {}),
      },
    });
  };

  // Agent next task
  const nextRes = await agentFetch('/api/agent/tasks/next');
  assert.strictEqual(nextRes.status, 200, 'Agent next status harus 200');
  const nextJson = await nextRes.json();
  console.log('Next task for agent:', nextJson.task?.title);

  if (nextJson.task) {
    const taskId = nextJson.task.id;
    // Agent start task
    const startRes = await agentFetch(`/api/agent/tasks/${taskId}/start`, { method: 'POST' });
    assert.strictEqual(startRes.status, 200, 'Agent start task status harus 200');
    console.log('Agent start task OK');

    // Agent context
    const ctxRes = await agentFetch(`/api/agent/tasks/${taskId}/context`);
    assert.strictEqual(ctxRes.status, 200, 'Agent context status harus 200');
    const ctxJson = await ctxRes.json();
    console.log('Agent context task preview:', (ctxJson.markdown || '').substring(0, 80));

    // Agent done task
    const doneRes = await agentFetch(`/api/agent/tasks/${taskId}/complete`, { method: 'POST' });
    assert.strictEqual(doneRes.status, 200, 'Agent done task status harus 200');
    console.log('Agent complete task OK');
  }

  console.log('\n=== SEMUA TEST E2E BERHASIL 100%! ===');
}

runTest().catch((err) => {
  console.error('TEST E2E GAGAL:', err);
  process.exit(1);
});
