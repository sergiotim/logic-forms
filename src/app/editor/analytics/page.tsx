import React from 'react';
import { getAnalyticsOverview } from '@/lib/analytics';
import { AnalyticsDashboard } from '@/components/editor/analytics/AnalyticsDashboard';
import { getStudentAnalyticsOverview } from '@/lib/analytics';
import { StudentAnalyticsDashboard } from '@/components/editor/analytics/StudentAnalyticsDashboard';

export const metadata = {
  title: 'Dashboard de Análise | Lógica Dinâmica',
  description: 'Painel analítico do professor para acompanhamento de desempenho da turma',
  title: 'Analytics dos Estudantes | Lógica Dinâmica',
  description: 'Painel analítico do professor para acompanhamento de desempenho individual e histórico de tentativas',
};

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const analyticsData = await getAnalyticsOverview();
  const analyticsData = await getStudentAnalyticsOverview();

  return <AnalyticsDashboard initialData={analyticsData} />;
  return <StudentAnalyticsDashboard initialData={analyticsData} />;
}

