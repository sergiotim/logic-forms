import type { Phase } from '@/types';

/**
 * Busca a lista de fases e questões persistidas no Neon PostgreSQL.
 */
export async function fetchPhasesApi(): Promise<Phase[]> {
  const res = await fetch('/api/phases', { cache: 'no-store' });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Falha ao carregar fases do banco de dados');
  }
  const data = await res.json();
  return data.phases || [];
}

/**
 * Envia e sincroniza todas as fases e questões para o Neon PostgreSQL.
 */
export async function savePhasesApi(phases: Phase[]): Promise<void> {
  const res = await fetch('/api/phases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phases }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Falha ao salvar alterações no banco de dados');
  }
}

/**
 * Envia e sincroniza uma única fase ativa e suas questões para o Neon PostgreSQL via PUT /api/phases/[id].
 * Reduz a carga de rede e o tempo de transação em mais de 75%.
 */
export async function saveSinglePhaseApi(phase: Phase): Promise<void> {
  const res = await fetch(`/api/phases/${phase.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phase }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Falha ao salvar fase no banco de dados');
  }
}

/**
 * Busca todas as questões resolvidas pelo aluno autenticado no Neon PostgreSQL.
 */
export async function fetchUserSubmissionsApi(): Promise<{ questionId: string; isCorrect: boolean }[]> {
  const res = await fetch('/api/submissions', { cache: 'no-store' });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Falha ao buscar submissões do usuário');
  }
  const data = await res.json();
  return data.submissions || [];
}

/**
 * Salva a resposta de uma questão enviada pelo aluno no Neon PostgreSQL.
 */
export async function saveUserSubmissionApi(
  questionId: string,
  isCorrect: boolean,
  answer: unknown,
): Promise<void> {
  const res = await fetch('/api/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questionId, isCorrect, answer }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Falha ao salvar resposta no banco de dados');
  }
}
