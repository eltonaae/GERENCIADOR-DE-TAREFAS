export type HospitalLocation =
  | 'Recepção / Atendimento'
  | 'Faturamento & Administrativo'
  | 'Farmácia'
  | 'Enfermagem & Posto'
  | 'Internação'
  | 'UTI'
  | 'Centro Cirúrgico'
  | 'Laboratório & Exames'
  | 'Higienização & Hotelaria'
  | 'Manutenção & Infraestrutura'
  | 'Apoio / Qualidade'
  | 'Outro';

export type IssueNature =
  | 'Pessoas'
  | 'Processo'
  | 'Comunicação'
  | 'Equipamento'
  | 'Documento'
  | 'Estrutura'
  | 'Tecnologia'
  | 'Outro';

export type ImpactType =
  | 'Paciente'
  | 'Colaborador'
  | 'Operação'
  | 'Financeiro'
  | 'Prazo'
  | 'Outro';

export type IssuePriority = 'Baixa' | 'Média' | 'Alta' | 'Crítica';

export type IssueStatus = 'Aberto' | 'Em andamento' | 'Resolvido';

export type DisplayStatus = 'Aberto' | 'Em andamento' | 'Resolvido' | 'Atrasado';

export interface TaskChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface QualityTask {
  id: string;
  title: string; // O que deve ser feito na tarefa
  date: string; // Dia/Data de execução (YYYY-MM-DD)
  involvedSectors: HospitalLocation[]; // Setores envolvidos
  responsible: string; // Responsável
  priority: IssuePriority; // Prioridade
  status: 'Pendente' | 'Em andamento' | 'Concluída'; // Status da tarefa
  issueId?: string; // Vínculo opcional com problema (ex: demo-1)
  issueCode?: string; // Código do problema (ex: QL-101)
  checklist?: TaskChecklistItem[]; // Subtarefas / checklist
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Issue {
  id: string;
  code: string; // Ex: QL-101
  problem: string; // Qual é a ocorrência / ponto de melhoria?
  location: HospitalLocation; // Onde ocorreu?
  customLocation?: string; // Se 'Outro'
  involvedSectors?: HospitalLocation[]; // Setores envolvidos na tratativa
  nature: IssueNature[]; // Natureza da ocorrência
  hasImpact: boolean; // Houve impacto?
  impactTypes: ImpactType[]; // Qual foi o impacto? (se hasImpact = true)
  priority: IssuePriority; // Prioridade
  responsible: string; // Responsável
  deadline: string; // Prazo (YYYY-MM-DD)
  actionNeeded: string; // O que precisa ser feito?
  tasks?: QualityTask[]; // Tarefas geradas para a tratativa
  status: IssueStatus; // Status selecionado pelo usuário
  createdAt: string; // Data de registro ISO
  updatedAt?: string;
  resolvedAt?: string;
  isDemo?: boolean;
}

export type ViewTab = 'dashboard' | 'daily-collector' | 'tasks' | 'register' | 'pendencies';

export type ShiftType =
  | 'Horário Comercial / Integral'
  | 'Turno Manhã'
  | 'Turno Tarde'
  | 'Turno Noite'
  | 'Plantão 12h (Dia)'
  | 'Plantão 12h (Noite)'
  | 'Rotina Diária (Geral)';

export interface DailyMetricDefinition {
  id: string;
  key: string;
  label: string;
  category: string;
  unit: string;
  type: 'counter' | 'number' | 'boolean' | 'percentage' | 'checklist';
  defaultValue: number | boolean;
  target?: number;
  targetType?: 'max' | 'min' | 'exact'; // max = quanto menor melhor (ex: falhas <= 0), min = quanto maior melhor (ex: adesão >= 95%)
  helpText?: string;
  isStandard?: boolean;
}

export interface SectorLeaderInfo {
  name: string;
  role: string;
  contact?: string;
}

export interface DailySectorTemplate {
  sector: HospitalLocation;
  name: string;
  description: string;
  metrics: DailyMetricDefinition[];
}

export interface DailyLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  sector: HospitalLocation;
  shift: ShiftType;
  collectorName: string; // Responsável principal pelo lançamento no dia/turno
  contributors?: string[]; // Outras pessoas da equipe que contribuíram / preencheram junto
  verifiedBy?: string; // Conferência/revisão pelo líder ou colega
  metrics: Record<string, number | boolean>;
  totalAdverseEvents: number;
  hasDeviations: boolean;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export const DEFAULT_SECTOR_LEADERS: Record<HospitalLocation, SectorLeaderInfo> = {
  'Recepção / Atendimento': { name: 'Camila Duarte', role: 'Supervisora de Atendimento' },
  'Faturamento & Administrativo': { name: 'André Souza', role: 'Coordenador de Faturamento' },
  'Farmácia': { name: 'Dra. Marina Santos', role: 'Farmacêutica Responsável Técnica (RT)' },
  'Enfermagem & Posto': { name: 'Enf. Patrícia Gomes', role: 'Enfermeira Responsável de Posto' },
  'Internação': { name: 'Enf. Juliana Ramos', role: 'Supervisora de Internação' },
  'UTI': { name: 'Dr. Marcos Albuquerque / Enf. Carlos Prado', role: 'Coordenação de UTI' },
  'Centro Cirúrgico': { name: 'Enf. Roberto Lima', role: 'Coordenador de Bloco Cirúrgico' },
  'Laboratório & Exames': { name: 'Dr. Fernando Dias', role: 'Biomédico Responsável' },
  'Higienização & Hotelaria': { name: 'Marta Silveira', role: 'Encarregada de Hotelaria & Higiene' },
  'Manutenção & Infraestrutura': { name: 'Eng. Lucas Ferraz', role: 'Engenheiro Clínico & Predial' },
  'Apoio / Qualidade': { name: 'Helena Matos', role: 'Analista de Processos & Qualidade' },
  'Outro': { name: 'Responsável Designado', role: 'Líder do Setor' },
};

export const SHIFT_OPTIONS: ShiftType[] = [
  'Horário Comercial / Integral',
  'Turno Manhã',
  'Turno Tarde',
  'Turno Noite',
  'Plantão 12h (Dia)',
  'Plantão 12h (Noite)',
  'Rotina Diária (Geral)',
];

export const DEFAULT_SECTOR_TEMPLATES: Record<HospitalLocation, DailyMetricDefinition[]> = {
  'Recepção / Atendimento': [
    {
      id: 'rec-1',
      key: 'total_atendimentos',
      label: 'Total de Atendimentos Realizados',
      category: 'Fluxo de Atendimento',
      unit: 'pacientes',
      type: 'counter',
      defaultValue: 65,
      helpText: 'Total de pessoas acolhidas e cadastradas no período.',
    },
    {
      id: 'rec-2',
      key: 'tempo_espera_atendimento_min',
      label: 'Tempo Médio de Espera para Atendimento (Recepção/Triagem)',
      category: 'Agilidade & Acesso',
      unit: 'minutos',
      type: 'number',
      defaultValue: 8,
      target: 10,
      targetType: 'max',
      helpText: 'Meta institucional: atendimento em menos de 10 minutos.',
    },
    {
      id: 'rec-3',
      key: 'fichas_sem_erro_cadastro',
      label: 'Cadastros e Fichas Conformes (Sem Erro de Dados/Convênio)',
      category: 'Conformidade de Cadastro',
      unit: '% cadastros corretos',
      type: 'percentage',
      defaultValue: 100,
      target: 98,
      targetType: 'min',
      helpText: 'Documentos e carteirinhas validados corretamente.',
    },
    {
      id: 'rec-4',
      key: 'desistencias_sem_atendimento',
      label: 'Desistências ou Evasões de Pacientes',
      category: 'Acolhimento',
      unit: 'pacientes',
      type: 'counter',
      defaultValue: 0,
      target: 0,
      targetType: 'max',
      helpText: 'Pessoas que deixaram a espera antes de serem chamadas.',
    },
    {
      id: 'rec-5',
      key: 'queixas_ou_reclamacoes',
      label: 'Reclamações Registradas no Balcão',
      category: 'Experiência do Usuário',
      unit: 'manifestações',
      type: 'counter',
      defaultValue: 0,
      target: 0,
      targetType: 'max',
      helpText: 'Apontamentos ou insatisfações reportadas.',
    },
  ],

  'Faturamento & Administrativo': [
    {
      id: 'fat-1',
      key: 'contas_guias_processadas',
      label: 'Contas, Guias e Prontuários Processados no Dia',
      category: 'Produção Administrativa',
      unit: 'guias/contas',
      type: 'counter',
      defaultValue: 45,
      helpText: 'Volume de documentos auditados e faturados no período.',
    },
    {
      id: 'fat-2',
      key: 'fechamento_no_prazo',
      label: 'Prontuários / Contas Fechadas Dentro do Prazo da Remessa',
      category: 'Prazo & Pontualidade',
      unit: '% no prazo',
      type: 'percentage',
      defaultValue: 98,
      target: 95,
      targetType: 'min',
      helpText: 'Contas liberadas antes do corte de envio do convênio/SUS.',
    },
    {
      id: 'fat-3',
      key: 'inconsistencias_identificadas',
      label: 'Inconsistências de Guias ou Falta de Laudo Corrigidas',
      category: 'Prevenção de Glosas',
      unit: 'inconsistências',
      type: 'counter',
      defaultValue: 1,
      helpText: 'Erros de preenchimento ajustados antes do envio da fatura.',
    },
    {
      id: 'fat-4',
      key: 'pendencias_autorizacao_convenio',
      label: 'Guias Aguardando Autorização do Convênio',
      category: 'Controle de Convênios',
      unit: 'guias pendentes',
      type: 'counter',
      defaultValue: 2,
      target: 3,
      targetType: 'max',
      helpText: 'Solicitações em análise pelas operadoras de saúde.',
    },
  ],

  'Farmácia': [
    {
      id: 'far-1',
      key: 'temp_geladeira_termo',
      label: 'Temperatura da Geladeira de Termolábeis',
      category: 'Armazenamento & Cadeia de Frio',
      unit: '°C',
      type: 'number',
      defaultValue: 4.5,
      target: 5.0,
      helpText: 'Faixa segura e obrigatória: entre 2.0°C e 8.0°C.',
    },
    {
      id: 'far-2',
      key: 'prescricoes_avaliadas',
      label: 'Prescrições e Pedidos de Medicamentos Atendidos',
      category: 'Rotina de Dispensação',
      unit: 'prescrições',
      type: 'counter',
      defaultValue: 55,
      helpText: 'Total de solicitações conferidas e entregues aos postos.',
    },
    {
      id: 'far-3',
      key: 'intervencoes_orientacoes',
      label: 'Intervenções Farmacêuticas e Esclarecimentos Realizados',
      category: 'Apoio Técnico',
      unit: 'orientações',
      type: 'counter',
      defaultValue: 2,
      helpText: 'Dúvidas de dosagem, aprazamento ou substituições alinhadas com a equipe.',
    },
    {
      id: 'far-4',
      key: 'ruptura_medicamentos_criticos',
      label: 'Itens em Falta ou Ruptura de Estoque',
      category: 'Suprimentos',
      unit: 'itens zerados',
      type: 'counter',
      defaultValue: 0,
      target: 0,
      targetType: 'max',
      helpText: 'Medicamentos ou materiais essenciais sem estoque.',
    },
    {
      id: 'far-5',
      key: 'tempo_atendimento_urgente',
      label: 'Tempo Médio de Atendimento de Solicitações Urgentes',
      category: 'Agilidade',
      unit: 'minutos',
      type: 'number',
      defaultValue: 12,
      target: 15,
      targetType: 'max',
      helpText: 'Meta institucional: liberação em menos de 15 minutos.',
    },
  ],

  'Enfermagem & Posto': [
    {
      id: 'enf-1',
      key: 'conferencia_identificacao_leito',
      label: 'Conferência de Identificação dos Pacientes (Pulseiras/Placas)',
      category: 'Rotina & Segurança',
      unit: '% conformidade',
      type: 'percentage',
      defaultValue: 100,
      target: 100,
      targetType: 'min',
      helpText: 'Checagem dos identificadores padrão na passagem de rotina.',
    },
    {
      id: 'enf-2',
      key: 'medicacao_horario_certo',
      label: 'Administração de Medicamentos no Horário Correto',
      category: 'Assistência',
      unit: '% no horário',
      type: 'percentage',
      defaultValue: 99,
      target: 95,
      targetType: 'min',
      helpText: 'Checagem dos aprazamentos prescritos pela equipe médica.',
    },
    {
      id: 'enf-3',
      key: 'intercorrencias_assistenciais',
      label: 'Ocorrências ou Intercorrências no Período',
      category: 'Registro do Setor',
      unit: 'ocorrências',
      type: 'counter',
      defaultValue: 0,
      target: 0,
      targetType: 'max',
      helpText: 'Quedas, perdas de sondas ou eventos reportados no turno.',
    },
    {
      id: 'enf-4',
      key: 'passagem_rotina_concluida',
      label: 'Alinhamento e Passagem de Rotina Concluídos',
      category: 'Comunicação da Equipe',
      unit: '% conformidade',
      type: 'percentage',
      defaultValue: 100,
      target: 100,
      targetType: 'min',
      helpText: 'Transferência de informações e pendências para o próximo horário.',
    },
  ],

  'Laboratório & Exames': [
    {
      id: 'lab-1',
      key: 'exames_laudos_liberados',
      label: 'Total de Exames / Laudos Liberados no Dia',
      category: 'Produção Diagnóstica',
      unit: 'exames',
      type: 'counter',
      defaultValue: 110,
      helpText: 'Hemogramas, bioquímicas, gasometrias e exames de imagem.',
    },
    {
      id: 'lab-2',
      key: 'tempo_urgencias_prazo',
      label: 'Exames de Urgência Liberados Dentro do Prazo (TAT)',
      category: 'Agilidade & Resposta',
      unit: '% no prazo',
      type: 'percentage',
      defaultValue: 98,
      target: 95,
      targetType: 'min',
      helpText: 'Laudos críticos liberados no tempo padrão acordado.',
    },
    {
      id: 'lab-3',
      key: 'recoletas_solicitadas',
      label: 'Necessidade de Recoleta de Amostra (Hemólise/Volume)',
      category: 'Qualidade Pré-Analítica',
      unit: 'recoletas',
      type: 'counter',
      defaultValue: 0,
      target: 0,
      targetType: 'max',
      helpText: 'Amostras que precisaram de nova punção.',
    },
    {
      id: 'lab-4',
      key: 'calibracao_controle_qualidade',
      label: 'Controle de Calibração dos Aparelhos Realizado',
      category: 'Rotina Técnica',
      unit: '% conforme',
      type: 'percentage',
      defaultValue: 100,
      target: 100,
      targetType: 'min',
      helpText: 'Checagem diária dos reagentes e calibradores.',
    },
  ],

  'Internação': [
    {
      id: 'int-1',
      key: 'censo_ocupacao',
      label: 'Pacientes em Atendimento / Leitos Ocupados',
      category: 'Censo do Setor',
      unit: 'pacientes',
      type: 'number',
      defaultValue: 28,
      helpText: 'Total de pacientes sob cuidados na enfermaria.',
    },
    {
      id: 'int-2',
      key: 'altas_hospitalares_dia',
      label: 'Altas Realizadas no Período',
      category: 'Giro de Leitos',
      unit: 'altas',
      type: 'counter',
      defaultValue: 6,
      helpText: 'Pacientes liberados para casa com orientações.',
    },
    {
      id: 'int-3',
      key: 'avaliacao_risco_atualizada',
      label: 'Avaliação de Risco e Cuidados Atualizada no Prontuário',
      category: 'Rotina de Cuidados',
      unit: '% pacientes',
      type: 'percentage',
      defaultValue: 98,
      target: 95,
      targetType: 'min',
      helpText: 'Revisão diária do plano terapêutico e orientações.',
    },
    {
      id: 'int-4',
      key: 'quedas',
      label: 'Ocorrências de Queda ou Incidentes no Quarto',
      category: 'Segurança & Atenção',
      unit: 'quedas',
      type: 'counter',
      defaultValue: 0,
      target: 0,
      targetType: 'max',
      helpText: 'Quedas do leito ou ao caminhar no quarto.',
    },
  ],

  'UTI': [
    {
      id: 'uti-1',
      key: 'censo_ocupacao',
      label: 'Leitos Ocupados no Período',
      category: 'Censo da Unidade',
      unit: 'pacientes',
      type: 'number',
      defaultValue: 10,
      helpText: 'Total de pacientes internados no momento da checagem.',
    },
    {
      id: 'uti-2',
      key: 'adesao_protocolos_prevencao',
      label: 'Checagem de Protocolos de Prevenção e Cabeceira Elevada',
      category: 'Rotina de Cuidados',
      unit: '% conformidade',
      type: 'percentage',
      defaultValue: 100,
      target: 95,
      targetType: 'min',
      helpText: 'Cabeceira 30-45°, higiene bucal e cuidados de rotina.',
    },
    {
      id: 'uti-3',
      key: 'intercorrencias_graves',
      label: 'Intercorrências no Setor (Quedas / Extubações Acidentais)',
      category: 'Segurança do Paciente',
      unit: 'ocorrências',
      type: 'counter',
      defaultValue: 0,
      target: 0,
      targetType: 'max',
      helpText: 'Eventos adversos ou perdas acidentais de dispositivos.',
    },
    {
      id: 'uti-4',
      key: 'lesao_por_pressao_nova',
      label: 'Novas Lesões por Pressão Identificadas',
      category: 'Cuidados com a Pele',
      unit: 'novas lesões',
      type: 'counter',
      defaultValue: 0,
      target: 0,
      targetType: 'max',
      helpText: 'Alterações cutâneas observadas na mudança de decúbito.',
    },
    {
      id: 'uti-5',
      key: 'adesao_higiene_maos',
      label: 'Checagem de Higiene das Mãos e Insumos Abastecidos',
      category: 'Boas Práticas',
      unit: '% conformidade',
      type: 'percentage',
      defaultValue: 98,
      target: 90,
      targetType: 'min',
      helpText: 'Dispensers de álcool e sabonete em pleno funcionamento.',
    },
  ],

  'Centro Cirúrgico': [
    {
      id: 'cc-1',
      key: 'cirurgias_realizadas',
      label: 'Procedimentos Cirúrgicos Realizados',
      category: 'Produção Cirúrgica',
      unit: 'procedimentos',
      type: 'counter',
      defaultValue: 6,
      helpText: 'Total de cirurgias concluídas no período.',
    },
    {
      id: 'cc-2',
      key: 'checklist_cirurgia_segura',
      label: 'Checklist de Verificação de Sala Realizado (Time Out)',
      category: 'Rotina de Segurança',
      unit: '% adesão',
      type: 'percentage',
      defaultValue: 100,
      target: 100,
      targetType: 'min',
      helpText: 'Confirmação do paciente, procedimento e sítio cirúrgico.',
    },
    {
      id: 'cc-3',
      key: 'atrasos_inicio_sala',
      label: 'Atrasos no Início do Procedimento (>15 min)',
      category: 'Pontualidade de Sala',
      unit: 'atrasos',
      type: 'counter',
      defaultValue: 0,
      target: 0,
      targetType: 'max',
      helpText: 'Cirurgias que iniciaram após a tolerância prevista.',
    },
    {
      id: 'cc-4',
      key: 'cirurgias_canceladas',
      label: 'Cirurgias Canceladas / Remarcadas no Dia',
      category: 'Fluxo Cirúrgico',
      unit: 'cancelamentos',
      type: 'counter',
      defaultValue: 0,
      target: 0,
      targetType: 'max',
      helpText: 'Cancelamentos por motivos clínicos, preparo ou solicitação.',
    },
    {
      id: 'cc-5',
      key: 'recontagem_compressas_conforme',
      label: 'Conferência de Instrumentais e Compressas Conforme',
      category: 'Rotina Cirúrgica',
      unit: '% salas conformes',
      type: 'percentage',
      defaultValue: 100,
      target: 100,
      targetType: 'min',
      helpText: 'Contagem inicial e final em 100% das salas abertas.',
    },
  ],

  'Higienização & Hotelaria': [
    {
      id: 'hig-1',
      key: 'leitos_higienizados',
      label: 'Higienizações de Leitos e Quartos Realizadas',
      category: 'Rotina de Limpeza',
      unit: 'quartos/leitos',
      type: 'counter',
      defaultValue: 8,
      helpText: 'Limpezas terminais e concorrentes concluídas.',
    },
    {
      id: 'hig-2',
      key: 'tempo_medio_liberacao_leito',
      label: 'Tempo Médio para Liberação do Quarto (Limpeza Terminal)',
      category: 'Agilidade de Liberação',
      unit: 'minutos',
      type: 'number',
      defaultValue: 35,
      target: 45,
      targetType: 'max',
      helpText: 'Meta: liberar o leito limpo em até 45 minutos.',
    },
    {
      id: 'hig-3',
      key: 'checklist_limpeza_conforme',
      label: 'Checagem de Qualidade da Limpeza Conforme',
      category: 'Padrão de Higiene',
      unit: '% conformidade',
      type: 'percentage',
      defaultValue: 100,
      target: 95,
      targetType: 'min',
      helpText: 'Quartos inspecionados com superfícies desinfetadas.',
    },
    {
      id: 'hig-4',
      key: 'abastecimento_insumos_ok',
      label: 'Dispensers de Papel, Sabonete e Álcool Abastecidos',
      category: 'Hotelaria & Insumos',
      unit: '% setores abastecidos',
      type: 'percentage',
      defaultValue: 100,
      target: 100,
      targetType: 'min',
      helpText: 'Ronda de reposição de descartáveis nos postos e banheiros.',
    },
  ],

  'Manutenção & Infraestrutura': [
    {
      id: 'man-1',
      key: 'ordens_servico_atendidas',
      label: 'Chamados e Ordens de Serviço (OS) Atendidas',
      category: 'Rotina Operacional',
      unit: 'chamados',
      type: 'counter',
      defaultValue: 6,
      helpText: 'Reparos preventivos e corretivos finalizados no dia.',
    },
    {
      id: 'man-2',
      key: 'chamados_urgentes_prazo',
      label: 'Chamados de Urgência Atendidos em Menos de 1 Hora',
      category: 'Tempo de Resposta',
      unit: '% atendidos no prazo',
      type: 'percentage',
      defaultValue: 100,
      target: 95,
      targetType: 'min',
      helpText: 'Falhas elétricas, hidráulicas ou de equipamentos vitais.',
    },
    {
      id: 'man-3',
      key: 'ronda_infraestrutura_ok',
      label: 'Ronda de Gases Medicinais, Gerador e Ar Condicionado OK',
      category: 'Segurança Predial',
      unit: '% conformidade',
      type: 'percentage',
      defaultValue: 100,
      target: 100,
      targetType: 'min',
      helpText: 'Níveis de oxigênio, combustível do gerador e pressões conferidos.',
    },
  ],

  'Apoio / Qualidade': [
    {
      id: 'ap-1',
      key: 'atividades_rotina_concluidas',
      label: 'Atividades e Rotinas de Apoio Concluídas no Dia',
      category: 'Rotina de Apoio',
      unit: 'atividades',
      type: 'counter',
      defaultValue: 5,
      helpText: 'Acompanhamentos, checagens e suporte aos setores.',
    },
    {
      id: 'ap-2',
      key: 'pontos_melhoria_acompanhados',
      label: 'Ajustes de Processo e Ações em Acompanhamento',
      category: 'Melhoria Contínua',
      unit: 'ações ativas',
      type: 'counter',
      defaultValue: 3,
      helpText: 'Planos de ação e melhorias em andamento com as lideranças.',
    },
    {
      id: 'ap-3',
      key: 'indicadores_consolidados_em_dia',
      label: 'Fechamentos de Indicadores em Dia',
      category: 'Gestão de Dados',
      unit: '% em dia',
      type: 'percentage',
      defaultValue: 100,
      target: 100,
      targetType: 'min',
      helpText: 'Alimentação do painel sem atrasos.',
    },
  ],

  'Outro': [
    {
      id: 'out-1',
      key: 'atividades_concluidas_geral',
      label: 'Atividades e Procedimentos Realizados',
      category: 'Geral do Setor',
      unit: 'tarefas',
      type: 'counter',
      defaultValue: 10,
      helpText: 'Registros gerais de rotina do setor.',
    },
    {
      id: 'out-2',
      key: 'pontos_atencao_geral',
      label: 'Pontos de Atenção ou Ocorrências do Dia',
      category: 'Geral do Setor',
      unit: 'ocorrências',
      type: 'counter',
      defaultValue: 0,
      target: 0,
      targetType: 'max',
      helpText: 'Dificuldades ou desvios de processo observados no período.',
    },
  ],
};

export const HOSPITAL_LOCATIONS: HospitalLocation[] = [
  'Recepção / Atendimento',
  'Faturamento & Administrativo',
  'Farmácia',
  'Enfermagem & Posto',
  'Internação',
  'UTI',
  'Centro Cirúrgico',
  'Laboratório & Exames',
  'Higienização & Hotelaria',
  'Manutenção & Infraestrutura',
  'Apoio / Qualidade',
  'Outro',
];

export const ISSUE_NATURES: IssueNature[] = [
  'Pessoas',
  'Processo',
  'Comunicação',
  'Equipamento',
  'Documento',
  'Estrutura',
  'Tecnologia',
  'Outro',
];

export const IMPACT_TYPES: ImpactType[] = [
  'Paciente',
  'Colaborador',
  'Operação',
  'Financeiro',
  'Prazo',
  'Outro',
];

export const PRIORITIES: IssuePriority[] = ['Baixa', 'Média', 'Alta', 'Crítica'];

export const STATUS_OPTIONS: IssueStatus[] = ['Aberto', 'Em andamento', 'Resolvido'];

// Helper to check if a deadline is overdue (date < today at 00:00:00)
export function isDeadlineOverdue(deadlineStr: string): boolean {
  if (!deadlineStr) return false;
  // Parse YYYY-MM-DD
  const parts = deadlineStr.split('-');
  if (parts.length !== 3) return false;
  const deadlineDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 23, 59, 59);
  const now = new Date();
  return deadlineDate.getTime() < now.getTime();
}

// Compute effective issue display status (identifying Atrasado automatically)
export function getEffectiveStatus(issue: Issue): DisplayStatus {
  if (issue.status === 'Resolvido') {
    return 'Resolvido';
  }
  if (isDeadlineOverdue(issue.deadline)) {
    return 'Atrasado';
  }
  return issue.status;
}

// Compute effective task display status
export function getEffectiveTaskStatus(task: QualityTask): 'Pendente' | 'Em andamento' | 'Concluída' | 'Atrasada' {
  if (task.status === 'Concluída') {
    return 'Concluída';
  }
  if (isDeadlineOverdue(task.date)) {
    return 'Atrasada';
  }
  return task.status;
}

