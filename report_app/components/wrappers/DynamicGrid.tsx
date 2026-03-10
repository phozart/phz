'use client';

import dynamic from 'next/dynamic';

export const DynamicPhzGrid = dynamic(
  () => import('@phozart/phz-react/grid').then((m) => m.PhzGrid),
  { ssr: false, loading: () => <div style={{ padding: 24, color: 'var(--text-muted)' }}>Loading grid...</div> },
);

export const DynamicPhzCriteria = dynamic(
  () => import('@phozart/phz-react/criteria').then((m) => m.PhzSelectionCriteria),
  { ssr: false, loading: () => <div style={{ padding: 12, color: 'var(--text-muted)' }}>Loading filters...</div> },
);

export const DynamicPhzGridAdmin = dynamic(
  () => import('@phozart/phz-react/admin').then((m) => m.PhzGridAdmin),
  { ssr: false },
);
