'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { BIEngine } from '@phozart/phz-engine';
import { getEngine } from '@/lib/engine';

const EngineContext = createContext<BIEngine | null>(null);

export function useEngine(): BIEngine {
  const engine = useContext(EngineContext);
  if (!engine) throw new Error('useEngine must be used within EngineProvider');
  return engine;
}

export function EngineProvider({ children }: { children: ReactNode }) {
  const engine = useMemo(() => getEngine(), []);
  return (
    <EngineContext.Provider value={engine}>
      {children}
    </EngineContext.Provider>
  );
}
