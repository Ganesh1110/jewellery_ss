'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Plus, Package, LogOut, Eye, ShieldCheck, ShoppingBag, Settings } from 'lucide-react';

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
    { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 font-sans text-neutral-900">
      {/* Dedicated Admin Header */}
      <header className="bg-neutral-950 text-cream-50 sticky top-0 z-50 border-b border-neutral-800">
        <div className="container h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/admin" className="flex items-center gap-2.5 font-heading text-heading-sm text-cream-50">
              <ShieldCheck className="h-5 w-5 text-gold-400" />
              <span className="truncate">Store Console</span>
            </Link>
            <span className="badge-gold text-[10px] hidden sm:inline-block flex-shrink-0">Admin Mode</span>
          </div>

          {/* Admin Navigation */}
          <nav className="flex items-center gap-0.5 sm:gap-1 lg:px-0 px-1 -mx-1 overflow-x-auto" aria-label="Admin navigation">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  aria-label={isActive ? `${item.name} (current)` : item.name}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 h-10 rounded-md text-body-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                    isActive
                      ? 'bg-gold-500 text-white'
                      : 'text-cream-50/70 hover:text-cream-50 hover:bg-neutral-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{item.name}</span>
                </Link>
              );
            })}

            <Link
              href="/"
              target="_blank"
              className="hidden md:flex items-center gap-1.5 px-3 h-10 rounded-md text-body-sm font-medium text-cream-50/70 hover:text-cream-50 hover:bg-neutral-800 transition-colors"
              title="View live storefront in a new tab"
            >
              <Eye className="h-4 w-4" />
              <span>Storefront</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 h-10 rounded-md text-body-sm font-medium text-cream-50/70 hover:text-red-400 hover:bg-neutral-800 transition-colors"
              title="Log out of admin portal"
              aria-label="Log out"
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
        </div>
      </footer>
    </div>
  );
}