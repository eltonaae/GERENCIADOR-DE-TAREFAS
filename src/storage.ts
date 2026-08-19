import {
  Issue,
  QualityTask,
  DailyLogEntry,
  HospitalLocation,
  DEFAULT_SECTOR_TEMPLATES,
  DailyMetricDefinition,
  SectorLeaderInfo,
  DEFAULT_SECTOR_LEADERS,
  getEffectiveStatus,
  getEffectiveTaskStatus,
} from './types';

const ISSUES_STORAGE_KEY = 'quality_lab_issues_v1';
const TASKS_STORAGE_KEY = 'quality_lab_tasks_v1';
const DAILY_LOGS_STORAGE_KEY = 'quality_lab_daily_logs_v1';
const CUSTOM_TEMPLATES_STORAGE_KEY = 'quality_lab_custom_templates_v1';
const SECTOR_LEADERS_STORAGE_KEY = 'quality_lab_sector_leaders_v1';

// Initial realistic demo daily logs for August 2026 (current month)
export const INITIAL_DEMO_DAILY_LOGS: DailyLogEntry[] = [
  // Hoje - 2026-08-19
  {
    id: 'dlog-20260819-uti-m',
    date: '2026-08-19',
    sector: 'UTI',
    shift: 'Turno Manhã',
    collectorName: 'Enf. Juliana Ramos (COREN 14589)',
    contributors: ['Téc. Paulo Mendes', 'Téc. Luciana Cruz'],
    verifiedBy: 'Enf. Carlos Prado',
    metrics: {
      censo_ocupacao: 10,
      adesao_protocolos_prevencao: 100,
      intercorrencias_graves: 0,
      lesao_por_pressao_nova: 0,
      adesao_higiene_maos: 98,
    },
    totalAdverseEvents: 0,
    hasDeviations: false,
    notes: 'Rotina da manhã sem intercorrências. 100% de adesão à checagem de decúbito e higiene oral.',
    createdAt: '2026-08-19T11:45:00.000Z',
  },
  {
    id: 'dlog-20260819-fat-c',
    date: '2026-08-19',
    sector: 'Faturamento & Administrativo',
    shift: 'Horário Comercial / Integral',
    collectorName: 'André Souza (Analista de Faturamento)',
    contributors: ['Mariana Lins (Aux. Administrativo)'],
    metrics: {
      contas_guias_processadas: 48,
      fechamento_no_prazo: 100,
      inconsistencias_identificadas: 1,
      pendencias_autorizacao_convenio: 2,
    },
    totalAdverseEvents: 0,
    hasDeviations: false,
    notes: 'Lote de faturamento da Unimed fechado com antecedência. 1 guia com código trocado corrigida a tempo.',
    createdAt: '2026-08-19T12:15:00.000Z',
  },
  {
    id: 'dlog-20260819-far-m',
    date: '2026-08-19',
    sector: 'Farmácia',
    shift: 'Horário Comercial / Integral',
    collectorName: 'Dra. Marina Santos (CRF 2234)',
    contributors: ['Farm. Lucas Silveira', 'Aux. Joana Ribeiro'],
    metrics: {
      temp_geladeira_termo: 4.8,
      prescricoes_avaliadas: 52,
      intervencoes_orientacoes: 3,
      ruptura_medicamentos_criticos: 0,
      tempo_atendimento_urgente: 11,
    },
    totalAdverseEvents: 0,
    hasDeviations: false,
    notes: 'Temperatura da geladeira estabilizada após calibragem preventiva. 3 esclarecimentos de dosagem realizados.',
    createdAt: '2026-08-19T12:00:00.000Z',
  },
  {
    id: 'dlog-20260819-cc-m',
    date: '2026-08-19',
    sector: 'Centro Cirúrgico',
    shift: 'Turno Manhã',
    collectorName: 'Enf. Roberto Lima',
    contributors: ['Circulante Débora Castro', 'Instrumentador Felipe'],
    metrics: {
      cirurgias_realizadas: 7,
      checklist_cirurgia_segura: 100,
      atrasos_inicio_sala: 1,
      cirurgias_canceladas: 0,
      recontagem_compressas_conforme: 100,
    },
    totalAdverseEvents: 0,
    hasDeviations: true,
    notes: '1 atraso de 20 min na sala 03 por atraso de laudo laboratorial. Cirurgias transcorreram com segurança.',
    createdAt: '2026-08-19T13:30:00.000Z',
  },
  {
    id: 'dlog-20260819-lab-c',
    date: '2026-08-19',
    sector: 'Laboratório & Exames',
    shift: 'Horário Comercial / Integral',
    collectorName: 'Dr. Fernando Dias (Biomédico)',
    contributors: ['Téc. Lab. Gabriela Martins'],
    metrics: {
      exames_laudos_liberados: 124,
      tempo_urgencias_prazo: 99,
      recoletas_solicitadas: 0,
      calibracao_controle_qualidade: 100,
    },
    totalAdverseEvents: 0,
    hasDeviations: false,
    notes: 'Aparelhos de hematologia calibrados pela manhã. 100% dos laudos de urgência emitidos no tempo preconizado.',
    createdAt: '2026-08-19T13:00:00.000Z',
  },
  {
    id: 'dlog-20260819-hig-m',
    date: '2026-08-19',
    sector: 'Higienização & Hotelaria',
    shift: 'Turno Manhã',
    collectorName: 'Marta Silveira',
    contributors: ['Antônio Rocha', 'Rosa de Lima'],
    metrics: {
      leitos_higienizados: 8,
      tempo_medio_liberacao_leito: 34,
      checklist_limpeza_conforme: 100,
      abastecimento_insumos_ok: 100,
    },
    totalAdverseEvents: 0,
    hasDeviations: false,
    notes: 'Tempo médio de liberação em 34 minutos, dentro da meta de 45 min.',
    createdAt: '2026-08-19T12:30:00.000Z',
  },

  // Ontem - 2026-08-18
  {
    id: 'dlog-20260818-uti-12h',
    date: '2026-08-18',
    sector: 'UTI',
    shift: 'Plantão 12h (Dia)',
    collectorName: 'Enf. Juliana Ramos',
    metrics: {
      censo_ocupacao: 10,
      adesao_protocolos_prevencao: 95,
      intercorrencias_graves: 0,
      lesao_por_pressao_nova: 1,
      adesao_higiene_maos: 94,
    },
    totalAdverseEvents: 1,
    hasDeviations: true,
    notes: '1 LPP estágio 1 detectada em paciente admitido do PS; iniciado protocolo de placa de hidrocolóide.',
    createdAt: '2026-08-18T18:00:00.000Z',
  },
  {
    id: 'dlog-20260818-far-12h',
    date: '2026-08-18',
    sector: 'Farmácia',
    shift: 'Horário Comercial / Integral',
    collectorName: 'Dr. Lucas Silveira',
    metrics: {
      temp_geladeira_termo: 5.1,
      prescricoes_avaliadas: 68,
      intervencoes_orientacoes: 4,
      ruptura_medicamentos_criticos: 0,
      tempo_atendimento_urgente: 13,
    },
    totalAdverseEvents: 0,
    hasDeviations: false,
    notes: 'Rotina de dispensação sem gargalos.',
    createdAt: '2026-08-18T18:30:00.000Z',
  },
  {
    id: 'dlog-20260818-cc-12h',
    date: '2026-08-18',
    sector: 'Centro Cirúrgico',
    shift: 'Plantão 12h (Dia)',
    collectorName: 'Enf. Roberto Lima',
    metrics: {
      cirurgias_realizadas: 9,
      checklist_cirurgia_segura: 100,
      atrasos_inicio_sala: 0,
      cirurgias_canceladas: 1,
      recontagem_compressas_conforme: 100,
    },
    totalAdverseEvents: 0,
    hasDeviations: true,
    notes: '1 cirurgia eletiva suspensa a pedido do próprio paciente com febre.',
    createdAt: '2026-08-18T19:00:00.000Z',
  },
  {
    id: 'dlog-20260818-int-12h',
    date: '2026-08-18',
    sector: 'Internação',
    shift: 'Plantão 12h (Dia)',
    collectorName: 'Enf. Patrícia Gomes',
    metrics: {
      censo_ocupacao: 27,
      altas_hospitalares_dia: 11,
      avaliacao_risco_atualizada: 100,
      quedas: 0,
    },
    totalAdverseEvents: 0,
    hasDeviations: false,
    notes: '100% de pulseiras checadas na passagem de rotina.',
    createdAt: '2026-08-18T19:15:00.000Z',
  },

  // 2026-08-17
  {
    id: 'dlog-20260817-uti-12h',
    date: '2026-08-17',
    sector: 'UTI',
    shift: 'Plantão 12h (Dia)',
    collectorName: 'Enf. Carlos Prado',
    metrics: {
      censo_ocupacao: 9,
      adesao_protocolos_prevencao: 100,
      intercorrencias_graves: 0,
      lesao_por_pressao_nova: 0,
      adesao_higiene_maos: 96,
    },
    totalAdverseEvents: 0,
    hasDeviations: false,
    notes: 'Todos os leitos em conformidade.',
    createdAt: '2026-08-17T18:00:00.000Z',
  },
  {
    id: 'dlog-20260817-rec-12h',
    date: '2026-08-17',
    sector: 'Recepção / Atendimento',
    shift: 'Horário Comercial / Integral',
    collectorName: 'Camila Duarte',
    metrics: {
      total_atendimentos: 82,
      tempo_espera_atendimento_min: 7,
      fichas_sem_erro_cadastro: 100,
      desistencias_sem_atendimento: 0,
      queixas_ou_reclamacoes: 0,
    },
    totalAdverseEvents: 0,
    hasDeviations: false,
    notes: 'Tempo de espera médio de 7 minutos na recepção.',
    createdAt: '2026-08-17T18:30:00.000Z',
  },
  {
    id: 'dlog-20260817-far-12h',
    date: '2026-08-17',
    sector: 'Farmácia',
    shift: 'Horário Comercial / Integral',
    collectorName: 'Dra. Marina Santos',
    metrics: {
      temp_geladeira_termo: 4.9,
      prescricoes_avaliadas: 74,
      intervencoes_orientacoes: 2,
      ruptura_medicamentos_criticos: 0,
      tempo_atendimento_urgente: 10,
    },
    totalAdverseEvents: 0,
    hasDeviations: false,
    notes: 'Temperatura diária registrada.',
    createdAt: '2026-08-17T18:00:00.000Z',
  },
];

// Initial realistic demo issues for hospital quality testing
export const INITIAL_DEMO_ISSUES: Issue[] = [
  {
    id: 'demo-1',
    code: 'RF-101',
    problem: 'Termômetro da geladeira de medicamentos apresentou oscilação de temperatura fora da faixa recomendada (2°C a 8°C).',
    location: 'Farmácia',
    involvedSectors: ['Farmácia', 'Manutenção & Infraestrutura', 'Apoio / Qualidade'],
    nature: ['Equipamento', 'Processo'],
    hasImpact: true,
    impactTypes: ['Operação', 'Financeiro'],
    priority: 'Crítica',
    responsible: 'Dra. Marina Santos (Farmacêutica)',
    deadline: '2026-08-15', // Overdue relative to 2026-08-19
    actionNeeded: 'Acionar manutenção para ajuste urgente do termostato e transferir lotes sensíveis para geladeira reserva.',
    status: 'Em andamento',
    createdAt: '2026-08-14T09:30:00.000Z',
    isDemo: true,
  },
  {
    id: 'demo-2',
    code: 'RF-102',
    problem: 'Atraso na liberação do laudo de hemograma de urgência para paciente aguardando conduta cirúrgica.',
    location: 'Centro Cirúrgico',
    involvedSectors: ['Centro Cirúrgico', 'Laboratório & Exames', 'Apoio / Qualidade'],
    nature: ['Comunicação', 'Processo'],
    hasImpact: true,
    impactTypes: ['Paciente', 'Prazo'],
    priority: 'Alta',
    responsible: 'Enf. Roberto Lima (Coordenação)',
    deadline: '2026-08-18', // Overdue
    actionNeeded: 'Alinhar com o laboratório protocolo de priorização e verificar integração do sistema de laudos.',
    status: 'Aberto',
    createdAt: '2026-08-17T14:15:00.000Z',
    isDemo: true,
  },
  {
    id: 'demo-3',
    code: 'RF-103',
    problem: 'Falta de pulseiras de identificação com código de barras na triagem inicial no período noturno.',
    location: 'Recepção / Atendimento',
    involvedSectors: ['Recepção / Atendimento', 'Enfermagem & Posto'],
    nature: ['Processo', 'Tecnologia'],
    hasImpact: true,
    impactTypes: ['Paciente', 'Operação'],
    priority: 'Média',
    responsible: 'Camila Duarte (Supervisão de Atendimento)',
    deadline: '2026-08-12',
    actionNeeded: 'Reabastecido estoque na recepção e criado checklist de passagem de rotina para verificação diária de insumos.',
    status: 'Resolvido',
    createdAt: '2026-08-10T08:00:00.000Z',
    resolvedAt: '2026-08-12T16:00:00.000Z',
    isDemo: true,
  },
  {
    id: 'demo-4',
    code: 'RF-104',
    problem: 'Bomba de infusão do leito 04 da UTI com alarme intermitente sem causa aparente.',
    location: 'UTI',
    involvedSectors: ['UTI', 'Manutenção & Infraestrutura', 'Enfermagem & Posto'],
    nature: ['Equipamento', 'Estrutura'],
    hasImpact: false,
    impactTypes: [],
    priority: 'Alta',
    responsible: 'Eng. Lucas Ferraz (Engenharia Clínica)',
    deadline: '2026-08-24', // Future deadline
    actionNeeded: 'Equipamento recolhido para bancada de testes; substituído por bomba reserva aprovada pela equipe.',
    status: 'Em andamento',
    createdAt: '2026-08-18T11:20:00.000Z',
    isDemo: true,
  },
  {
    id: 'demo-5',
    code: 'RF-105',
    problem: 'Guia de autorização sem código de procedimento correto retida no faturamento.',
    location: 'Faturamento & Administrativo',
    involvedSectors: ['Faturamento & Administrativo', 'Recepção / Atendimento'],
    nature: ['Documento', 'Pessoas'],
    hasImpact: false,
    impactTypes: [],
    priority: 'Baixa',
    responsible: 'André Souza (Analista de Faturamento)',
    deadline: '2026-08-28', // Future deadline
    actionNeeded: 'Reforçar com a recepção a conferência do código antes da inclusão no sistema.',
    status: 'Aberto',
    createdAt: '2026-08-19T10:00:00.000Z',
    isDemo: true,
  },
];

// Initial realistic demo tasks for task management
export const INITIAL_DEMO_TASKS: QualityTask[] = [
  {
    id: 'task-1',
    title: 'Recalibração do sensor do termostato e teste de 24h na geladeira principal',
    date: '2026-08-19', // Hoje
    involvedSectors: ['Manutenção & Infraestrutura', 'Farmácia'],
    responsible: 'Carlos Nogueira (Manutenção)',
    priority: 'Crítica',
    status: 'Em andamento',
    issueId: 'demo-1',
    issueCode: 'RF-101',
    checklist: [
      { id: 'sub-1', text: 'Instalar medidor para checagem contínua', done: true },
      { id: 'sub-2', text: 'Realizar ajuste fino do sensor térmico', done: true },
      { id: 'sub-3', text: 'Emitir comprovante de funcionamento para o setor', done: false },
    ],
    notes: 'Prioridade para garantir a conservação adequada dos medicamentos.',
    createdAt: '2026-08-15T10:00:00.000Z',
  },
  {
    id: 'task-2',
    title: 'Conferência de passagem de rotina e reposição de insumos no atendimento',
    date: '2026-08-19', // Hoje
    involvedSectors: ['Recepção / Atendimento', 'Enfermagem & Posto', 'Apoio / Qualidade'],
    responsible: 'Camila Duarte (Supervisão)',
    priority: 'Média',
    status: 'Concluída',
    issueId: 'demo-3',
    issueCode: 'RF-103',
    checklist: [
      { id: 'sub-4', text: 'Conferência física do estoque mínimo de pulseiras', done: true },
      { id: 'sub-5', text: 'Validação da rotina pelo líder de equipe', done: true },
    ],
    notes: 'Rotina preventiva implementada com sucesso no setor.',
    createdAt: '2026-08-12T08:00:00.000Z',
    completedAt: '2026-08-19T11:00:00.000Z',
  },
  {
    id: 'task-3',
    title: 'Alinhamento do fluxo de priorização de exames urgentes com Laboratório',
    date: '2026-08-20', // Amanhã
    involvedSectors: ['Centro Cirúrgico', 'Laboratório & Exames', 'Apoio / Qualidade'],
    responsible: 'Enf. Roberto Lima',
    priority: 'Alta',
    status: 'Pendente',
    issueId: 'demo-2',
    issueCode: 'RF-102',
    checklist: [
      { id: 'sub-6', text: 'Elaborar resumo do fluxo de exames urgentes', done: true },
      { id: 'sub-7', text: 'Apresentar para equipe do laboratório e médicos', done: false },
      { id: 'sub-8', text: 'Divulgar orientações para os setores envolvidos', done: false },
    ],
    notes: 'Objetivo de agilizar a liberação de resultados urgentes.',
    createdAt: '2026-08-18T14:00:00.000Z',
  },
  {
    id: 'task-4',
    title: 'Higienização e checagem periódica dos leitos da UTI',
    date: '2026-08-21', // Próximos dias
    involvedSectors: ['Higienização & Hotelaria', 'UTI', 'Enfermagem & Posto'],
    responsible: 'Marta Silveira (Encarregada de Higiene)',
    priority: 'Alta',
    status: 'Pendente',
    checklist: [
      { id: 'sub-9', text: 'Verificar produtos adequados de limpeza hospitalar', done: false },
      { id: 'sub-10', text: 'Aplicar checklist de liberação do leito limpo', done: false },
    ],
    notes: 'Rotina de cuidado contínuo com os ambientes de atendimento.',
    createdAt: '2026-08-19T09:00:00.000Z',
  },
  {
    id: 'task-5',
    title: 'Treinamento sobre preenchimento de guias e rotinas com novos colaboradores',
    date: '2026-08-16', // Atrasada
    involvedSectors: ['Faturamento & Administrativo', 'Recepção / Atendimento', 'Apoio / Qualidade'],
    responsible: 'André Souza',
    priority: 'Média',
    status: 'Pendente',
    issueId: 'demo-5',
    issueCode: 'RF-105',
    checklist: [
      { id: 'sub-11', text: 'Preparar material com exemplos de guias do dia a dia', done: true },
      { id: 'sub-12', text: 'Realizar sessão prática de 30 minutos com a equipe', done: false },
    ],
    notes: 'Ajustar nova data em conjunto com a supervisão.',
    createdAt: '2026-08-10T11:00:00.000Z',
  },
];

export function getStoredIssues(): Issue[] {
  try {
    const raw = localStorage.getItem(ISSUES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_ISSUES));
      return INITIAL_DEMO_ISSUES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return INITIAL_DEMO_ISSUES;
  } catch {
    return INITIAL_DEMO_ISSUES;
  }
}

export function saveStoredIssues(issues: Issue[]): void {
  try {
    localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(issues));
  } catch (err) {
    console.error('Failed to save issues to localStorage', err);
  }
}

export function getStoredTasks(): QualityTask[] {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_TASKS));
      return INITIAL_DEMO_TASKS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return INITIAL_DEMO_TASKS;
  } catch {
    return INITIAL_DEMO_TASKS;
  }
}

export function saveStoredTasks(tasks: QualityTask[]): void {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save tasks to localStorage', err);
  }
}

export function generateNextCode(issues: Issue[]): string {
  const nums = issues
    .map((i) => {
      const match = i.code.match(/(?:RF|QL)-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 100;
  return `RF-${max + 1}`;
}

export function computeIndicators(issues: Issue[]) {
  const total = issues.length;
  const resolvidos = issues.filter((i) => i.status === 'Resolvido').length;
  const emAberto = issues.filter((i) => i.status !== 'Resolvido').length;
  const atrasados = issues.filter(
    (i) => i.status !== 'Resolvido' && getEffectiveStatus(i) === 'Atrasado'
  ).length;
  const emAndamento = issues.filter(
    (i) => i.status === 'Em andamento' && getEffectiveStatus(i) !== 'Atrasado'
  ).length;
  const abertosNoPrazo = issues.filter(
    (i) => i.status === 'Aberto' && getEffectiveStatus(i) !== 'Atrasado'
  ).length;

  const percentualResolucao = total > 0 ? Math.round((resolvidos / total) * 100) : 0;

  return {
    total,
    resolvidos,
    emAberto,
    atrasados,
    emAndamento,
    abertosNoPrazo,
    percentualResolucao,
  };
}

export function computeTaskIndicators(tasks: QualityTask[]) {
  const total = tasks.length;
  const concluidas = tasks.filter((t) => t.status === 'Concluída').length;
  const pendentes = tasks.filter((t) => t.status !== 'Concluída').length;
  const atrasadas = tasks.filter(
    (t) => t.status !== 'Concluída' && getEffectiveTaskStatus(t) === 'Atrasada'
  ).length;
  const emAndamento = tasks.filter(
    (t) => t.status === 'Em andamento' && getEffectiveTaskStatus(t) !== 'Atrasada'
  ).length;

  // Tasks for today
  const todayStr = new Date().toISOString().slice(0, 10);
  const tarefasHoje = tasks.filter((t) => t.date === todayStr);

  const percentualConclusao = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  return {
    total,
    concluidas,
    pendentes,
    atrasadas,
    emAndamento,
    tarefasHojeCount: tarefasHoje.length,
    tarefasHojeConcluidas: tarefasHoje.filter((t) => t.status === 'Concluída').length,
    percentualConclusao,
  };
}

// DAILY LOGS PERSISTENCE
export function getStoredDailyLogs(): DailyLogEntry[] {
  try {
    const raw = localStorage.getItem(DAILY_LOGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DAILY_LOGS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_DAILY_LOGS));
      return INITIAL_DEMO_DAILY_LOGS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return INITIAL_DEMO_DAILY_LOGS;
  } catch {
    return INITIAL_DEMO_DAILY_LOGS;
  }
}

export function saveStoredDailyLogs(logs: DailyLogEntry[]): void {
  try {
    localStorage.setItem(DAILY_LOGS_STORAGE_KEY, JSON.stringify(logs));
  } catch (err) {
    console.error('Failed to save daily logs to localStorage', err);
  }
}

export function getStoredCustomTemplates(): Record<HospitalLocation, DailyMetricDefinition[]> {
  try {
    const raw = localStorage.getItem(CUSTOM_TEMPLATES_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_SECTOR_TEMPLATES;
    }
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SECTOR_TEMPLATES, ...parsed };
  } catch {
    return DEFAULT_SECTOR_TEMPLATES;
  }
}

export function saveStoredCustomTemplates(
  templates: Record<HospitalLocation, DailyMetricDefinition[]>
): void {
  try {
    localStorage.setItem(CUSTOM_TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  } catch (err) {
    console.error('Failed to save custom sector templates', err);
  }
}

// SECTOR LEADERS PERSISTENCE
export function getStoredSectorLeaders(): Record<HospitalLocation, SectorLeaderInfo> {
  try {
    const raw = localStorage.getItem(SECTOR_LEADERS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_SECTOR_LEADERS;
    }
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SECTOR_LEADERS, ...parsed };
  } catch {
    return DEFAULT_SECTOR_LEADERS;
  }
}

export function saveStoredSectorLeaders(
  leaders: Record<HospitalLocation, SectorLeaderInfo>
): void {
  try {
    localStorage.setItem(SECTOR_LEADERS_STORAGE_KEY, JSON.stringify(leaders));
  } catch (err) {
    console.error('Failed to save sector leaders', err);
  }
}

// MONTHLY CONSOLIDATION COMPUTATION (Transforms Daily Logs into Monthly Institutional Indicator Summaries)
export interface ConsolidatedMetric {
  key: string;
  label: string;
  category: string;
  unit: string;
  type: string;
  target?: number;
  totalSum: number;
  countRecords: number;
  average: number;
  min: number;
  max: number;
  lastValue: number;
  complianceRate?: number; // % of days conforming to target or % of checklist checks that were conform/true
}

export interface SectorMonthlyConsolidation {
  sector: HospitalLocation;
  sectorLeader?: SectorLeaderInfo;
  totalCollections: number;
  daysWithCollection: string[];
  missingDaysCount: number;
  metrics: ConsolidatedMetric[];
  totalAdverseEventsMonth: number;
  allContributors: string[];
  allCollectors: string[];
}

export function computeMonthlyConsolidated(
  dailyLogs: DailyLogEntry[],
  sectorTemplates: Record<HospitalLocation, DailyMetricDefinition[]>,
  yearMonth: string, // e.g. "2026-08"
  sectorLeaders?: Record<HospitalLocation, SectorLeaderInfo>
): Record<HospitalLocation, SectorMonthlyConsolidation> {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, month, 0).getDate();

  const leaders = sectorLeaders || getStoredSectorLeaders();

  // Filter logs for this month
  const monthLogs = dailyLogs.filter((l) => l.date.startsWith(yearMonth));

  const result = {} as Record<HospitalLocation, SectorMonthlyConsolidation>;

  const sectors = Object.keys(sectorTemplates) as HospitalLocation[];

  sectors.forEach((sector) => {
    const sectorLogs = monthLogs.filter((l) => l.sector === sector);
    const daysSet = new Set(sectorLogs.map((l) => l.date));
    const daysWithCollection = Array.from(daysSet).sort();
    const templateMetrics = sectorTemplates[sector] || [];

    // Collect all contributors & collectors for this sector this month
    const collectorsSet = new Set<string>();
    const contributorsSet = new Set<string>();

    sectorLogs.forEach((log) => {
      if (log.collectorName) collectorsSet.add(log.collectorName);
      if (log.contributors && Array.isArray(log.contributors)) {
        log.contributors.forEach((c) => {
          if (c && c.trim()) contributorsSet.add(c.trim());
        });
      }
    });

    const consolidatedMetrics: ConsolidatedMetric[] = templateMetrics.map((def) => {
      const values: number[] = [];
      let conformingDaysCount = 0;
      let booleanTrueCount = 0;
      let booleanTotalCount = 0;

      sectorLogs.forEach((log) => {
        const val = log.metrics[def.key];

        if (typeof val === 'boolean' || def.type === 'checklist' || def.type === 'boolean') {
          booleanTotalCount++;
          if (val === true || val === 1) {
            booleanTrueCount++;
            values.push(1);
          } else {
            values.push(0);
          }
        } else if (typeof val === 'number') {
          values.push(val);

          // Check compliance if target exists
          if (def.target !== undefined) {
            if (def.targetType === 'max' && val <= def.target) {
              conformingDaysCount++;
            } else if (def.targetType === 'min' && val >= def.target) {
              conformingDaysCount++;
            } else if (def.targetType === 'exact' && val === def.target) {
              conformingDaysCount++;
            }
          }
        }
      });

      const count = values.length;
      const sum = values.reduce((acc, curr) => acc + curr, 0);
      const avg = count > 0 ? parseFloat((sum / count).toFixed(2)) : 0;
      const min = count > 0 ? Math.min(...values) : 0;
      const max = count > 0 ? Math.max(...values) : 0;
      const last = count > 0 ? values[values.length - 1] : 0;

      let complianceRate: number | undefined = undefined;
      if (def.type === 'checklist' || def.type === 'boolean') {
        complianceRate = booleanTotalCount > 0 ? Math.round((booleanTrueCount / booleanTotalCount) * 100) : undefined;
      } else if (count > 0 && def.target !== undefined) {
        complianceRate = Math.round((conformingDaysCount / count) * 100);
      }

      return {
        key: def.key,
        label: def.label,
        category: def.category,
        unit: def.unit,
        type: def.type,
        target: def.target,
        totalSum: parseFloat(sum.toFixed(2)),
        countRecords: count,
        average: avg,
        min,
        max,
        lastValue: last,
        complianceRate,
      };
    });

    const totalAdverseEvents = sectorLogs.reduce((acc, curr) => acc + (curr.totalAdverseEvents || 0), 0);

    result[sector] = {
      sector,
      sectorLeader: leaders[sector],
      totalCollections: sectorLogs.length,
      daysWithCollection,
      missingDaysCount: Math.max(0, daysInMonth - daysWithCollection.length),
      metrics: consolidatedMetrics,
      totalAdverseEventsMonth: totalAdverseEvents,
      allCollectors: Array.from(collectorsSet),
      allContributors: Array.from(contributorsSet),
    };
  });

  return result;
}

// Generate CSV data for monthly indicators export to institutional systems
export function generateMonthlyCsv(
  consolidated: Record<HospitalLocation, SectorMonthlyConsolidation>,
  yearMonth: string
): string {
  let csv = `\uFEFFRELATÓRIO MENSAL CONSOLIDADO DE ROTINAS E INFORMAÇÕES - ${yearMonth}\n`;
  csv += `Gerado automaticamente via Rotina Fácil | Rotinas, tarefas e informações em um só lugar\n\n`;
  csv += `Setor;Responsável do Setor;Categoria;Tipo;Item / Indicador;Unidade;Meta;Total Acumulado no Mês;Média Diária;Mínimo;Máximo;Dias Coletados;Taxa Conformidade (%)\n`;

  Object.values(consolidated).forEach((sectorData) => {
    if (sectorData.totalCollections > 0) {
      const leaderName = sectorData.sectorLeader?.name || 'N/A';
      sectorData.metrics.forEach((m) => {
        const targetStr = m.target !== undefined ? `${m.target}` : 'N/A';
        const complianceStr = m.complianceRate !== undefined ? `${m.complianceRate}%` : 'N/A';
        const typeStr = m.type === 'counter' ? 'Quantidade' : m.type === 'checklist' || m.type === 'boolean' ? 'Checklist' : m.type === 'percentage' ? 'Porcentagem' : 'Medição';
        csv += `"${sectorData.sector}";"${leaderName}";"${m.category}";"${typeStr}";"${m.label}";"${m.unit}";"${targetStr}";"${m.totalSum}";"${m.average}";"${m.min}";"${m.max}";"${sectorData.daysWithCollection.length}";"${complianceStr}"\n`;
      });
    }
  });

  return csv;
}

