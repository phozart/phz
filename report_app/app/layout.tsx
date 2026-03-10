'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeProvider, useTheme } from '@/components/ThemeProvider';
import { WorkspaceProvider } from '@/components/WorkspaceProvider';
import './globals.css';

const NAV_GROUPS = [
  {
    label: null,
    items: [{ href: '/', label: 'Home', icon: '◆' }],
  },
  {
    label: 'Shells',
    items: [
      { href: '/workspace', label: 'Admin', icon: '◈' },
      { href: '/author', label: 'Author', icon: '✎' },
      { href: '/viewer', label: 'Viewer', icon: '◎' },
    ],
  },
  {
    label: 'Data',
    items: [
      { href: '/datasets', label: 'Datasets', icon: '▤' },
      { href: '/explore', label: 'Explorer', icon: '⊞' },
      { href: '/scale', label: 'Scale Test', icon: '▥' },
    ],
  },
  {
    label: 'Core APIs',
    items: [
      { href: '/v3', label: 'Grid Core v3', icon: '★' },
    ],
  },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const options: Array<{ value: 'light' | 'dark' | 'system'; label: string }> = [
    { value: 'light', label: '☀' },
    { value: 'dark', label: '☾' },
    { value: 'system', label: '⚙' },
  ];
  return (
    <div className="flex gap-1">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => setTheme(o.value)}
          className={`px-2 py-1 rounded text-xs transition-colors ${
            theme === o.value
              ? 'bg-[var(--accent)] text-white'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
          title={o.value}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <aside className="w-56 shrink-0 border-r border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col">
      <div className="px-4 py-5 border-b border-[var(--border)]">
        <h1 className="text-lg font-bold tracking-tight">
          <span className="text-[var(--accent)]">PHZ</span> Report Studio
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Reporting platform</p>
      </div>
      <nav className="flex-1 py-2 px-2 overflow-y-auto">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-3' : ''}>
            {group.label && (
              <p className="px-3 py-1 text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold">
                {group.label}
              </p>
            )}
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  isActive(item.href)
                    ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-medium'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                <span className="text-xs opacity-60 w-4 text-center">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-[var(--border)] flex items-center justify-between">
        <span className="text-[10px] text-[var(--text-muted)]">Theme</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/login';

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <title>PHZ Report Studio</title>
        <meta name="description" content="Reporting application built with phz-grid" />
      </head>
      <body className={isLogin ? '' : 'flex h-screen overflow-hidden'}>
        <ThemeProvider>
          <WorkspaceProvider>
            {!isLogin && <Sidebar />}
            {isLogin ? children : (
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            )}
          </WorkspaceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
