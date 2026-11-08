import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../prisma';

export interface AuthTokenPayload {
  userId: number;
  email: string;
  role: 'STUDENT' | 'INSTRUCTOR';
  jti: string;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        fullName: string;
        studentCode: string | null;
        role: 'STUDENT' | 'INSTRUCTOR';
      };
      tokenJti?: string;
      tokenExpiresAt?: Date;
    }
  }
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (
    !secret ||
    !secret.trim() ||
    (process.env.NODE_ENV === 'production' &&
      secret.trim() === 'replace-with-secure-random-jwt-secret')
  ) {
    throw new Error('JWT_SECRET must be configured with a non-empty secure value.');
  }
  return secret;
}
const JWT_SECRET = getJwtSecret();

export function signAuthToken(user: {
  id: number;
  email: string;
  role: 'STUDENT' | 'INSTRUCTOR';
}): string {
  const jti = crypto.randomUUID();
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      jti,
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

export async function revokeAuthToken(jti: string, expiresAt: Date): Promise<void> {
  await prisma.revokedToken.upsert({
    where: { jti },
    create: { jti, expiresAt },
    update: { expiresAt },
  });
}

export async function clearRevokedTokens(): Promise<void> {
  await prisma.revokedToken.deleteMany();
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Authentication required. Please provide a valid Bearer token.',
      code: 'UNAUTHORIZED',
    });
    return;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    res.status(401).json({
      error: 'Session token has been logged out or revoked.',
      code: 'TOKEN_REVOKED',
    });
    return;
  }

  let decoded: AuthTokenPayload;
  try {
    decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch {
    res.status(401).json({
      error: 'Invalid or expired authentication token.',
      code: 'UNAUTHORIZED',
    });
    return;
  }

  if (!decoded.jti || typeof decoded.exp !== 'number') {
    res.status(401).json({
      error: 'Invalid or expired authentication token.',
      code: 'UNAUTHORIZED',
    });
    return;
  }

  try {
    await prisma.revokedToken.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });

    const revokedToken = await prisma.revokedToken.findUnique({
      where: { jti: decoded.jti },
    });
    if (revokedToken) {
      res.status(401).json({
        error: 'Session token has been logged out or revoked.',
        code: 'TOKEN_REVOKED',
      });
      return;
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        studentCode: true,
        role: true,
      },
    });

    if (!dbUser) {
      res.status(401).json({
        error: 'Authenticated user no longer exists.',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    req.user = dbUser;
    req.tokenJti = decoded.jti;
    req.tokenExpiresAt = new Date(decoded.exp * 1000);
    next();
  } catch (error) {
    console.error('Authentication verification error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
}

export function requireRole(...allowedRoles: Array<'STUDENT' | 'INSTRUCTOR'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required.',
        code: 'UNAUTHORIZED',
      });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden: operation requires role ${allowedRoles.join(' or ')}.`,
        code: 'BR06_FORBIDDEN_ROLE',
      });
      return;
    }
    next();
  };
}
