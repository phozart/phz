'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import type { DataAdapter, DataSourceSchema } from '@phozart/phz-workspace';
import { ReportAppDataAdapter } from '@/lib/workspace-data-adapter';

interface WorkspaceContextValue {
  dataAdapter: DataAdapter;
  schemas: Record<string, DataSourceSchema>;
  loading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be within WorkspaceProvider');
  return ctx;
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const dataAdapter = useMemo(() => new ReportAppDataAdapter(), []);
  const [schemas, setSchemas] = useState<Record<string, DataSourceSchema>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const sources = await dataAdapter.listDataSources();
        const schemaMap: Record<string, DataSourceSchema> = {};
        for (const src of sources) {
          schemaMap[src.id] = await dataAdapter.getSchema(src.id);
        }
        setSchemas(schemaMap);
      } catch {
        // schemas will be empty — offline mode
      } finally {
        setLoading(false);
      }
    })();
  }, [dataAdapter]);

  const value = useMemo(() => ({ dataAdapter, schemas, loading }), [dataAdapter, schemas, loading]);

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}
