import React from 'react';
import { getAnalyticsOverview } from '@/lib/analytics';
import { AnalyticsDashboard } from '@/components/editor/analytics/AnalyticsDashboard';

export const metadata = {
  title: 'Dashboard de Análise | Lógica Dinâmica',
  description: 'Painel analítico do professor para acompanhamento de desempenho da turma',
};

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const analyticsData = await getAnalyticsOverview();

  return <AnalyticsDashboard initialData={analyticsData} />;
}

