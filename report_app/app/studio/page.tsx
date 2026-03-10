'use client';

import { useMemo, useState, useEffect } from 'react';
import { DynamicDashboardStudio, DynamicKPIDesigner, DynamicReportDesigner } from '@/components/wrappers/DynamicEngineAdmin';
import { DynamicGridCreator } from '@/components/wrappers/DynamicGridCreator';
import { DATASETS } from '@/lib/datasets-registry';
import { getEngine } from '@/lib/engine';

type StudioTab = 'dashboard' | 'kpi' | 'report' | 'grid-creator';

export default function StudioPage() {
  const [activeTab, setActiveTab] = useState<StudioTab>('dashboard');
  const [salesData, setSalesData] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/datasets/sales_orders?mode=page&limit=1000&offset=0')
      .then(r => r.json()).then(body => setSalesData(body.data ?? [])).catch(() => {});
  }, []);

  const engine = useMemo(() => getEngine(), []);

  const tabs: { id: StudioTab; label: string; desc: string }[] = [
    { id: 'dashboard', label: 'Dashboard Studio', desc: 'Visual dashboard layout editor' },
    { id: 'kpi', label: 'KPI Designer', desc: 'Define and configure KPIs' },
    { id: 'report', label: 'Report Designer', desc: 'Design report layouts' },
    { id: 'grid-creator', label: 'Grid Creator', desc: 'Wizard for creating new grids' },
  ];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Studio</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Design tools for dashboards, KPIs, reports, and grids
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-[var(--text-muted)] mb-4">
        {tabs.find(t => t.id === activeTab)?.desc}
      </p>

      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-6 min-h-[600px]">
        {activeTab === 'dashboard' && (
          <DynamicDashboardStudio
            engine={engine}
            data={salesData}
          />
        )}
        {activeTab === 'kpi' && (
          <DynamicKPIDesigner
            engine={engine}
            data={salesData}
          />
        )}
        {activeTab === 'report' && (
          <DynamicReportDesigner
            engine={engine}
            data={salesData}
          />
        )}
        {activeTab === 'grid-creator' && (
          <DynamicGridCreator
            columns={DATASETS.sales_orders.columns}
            data={salesData}
          />
        )}
      </div>
    </div>
  );
}
