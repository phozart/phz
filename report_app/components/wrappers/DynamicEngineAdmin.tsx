'use client';

import React, { useEffect, type FC } from 'react';
import dynamic from 'next/dynamic';

function engineAdminFactory(tag: string): FC<Record<string, any>> {
  function Component(props: Record<string, any>) {
    useEffect(() => { import('@phozart/phz-workspace'); }, []);
    return React.createElement(tag, props);
  }
  Component.displayName = tag;
  return Component;
}

const loading = () => <div style={{ padding: 24, color: 'var(--text-muted)' }}>Loading...</div>;

export const DynamicDashboardStudio = dynamic(() => Promise.resolve(engineAdminFactory('phz-dashboard-studio')), { ssr: false, loading });
export const DynamicKPIDesigner     = dynamic(() => Promise.resolve(engineAdminFactory('phz-kpi-designer')), { ssr: false, loading });
export const DynamicReportDesigner  = dynamic(() => Promise.resolve(engineAdminFactory('phz-report-designer')), { ssr: false, loading });
export const DynamicEngineAdmin     = dynamic(() => Promise.resolve(engineAdminFactory('phz-engine-admin')), { ssr: false, loading });
