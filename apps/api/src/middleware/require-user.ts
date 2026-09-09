// Verifikasi session user (cookie Better Auth) untuk endpoint user.
import type { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/auth.js';

export interface AuthedRequest extends Request {
  userId: string;
  userEmail?: string;
}

export async function requireUser(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return res.status(401).json({ error: 'Tidak terautentikasi. Silakan login.' });
    }
    (req as AuthedRequest).userId = session.user.id;
    (req as AuthedRequest).userEmail = session.user.email;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session tidak valid.' });
  }
}
