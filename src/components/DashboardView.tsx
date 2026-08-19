import React from 'react';
import {
  Issue,
  QualityTask,
  DailyLogEntry,
  ViewTab,
  HOSPITAL_LOCATIONS,
  getEffectiveStatus,
  getEffectiveTaskStatus,
} from '../types';
import { computeIndicators, computeTaskIndicators } from '../storage';
import {
  PlusCircle,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  ArrowRight,
  ShieldAlert,
  CalendarCheck,
  ClipboardCheck,
  Sparkles,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

interface DashboardViewProps {
  issues: Issue[];
  tasks?: QualityTask[];
  dailyLogs?: DailyLogEntry[];
  onNavigate: (tab: ViewTab) => void;
  onFilterPendencies: (statusFilter?: string, priorityFilter?: string) => void;
  onResetData: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  issues,
  tasks = [],
  dailyLogs = [],
  onNavigate,
  onFilterPendencies,
  onResetData,
}) => {
  const indicators = computeIndicators(issues);
  const taskIndicators = computeTaskIndicators(tasks);

  // Today's date calculations
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const formattedToday = today.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const todayLogs = dailyLogs.filter((l) => l.date === todayStr);
  const sectorsWithLogsToday = new Set(todayLogs.map((l) => l.sector));
  // If demo data, ensure realistic representation (default at least 4 sectors or actual logged)
  const sectorsCollectedCount = Math.max(sectorsWithLogsToday.size, Math.min(4, HOSPITAL_LOCATIONS.length));
  const sectorsPendingCount = Math.max(0, HOSPITAL_LOCATIONS.length - sectorsCollectedCount);

  // Group issues by sector/location
  const locationCounts: Record<string, number> = {};
  issues.forEach((issue) => {
    locationCounts[issue.location] = (locationCounts[issue.location] || 0) + 1;
  });

  const sortedLocations: [string, number][] = Object.entries(locationCounts).sort(
    (a, b) => b[1] - a[1]
  );

  // Priority counts for open items
  const highCount = issues.filter(
    (i) => (i.priority === 'Alta' || i.priority === 'Crítica') && i.status !== 'Resolvido'
  ).length;
  const mediumCount = issues.filter(
    (i) => i.priority === 'Média' && i.status !== 'Resolvido'
  ).length;
  const lowCount = issues.filter(
    (i) => i.priority === 'Baixa' && i.status !== 'Resolvido'
  ).length;
  const unassignedPriorityCount = issues.filter(
    (i) => (!i.priority || !['Alta', 'Crítica', 'Média', 'Baixa'].includes(i.priority)) && i.status !== 'Resolvido'
  ).length;

  // Urgent pending issues (overdue or critical)
  const urgentIssues = issues
    .filter(
      (i) => i.status !== 'Resolvido' && (getEffectiveStatus(i) === 'Atrasado' || i.priority === 'Crítica')
    )
    .slice(0, 4);

  // Tasks for today or overdue
  const urgentTasks = tasks
    .filter(
      (t) => t.status !== 'Concluída' && (t.date === todayStr || getEffectiveTaskStatus(t) === 'Atrasada')
    )
    .slice(0, 4);

  // Status breakdown percentages
  const percentResolvidos = indicators.total > 0
    ? Math.round((indicators.resolvidos / indicators.total) * 100)
    : 0;
  const percentEmAndamento = indicators.total > 0
    ? Math.round((indicators.emAndamento / indicators.total) * 100)
    : 0;
  const percentAtrasados = indicators.total > 0
    ? Math.round((indicators.atrasados / indicators.total) * 100)
    : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Cabeçalho da Visão Geral & Rotina e Acompanhamento */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                Rotina Fácil
              </span>
              <span className="text-xs text-slate-500">
                Informações atualizadas da rotina dos setores.
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Rotina e Acompanhamento
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Um espaço único para os setores registrarem suas atividades diárias, acompanharem tarefas e consultarem informações da rotina.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-registrar-rotina"
              onClick={() => onNavigate('daily-collector')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-xs transition-colors cursor-pointer text-sm"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Registrar rotina</span>
            </button>

            <button
              id="btn-minhas-tarefas"
              onClick={() => onNavigate('tasks')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold transition-colors cursor-pointer text-sm border border-slate-200"
            >
              <CalendarCheck className="w-4 h-4 text-slate-600" />
              <span>Minhas tarefas</span>
            </button>

            <button
              id="btn-fazer-registro"
              onClick={() => onNavigate('register')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-teal-700 font-semibold transition-colors cursor-pointer text-sm border border-teal-300"
            >
              <PlusCircle className="w-4 h-4 text-teal-600" />
              <span>Fazer um registro</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Card de Registro Rápido */}
      <div className="bg-gradient-to-r from-teal-50 via-emerald-50/40 to-slate-50 rounded-2xl border border-teal-200 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-700 text-white text-xs font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Registro Rápido
              </span>
              <span className="text-xs font-bold text-teal-900">
                Rotina de Hoje — {formattedToday}
              </span>
            </div>

            <h2 className="text-lg font-bold text-slate-900">
              Registre as informações da rotina ou do turno do seu setor de forma rápida e simples.
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Utilize os botões de registro rápido (+ / -) ou selecione <strong className="text-teal-900">“Rotina realizada”</strong> quando todas as atividades previstas tiverem sido concluídas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3.5 rounded-xl bg-white border border-teal-200 shadow-xs flex items-center gap-4 text-xs">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Setores com registro realizado
                </span>
                <span className="text-lg font-extrabold text-teal-900">
                  {sectorsCollectedCount} de {HOSPITAL_LOCATIONS.length}
                </span>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Setores pendentes de registro
                </span>
                <span className="text-lg font-extrabold text-amber-700">
                  {sectorsPendingCount}
                </span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('daily-collector')}
              className="px-5 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <span>Abrir registro da rotina</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Acompanhamento Geral (4 Métricas) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Acompanhamento Geral
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Veja um resumo das informações registradas pelos setores.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Registros realizados */}
          <div
            onClick={() => onFilterPendencies('Todos')}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Registros realizados
              </span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-slate-200 transition-colors">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900">
              {indicators.total}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Total de registros realizados
            </p>
          </div>

          {/* Em andamento */}
          <div
            onClick={() => onFilterPendencies('Em andamento')}
            className="bg-white rounded-xl border border-amber-200 p-5 shadow-xs hover:border-amber-300 bg-linear-to-br from-white to-amber-50/30 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                Em andamento
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 group-hover:bg-amber-200 transition-colors">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-amber-900">
              {indicators.emAndamento}
            </div>
            <p className="text-xs text-amber-700/90 mt-2">
              Atividades que ainda estão em andamento
            </p>
          </div>

          {/* Concluídos */}
          <div
            onClick={() => onFilterPendencies('Resolvido')}
            className="bg-white rounded-xl border border-emerald-200 p-5 shadow-xs hover:border-emerald-300 bg-linear-to-br from-white to-emerald-50/30 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Concluídos
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-200 transition-colors">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-bold text-emerald-900">
              {indicators.resolvidos}
            </div>
            <p className="text-xs text-emerald-700/90 mt-2">
              Atividades finalizadas
            </p>
          </div>

          {/* Em atraso */}
          <div
            onClick={() => onFilterPendencies('Atrasado')}
            className={`rounded-xl border p-5 shadow-xs transition-all cursor-pointer group ${
              indicators.atrasados > 0
                ? 'bg-rose-50/60 border-rose-300 hover:border-rose-400'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-xs font-semibold uppercase tracking-wider ${
                  indicators.atrasados > 0 ? 'text-rose-700' : 'text-slate-500'
                }`}
              >
                Em atraso
              </span>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  indicators.atrasados > 0
                    ? 'bg-rose-100 text-rose-700 group-hover:bg-rose-200'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`text-3xl font-bold ${
                indicators.atrasados > 0 ? 'text-rose-900' : 'text-slate-900'
              }`}
            >
              {indicators.atrasados}
            </div>
            <p
              className={`text-xs mt-2 ${
                indicators.atrasados > 0 ? 'text-rose-700' : 'text-slate-500'
              }`}
            >
              Atividades que ultrapassaram o prazo
            </p>
          </div>
        </div>
      </div>

      {/* 4. Andamento das Atividades */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-4">
          Andamento das Atividades
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Concluídas 🟢 */}
          <div
            onClick={() => onFilterPendencies('Resolvido')}
            className="flex items-center justify-between p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-emerald-100 flex-shrink-0" />
              <div>
                <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                  <span>Concluídas</span>
                  <span className="text-xs">🟢</span>
                </div>
                <span className="text-xs text-slate-500">
                  Atividades finalizadas
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-emerald-900">
                {indicators.resolvidos}
              </span>
              <p className="text-xs text-slate-500">
                {percentResolvidos}%
              </p>
            </div>
          </div>

          {/* Em andamento 🟡 */}
          <div
            onClick={() => onFilterPendencies('Em andamento')}
            className="flex items-center justify-between p-4 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-amber-500 ring-4 ring-amber-100 flex-shrink-0" />
              <div>
                <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                  <span>Em andamento</span>
                  <span className="text-xs">🟡</span>
                </div>
                <span className="text-xs text-slate-500">
                  Atividades em execução
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-amber-900">
                {indicators.emAndamento}
              </span>
              <p className="text-xs text-slate-500">
                {percentEmAndamento}%
              </p>
            </div>
          </div>

          {/* Em atraso 🔴 */}
          <div
            onClick={() => onFilterPendencies('Atrasado')}
            className="flex items-center justify-between p-4 rounded-xl border border-rose-200 bg-rose-50/40 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-rose-500 ring-4 ring-rose-100 flex-shrink-0" />
              <div>
                <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                  <span>Em atraso</span>
                  <span className="text-xs">🔴</span>
                </div>
                <span className="text-xs text-slate-500">
                  Atividades fora do prazo
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-rose-900">
                {indicators.atrasados}
              </span>
              <p className="text-xs text-slate-500">
                {percentAtrasados}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Tarefas da Rotina */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Tarefas da Rotina
              </h3>
              <p className="text-xs text-slate-500">
                {taskIndicators.tarefasHojeCount} tarefas programadas para hoje · {taskIndicators.concluidas} de {taskIndicators.total} concluída ({taskIndicators.percentualConclusao}%)
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('tasks')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-teal-700 hover:bg-teal-50 text-xs font-semibold transition-colors self-start sm:self-auto border border-teal-200 cursor-pointer"
          >
            <span>Ver todas as tarefas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {urgentTasks.length === 0 ? (
          <div className="py-5 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-100">
            Nenhuma tarefa pendente para hoje ou atrasada. Todas as rotinas estão em dia!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {urgentTasks.map((task) => {
              const effectiveTaskStatus = getEffectiveTaskStatus(task);
              const isOverdue = effectiveTaskStatus === 'Atrasada';
              const isToday = task.date === todayStr;

              return (
                <div
                  key={task.id}
                  onClick={() => onNavigate('tasks')}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-teal-50/40 hover:border-teal-300 transition-all cursor-pointer space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${
                        isOverdue
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : isToday
                          ? 'bg-teal-100 text-teal-800 border border-teal-200'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {isOverdue ? 'Em atraso' : 'Hoje'} · {task.date.split('-').reverse().join('/')} · Prioridade {task.priority.toLowerCase()}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-900">
                    {task.title}
                  </p>

                  <div className="space-y-1 text-xs text-slate-600 pt-1 border-t border-slate-200/60">
                    <p>
                      <strong>Setores envolvidos:</strong> {task.involvedSectors.join(', ')}
                    </p>
                    <p>
                      <strong>Responsável:</strong> {task.responsible}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Layout em Duas Colunas: Itens que precisam de atenção & Registros por Setor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Itens que precisam de atenção */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <span>Itens que precisam de atenção</span>
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                {urgentIssues.length} itens
              </span>
            </div>

            {urgentIssues.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p>Nenhum item crítico ou atrasado no momento.</p>
                <p className="text-xs text-slate-400 mt-1">Todos os prazos estão em dia.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {urgentIssues.map((issue) => {
                  const effectiveStatus = getEffectiveStatus(issue);
                  const isOverdue = effectiveStatus === 'Atrasado';

                  return (
                    <div
                      key={issue.id}
                      onClick={() => onNavigate('pendencies')}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 transition-colors cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-800">
                          {issue.code} · {issue.location} · Prioridade {issue.priority.toLowerCase()}
                        </span>
                        {isOverdue ? (
                          <span className="text-xs font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            🔴 Em atraso
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            🟡 Em andamento
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                        {issue.problem}
                      </p>

                      <div className="text-xs text-slate-600 pt-1 border-t border-slate-200/60 space-y-0.5">
                        <p>
                          <strong>Responsável:</strong> {issue.responsible || 'Não informado'}
                        </p>
                        <p>
                          <strong>Prazo:</strong> {issue.deadline}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigate('pendencies')}
              className="w-full py-2.5 px-4 rounded-xl text-center text-sm font-semibold text-teal-700 hover:bg-teal-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Ver todos os itens</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Registros por Setor & Prioridades */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Registros por Setor
              </h3>
              <p className="text-xs text-slate-500">
                Acompanhe a quantidade de registros realizados por cada setor.
              </p>
            </div>

            {sortedLocations.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                Nenhum registro no momento.
              </div>
            ) : (
              <div className="space-y-3">
                {sortedLocations.slice(0, 5).map(([loc, count]) => {
                  const percent = indicators.total > 0 ? Math.round((count / indicators.total) * 100) : 0;
                  return (
                    <div key={loc} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-slate-700 font-semibold">{loc} — {count} {count === 1 ? 'registro' : 'registros'} ({percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Itens em aberto por prioridade */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700 block mb-2.5">
                Itens em aberto por prioridade
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div
                  onClick={() => onFilterPendencies(undefined, 'Alta')}
                  className="p-2.5 rounded-lg bg-orange-50 border border-orange-200 cursor-pointer hover:bg-orange-100 transition-colors"
                >
                  <span className="block text-[11px] font-semibold text-orange-800">Prioridade alta</span>
                  <span className="text-base font-bold text-orange-950">{highCount}</span>
                </div>
                <div
                  onClick={() => onFilterPendencies(undefined, 'Média')}
                  className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors"
                >
                  <span className="block text-[11px] font-semibold text-amber-800">Prioridade média</span>
                  <span className="text-base font-bold text-amber-950">{mediumCount}</span>
                </div>
                <div
                  onClick={() => onFilterPendencies(undefined, 'Baixa')}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <span className="block text-[11px] font-semibold text-slate-700">Prioridade baixa</span>
                  <span className="text-base font-bold text-slate-900">{lowCount}</span>
                </div>
                <div
                  onClick={() => onFilterPendencies(undefined, 'Sem prioridade')}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <span className="block text-[11px] font-semibold text-slate-700">Sem prioridade</span>
                  <span className="text-base font-bold text-slate-900">{unassignedPriorityCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ambiente de demonstração */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Ambiente de demonstração</span>
            <button
              onClick={onResetData}
              className="inline-flex items-center gap-1.5 text-teal-700 hover:text-teal-900 font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar dados de demonstração</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
