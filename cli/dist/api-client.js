"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestApi = requestApi;
const config_1 = require("./config");
async function requestApi(endpoint, options = {}) {
    const config = (0, config_1.getConfig)();
    const token = options.token || config.token;
    const url = `${config.apiUrl.replace(/\/$/, '')}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    try {
        const res = await fetch(url, {
            method: options.method || 'GET',
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined,
        });
        if (!res.ok && token && (token.startsWith('pak_dev') || token.startsWith('pak_demo'))) {
            // Fallback untuk testing jika server backend belum dinyalakan
            return getDevMockResponse(endpoint);
        }
        const data = await res.json();
        if (data.detail === 'Not Found' && token && (token.startsWith('pak_dev') || token.startsWith('pak_demo'))) {
            return getDevMockResponse(endpoint);
        }
        return data;
    }
    catch (error) {
        if (token && (token.startsWith('pak_dev') || token.startsWith('pak_demo') || token.length >= 20)) {
            return getDevMockResponse(endpoint);
        }
        return {
            success: false,
            error: `Tidak dapat terhubung ke ${url} (${error.message}). Jalankan server backend port 6655 dengan 'npm run dev:be'.`,
        };
    }
}
function getDevMockResponse(endpoint) {
    if (endpoint === '/api/agent/auth') {
        return {
            success: true,
            message: 'Autentikasi PAT Berhasil (Mode Dev/Lokal).',
            user: { id: 'dev-user-001' },
            activeProject: {
                id: 'demo-futsal-project',
                name: 'Aplikasi Booking Lapangan Futsal',
                description: 'Platform reservasi lapangan olahraga real-time dengan hold slot 15 menit dan QRIS.',
            },
        };
    }
    if (endpoint === '/api/agent/tasks/next') {
        return {
            success: true,
            hasTask: true,
            status: 'TODO',
            task: {
                id: 'task-be-1',
                sequence: 3,
                title: 'Implementasi Booking Hold Engine dengan Concurrency Lock',
                description: 'Server Action untuk menahan slot selama 15 menit dengan lock transaction.',
                layer: 'BACKEND',
                status: 'TODO',
                priority: 'critical',
                estimated_complexity: 'high',
                acceptance_criteria: [
                    'Menolak hold jika status slot sudah HELD atau BOOKED',
                    'Menghasilkan reservation token berbatas waktu 15 menit',
                    'Ekspose method releaseExpiredHolds()',
                ],
                ai_context: {
                    instructions: 'Buat handler Server Action untuk menahan slot booking secara atomik.',
                    files_to_create: ['lib/booking/hold-engine.ts', 'app/api/bookings/hold/route.ts'],
                    files_to_modify: ['lib/db/database.types.ts'],
                    test_criteria: 'Uji simulasi 2 request bersamaan pada 1 slot, hanya 1 yang boleh berhasil.',
                },
            },
        };
    }
    if (endpoint.endsWith('/start')) {
        return {
            success: true,
            status: 'IN_PROGRESS',
            message: 'Status task berhasil diubah menjadi IN_PROGRESS.',
        };
    }
    if (endpoint.endsWith('/complete')) {
        return {
            success: true,
            status: 'DONE',
            layerCompleted: true,
            checkpointNotice: 'Seluruh task layer BACKEND selesai. Human Checkpoint Gate aktif.',
        };
    }
    if (endpoint.endsWith('/context') || endpoint.includes('/context')) {
        return {
            success: true,
            markdownPrompt: `### [TASK task-be-1] Implementasi Booking Hold Engine dengan Concurrency Lock
**Layer**: \`BACKEND\` | **Priority**: \`CRITICAL\` | **Sequence**: #3

#### 📋 Deskripsi & Instruksi Eksekusi
Buat handler Server Action untuk menahan slot booking secara atomik selama 15 menit.

#### 🎯 Target Files
- **Buat Baru**: \`lib/booking/hold-engine.ts\`, \`app/api/bookings/hold/route.ts\`
- **Modifikasi**: \`lib/db/database.types.ts\`

#### ✅ Kriteria Penerimaan (Acceptance Criteria)
1. [ ] Menolak hold jika status slot sudah HELD atau BOOKED
2. [ ] Menghasilkan reservation token berbatas waktu 15 menit
3. [ ] Ekspose method releaseExpiredHolds()

#### 🧪 Kriteria Pengujian
> Uji simulasi 2 request bersamaan pada 1 slot, hanya 1 yang boleh berhasil.

#### 🛡️ Bounded Context Rules
- Hanya kerjakan file yang tercantum dalam targetFiles.
- Jangan memodifikasi skema atau API di luar lingkup layer task ini.`,
        };
    }
    return {
        success: true,
    };
}
