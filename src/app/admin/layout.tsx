import AdminShell from './AdminShell';
import { getSession } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return <AdminShell sessionEmail={session?.email ?? null}>{children}</AdminShell>;
}