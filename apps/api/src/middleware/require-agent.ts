// Verifikasi PAT (Personal Access Token) untuk endpoint agent (CLI).
// Isolasi project ditegakkan di sini: agent hanya bisa akses projectId dari token.
import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { prisma } from '../lib/prisma.js';

export interface AgentRequest extends Request {
  agent: {
    tokenId: string;
    userId: string;
    projectId: string;
    projectName: string;
  };
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function requireAgent(req: Request, res: Response, next: NextFunction) {
  const auth = req.header('authorization') ?? '';
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({ error: 'Header Authorization: Bearer <token> wajib.' });
  }
  const token = match[1].trim();
  if (!token.startsWith('pak_')) {
    return res.status(401).json({ error: 'Format token tidak valid.' });
  }

  const tokenHash = hashToken(token);
  const record = await prisma.agentToken.findUnique({
    where: { tokenHash },
    include: { project: true },
  });

  if (!record || record.isRevoked) {
    return res.status(401).json({ error: 'Token tidak dikenali atau sudah dicabut.' });
  }

  // Update last_used_at (fire-and-forget; tidak boleh menggagalkan request).
  prisma.agentToken
    .update({ where: { id: record.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  (req as AgentRequest).agent = {
    tokenId: record.id,
    userId: record.userId,
    projectId: record.projectId,
    projectName: record.project.name,
  };
  next();
}
