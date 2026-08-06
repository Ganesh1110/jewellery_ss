'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Plus, Package, LogOut, ShieldCheck } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // On login page, don't show admin navbar
  const isLoginPage = pathname === '/admin/login';

  const handleLogout = () => {
    document.cookie = 'sss_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/admin/login');
    router.refresh();
  };

  if (isLoginPage) {
    return <div className="min-h-screen bg-cream-50">{children}</div>;
  }

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Add Product', href: '/admin/products/new', icon: Plus },
    { name: 'Inventory', href: '/admin/inventory', icon: Package },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 font-sans text-neutral-900">
      {/* Dedicated Admin Header */}
      <header className="bg-neutral-950 text-cream-50 sticky top-0 z-50 border-b border-neutral-800 shadow-medium">
        <div className="container py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2 font-heading text-heading-md text-cream-50">
              <ShieldCheck className="h-5 w-5 text-gold-400" />
              <span>Store Owner Console</span>
            </Link>
            <span className="badge-gold text-[10px] hidden sm:inline-block">Admin Mode</span>
          </div>

          {/* Admin Navigation */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-body-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gold-500 text-white'
                      : 'text-cream-50/70 hover:text-cream-50 hover:bg-neutral-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.name}</span>
                </Link>
              );
            })}

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-body-sm font-medium text-cream-50/70 hover:text-red-400 hover:bg-neutral-800 transition-colors ml-2"
              title="Log out of admin portal"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Admin Content */}
      <main className="flex-1">{children}</main>

      {/* Dedicated Admin Footer */}
      <footer className="bg-neutral-950 text-cream-50/50 py-6 border-t border-neutral-800 text-center text-caption">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Store Owner Management Suite. Confidential & Encrypted.</p>
          <div className="flex items-center gap-4">
            <Link href="/" target="_blank" className="hover:text-gold-400 transition-colors">
              View Live Storefront ↗
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
