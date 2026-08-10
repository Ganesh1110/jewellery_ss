import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { compare } from 'bcryptjs';
import { prisma } from './prisma';

export const SESSION_COOKIE = 'sss_admin_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function login(password: string): Promise<{ email: string } | null> {
  const user = await prisma.user.findFirst();
  if (!user) return null;
  const ok = await compare(password, user.passwordHash);
  return ok ? { email: user.email } : null;
}

export async function createSession(email: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  await prisma.session.create({ data: { token, email, expiresAt: new Date(Date.now() + SESSION_TTL_MS) } });
  return token;
}

export async function getSession(): Promise<{ email: string } | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({ where: { token } });
  if (!session || session.expiresAt < new Date()) return null;
  return { email: session.email };
}

export async function destroySession(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return;
  await prisma.session.delete({ where: { token } }).catch(() => {});
}