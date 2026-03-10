'use client';

import React, { useEffect, type FC } from 'react';
import dynamic from 'next/dynamic';

function GridCreatorWrapper(props: Record<string, any>) {
  useEffect(() => { import('@phozart/phz-workspace'); }, []);
  return React.createElement('phz-grid-creator', props);
}

export const DynamicGridCreator = dynamic(
  () => Promise.resolve(GridCreatorWrapper),
  { ssr: false, loading: () => <div style={{ padding: 24, color: 'var(--text-muted)' }}>Loading wizard...</div> },
);
