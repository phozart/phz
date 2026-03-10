'use client';

import Link from 'next/link';

const SHELL_CARDS = [
  {
    href: '/workspace',
    title: 'Admin Shell',
    tag: '<phz-workspace>',
    description: 'Full admin workspace with sidebar navigation, catalog, data sources, grid admin, engine admin, alert rules, permissions.',
    role: 'Platform Admin',
    components: 15,
  },
  {
    href: '/author',
    title: 'Author Shell',
    tag: '<phz-editor-shell>',
    description: 'BI authoring environment for creating dashboards, reports, explorer queries with widget config, sharing, and alerts.',
    role: 'Content Author',
    components: 9,
  },
  {
    href: '/viewer',
    title: 'Viewer Shell',
    tag: '<phz-viewer-shell>',
    description: 'Read-only consumption shell for browsing catalogs, viewing dashboards and reports, data exploration.',
    role: 'Analyst',
    components: 9,
  },
];

const DATA_CARDS = [
  {
    href: '/datasets',
    title: 'Datasets',
    description: 'Browse datasets with PhzGrid rendering, column definitions, and criteria filters.',
    packages: ['phz-react', 'phz-core'],
  },
  {
    href: '/explore',
    title: 'Explorer',
    description: 'Visual query builder using workspace explore APIs — field palette, drop zones, chart suggestions.',
    packages: ['phz-workspace/explore', 'phz-workspace/templates'],
  },
  {
    href: '/analytics',
    title: 'Analytics Dashboard',
    description: 'Fresh dashboard using <phz-grid-view> from the viewer package with KPIs, charts, and a clean data grid.',
    packages: ['phz-viewer', 'phz-widgets'],
  },
  {
    href: '/scale',
    title: 'Scale Test',
    description: 'Performance benchmarks: client/server/virtual/DuckDB modes with configurable row counts.',
    packages: ['phz-react', 'phz-duckdb'],
  },
  {
    href: '/v3',
    title: 'Grid Core v3',
    description: 'Sprint 6 core APIs: undo/redo, subscribe/subscribeSelector, column pinning, DuckDB push-down.',
    packages: ['phz-core', 'phz-duckdb'],
  },
];

export default function HomePage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          <span className="text-[var(--accent)]">PHZ</span> Package Test App
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Production-style integration test for @phozart packages.
          Each page mounts real Lit web components and package APIs.
        </p>
      </div>

      {/* Three-Shell Architecture */}
      <section className="mb-10">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-4">
          Three-Shell Architecture
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SHELL_CARDS.map(card => (
            <Link
              key={card.href}
              href={card.href}
              className="group block bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-5 hover:border-[var(--accent)] transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                  {card.title}
                </h3>
                <span className="text-[10px] bg-[var(--accent)]/15 text-[var(--accent)] px-2 py-0.5 rounded-full">
                  {card.role}
                </span>
              </div>
              <code className="text-xs font-mono text-[var(--accent)] block mb-2">{card.tag}</code>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{card.description}</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-3">{card.components} Lit components</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Data & API Tests */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-4">
          Data & API Tests
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DATA_CARDS.map(card => (
            <Link
              key={card.href}
              href={card.href}
              className="group block bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-5 hover:border-[var(--accent)] transition-colors"
            >
              <h3 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors mb-2">
                {card.title}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">{card.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {card.packages.map(pkg => (
                  <span key={pkg} className="text-[10px] font-mono bg-[var(--bg-tertiary)] text-[var(--text-muted)] px-2 py-0.5 rounded">
                    @phozart/{pkg}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
