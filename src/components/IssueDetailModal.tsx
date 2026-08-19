import React, { useState } from 'react';
import { Issue, IssueStatus, QualityTask, getEffectiveStatus, getEffectiveTaskStatus, HospitalLocation } from '../types';
import {
  X,
  Building2,
  Calendar,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2,
  Tag,
  ShieldCheck,
  FileText,
  CalendarCheck,
  Plus,
  Layers,
} from 'lucide-react';

interface IssueDetailModalProps {
  issue: Issue | null;
  tasks?: QualityTask[];
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: IssueStatus) => void;
  onDelete: (id: string) => void;
  onAddTaskForIssue?: (task: Omit<QualityTask, 'id' | 'createdAt'>) => void;
  onToggleTaskStatus?: (task: QualityTask) => void;
  onOpenTasksTab?: () => void;
}

export const IssueDetailModal: React.FC<IssueDetailModalProps> = ({
  issue,
  tasks = [],
  onClose,
  onUpdateStatus,
  onDelete,
  onAddTaskForIssue,
  onToggleTaskStatus,
  onOpenTasksTab,
}) => {
  const [isAddingQuickTask, setIsAddingQuickTask] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskDate, setQuickTaskDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [quickTaskResponsible, setQuickTaskResponsible] = useState('');

  if (!issue) return null;

  const effectiveStatus = getEffectiveStatus(issue);
  const isOverdue = effectiveStatus === 'Atrasado';

  const linkedTasks = tasks.filter((t) => t.issueId === issue.id || t.issueCode === issue.code);

  const priorityColors: Record<string, string> = {
    Crítica: 'bg-rose-100 text-rose-800 border-rose-200',
    Alta: 'bg-orange-100 text-orange-800 border-orange-200',
    Média: 'bg-amber-100 text-amber-800 border-amber-200',
    Baixa: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  const handleCreateQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim() || !quickTaskDate || !onAddTaskForIssue) return;

    onAddTaskForIssue({
      title: quickTaskTitle.trim(),
      date: quickTaskDate,
      involvedSectors: issue.involvedSectors || [issue.location],
      responsible: quickTaskResponsible.trim() || issue.responsible || 'Responsável designado',
      priority: issue.priority,
      status: 'Pendente',
      issueId: issue.id,
      issueCode: issue.code,
    });

    setQuickTaskTitle('');
    setIsAddingQuickTask(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-bold text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded border border-teal-200">
                {issue.code}
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded border ${priorityColors[issue.priority]}`}>
                Prioridade {issue.priority}
              </span>
              {issue.isDemo && (
                <span className="text-xs text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">
                  Demonstração
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              Detalhes do Registro
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Status Alteration Bar */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Status Atual do Registro
              </span>
              <div className="flex items-center gap-2 mt-1">
                {effectiveStatus === 'Resolvido' && (
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    🟢 Resolvido
                  </span>
                )}
                {effectiveStatus === 'Em andamento' && (
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                    <Clock className="w-4 h-4 text-amber-600" />
                    🟡 Em andamento
                  </span>
                )}
                {effectiveStatus === 'Atrasado' && (
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-rose-800 bg-rose-100 px-3 py-1 rounded-full border border-rose-300">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    🔴 Atrasado (Prazo Vencido)
                  </span>
                )}
                {effectiveStatus === 'Aberto' && (
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-800 bg-slate-200 px-3 py-1 rounded-full border border-slate-300">
                    ⚪ Aberto
                  </span>
                )}
              </div>
            </div>

            {/* Quick Status Selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-500 font-medium mr-1">Alterar para:</span>
              <button
                onClick={() => onUpdateStatus(issue.id, 'Aberto')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                  issue.status === 'Aberto'
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Aberto
              </button>
              <button
                onClick={() => onUpdateStatus(issue.id, 'Em andamento')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                  issue.status === 'Em andamento'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Em andamento
              </button>
              <button
                onClick={() => onUpdateStatus(issue.id, 'Resolvido')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                  issue.status === 'Resolvido'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                ✓ Resolvido
              </button>
            </div>
          </div>

          {/* 1. Qual é o problema */}
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              1. Descrição do Problema
            </span>
            <p className="text-base text-slate-900 font-medium bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 leading-relaxed">
              {issue.problem}
            </p>
          </div>

          {/* Location & Sector Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1">
                2. Setor / Onde ocorreu
              </span>
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                <Building2 className="w-4 h-4 text-teal-600" />
                <span>
                  {issue.location}
                  {issue.customLocation ? ` (${issue.customLocation})` : ''}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1">
                6. Responsável pela Ação
              </span>
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                <UserCheck className="w-4 h-4 text-teal-600" />
                <span>{issue.responsible || 'Não especificado'}</span>
              </div>
            </div>
          </div>

          {/* Setores Envolvidos na Tratativa */}
          {issue.involvedSectors && issue.involvedSectors.length > 0 && (
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1.5">
                Setores Envolvidos na Tratativa
              </span>
              <div className="flex flex-wrap gap-1.5">
                {issue.involvedSectors.map((sector) => (
                  <span
                    key={sector}
                    className="text-xs font-semibold px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1"
                  >
                    <Building2 className="w-3 h-3 text-teal-600" />
                    {sector}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tasks linked to this Issue */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-teal-700" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Tarefas e Ações Vinculadas ({linkedTasks.length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingQuickTask((prev) => !prev)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingQuickTask ? 'Fechar' : 'Adicionar Tarefa'}</span>
              </button>
            </div>

            {/* Quick add task form inline */}
            {isAddingQuickTask && (
              <form onSubmit={handleCreateQuickTask} className="p-3 bg-white rounded-lg border border-teal-200 space-y-2 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-0.5">O que deve ser feito?</label>
                  <input
                    type="text"
                    required
                    value={quickTaskTitle}
                    onChange={(e) => setQuickTaskTitle(e.target.value)}
                    placeholder="Ex: Emitir relatório de calibragem..."
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-0.5">Dia de Execução</label>
                    <input
                      type="date"
                      required
                      value={quickTaskDate}
                      onChange={(e) => setQuickTaskDate(e.target.value)}
                      className="w-full px-2 py-1 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-0.5">Responsável</label>
                    <input
                      type="text"
                      value={quickTaskResponsible}
                      onChange={(e) => setQuickTaskResponsible(e.target.value)}
                      placeholder={issue.responsible || 'Responsável'}
                      className="w-full px-2 py-1 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingQuickTask(false)}
                    className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-teal-600 text-white rounded font-medium hover:bg-teal-700"
                  >
                    Salvar Tarefa
                  </button>
                </div>
              </form>
            )}

            {/* List of linked tasks */}
            {linkedTasks.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-1">
                Nenhuma tarefa operacional cadastrada para este problema. Clique em "Adicionar Tarefa" para definir prazos e responsáveis por etapa.
              </p>
            ) : (
              <div className="space-y-1.5">
                {linkedTasks.map((t) => {
                  const tStatus = getEffectiveTaskStatus(t);
                  const isDone = t.status === 'Concluída';
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                        <button
                          type="button"
                          onClick={() => onToggleTaskStatus && onToggleTaskStatus(t)}
                          className={`w-4 h-4 rounded flex items-center justify-center ${
                            isDone ? 'bg-emerald-600 text-white' : 'border border-slate-300 text-transparent hover:text-teal-600'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <span className={`truncate ${isDone ? 'line-through text-slate-400' : 'text-slate-900 font-medium'}`}>
                          {t.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-slate-500">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Calendar className="w-3 h-3" />
                          {t.date.split('-').reverse().join('/')}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${
                            isDone
                              ? 'bg-emerald-50 text-emerald-700'
                              : tStatus === 'Atrasada'
                              ? 'bg-rose-50 text-rose-700 font-bold'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {tStatus}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Nature & Impact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1.5">
                3. Natureza do Problema
              </span>
              <div className="flex flex-wrap gap-1.5">
                {issue.nature.map((n) => (
                  <span
                    key={n}
                    className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1.5">
                4. Impacto Observado
              </span>
              {issue.hasImpact ? (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded inline-block">
                    Houve Impacto: Sim
                  </span>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {issue.impactTypes.map((imp) => (
                      <span
                        key={imp}
                        className="text-xs font-medium px-2 py-0.5 rounded bg-rose-100 text-rose-800"
                      >
                        {imp}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded inline-block">
                  Houve Impacto: Não
                </span>
              )}
            </div>
          </div>

          {/* 7. Prazo Timeline */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">
                7. Prazo Limite
              </span>
              <div className="flex items-center gap-2 mt-0.5 text-slate-900 font-bold text-sm">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>{issue.deadline}</span>
              </div>
            </div>

            {isOverdue ? (
              <span className="text-xs font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-full">
                ⚠️ Prazo Vencido
              </span>
            ) : (
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {issue.status === 'Resolvido' ? 'Concluído' : 'Dentro do prazo'}
              </span>
            )}
          </div>

          {/* 8. O que precisa ser feito */}
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              8. O que precisa ser feito? (Ação Corretiva / Preventiva)
            </span>
            <p className="text-sm text-slate-800 bg-teal-50/50 p-3.5 rounded-xl border border-teal-200 leading-relaxed font-normal">
              {issue.actionNeeded}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm(`Deseja realmente excluir a pendência ${issue.code}?`)) {
                onDelete(issue.id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Excluir Registro</span>
          </button>

          <div className="flex items-center gap-2">
            {onOpenTasksTab && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTasksTab();
                }}
                className="px-4 py-2 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 text-sm font-semibold hover:bg-teal-100 transition-colors"
              >
                Ver no Painel de Tarefas
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
