import React from 'react';
import { getStudentAnalyticsOverview } from '@/lib/analytics';
import { StudentAnalyticsDashboard } from '@/components/editor/analytics/StudentAnalyticsDashboard';

export const metadata = {
  title: 'Analytics dos Estudantes | Lógica Dinâmica',
  description: 'Painel analítico do professor para acompanhamento de desempenho individual e histórico de tentativas',
};

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const analyticsData = await getStudentAnalyticsOverview();

  return <StudentAnalyticsDashboard initialData={analyticsData} />;
}
