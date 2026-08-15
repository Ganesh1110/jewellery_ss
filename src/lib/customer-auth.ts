import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { compare, hash } from 'bcryptjs';
import { prisma } from './prisma';

export const CUSTOMER_SESSION_COOKIE = 'sss_customer_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export async function createCustomer(name: string, email: string, password: string) {
  const cleanEmail = email.toLowerCase().trim();
  const existing = await prisma.customer.findUnique({ where: { email: cleanEmail } });
  if (existing) {
    throw new Error('An account with this email address already exists. Please sign in.');
  }

  const passwordHash = await hash(password, 10);
  const customer = await prisma.customer.create({
    data: {
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
    },
  });

  const token = await createCustomerSession(customer.email);
  return { customer: { id: customer.id, name: customer.name, email: customer.email }, token };
}

export async function loginCustomer(email: string, password: string) {
  const cleanEmail = email.toLowerCase().trim();
  const customer = await prisma.customer.findUnique({ where: { email: cleanEmail } });
  if (!customer) {
    return null;
  }

  const ok = await compare(password, customer.passwordHash);
  if (!ok) return null;

  const token = await createCustomerSession(customer.email);
  return { customer: { id: customer.id, name: customer.name, email: customer.email }, token };
}

export async function createCustomerSession(email: string): Promise<string> {
  const token = `cust_${randomBytes(32).toString('hex')}`;
  await prisma.session.create({ data: { token, email, expiresAt: new Date(Date.now() + SESSION_TTL_MS) } });
  return token;
}

export async function getCustomerSession() {
  const cookieStore = cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({ where: { token } });
  if (!session || session.expiresAt < new Date()) return null;

  const customer = await prisma.customer.findUnique({ where: { email: session.email } });
  if (!customer) return null;

  return { id: customer.id, name: customer.name, email: customer.email };
}

export async function destroyCustomerSession(): Promise<void> {
  const cookieStore = cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return;
  await prisma.session.delete({ where: { token } }).catch(() => {});
}
