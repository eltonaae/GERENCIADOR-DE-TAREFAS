import React, { useState, useMemo } from 'react';
import {
  QualityTask,
  HospitalLocation,
  HOSPITAL_LOCATIONS,
  IssuePriority,
  PRIORITIES,
  Issue,
  getEffectiveTaskStatus,
  TaskChecklistItem,
} from '../types';
import {
  CalendarCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  User,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit2,
  CheckSquare,
  Square,
  Link as LinkIcon,
  X,
  Sparkles,
} from 'lucide-react';

interface TasksViewProps {
  tasks: QualityTask[];
  issues: Issue[];
  onAddTask: (task: Omit<QualityTask, 'id' | 'createdAt'>) => void;
  onUpdateTask: (task: QualityTask) => void;
  onDeleteTask: (taskId: string) => void;
  onSelectIssue?: (issueId: string) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  issues,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onSelectIssue,
}) => {
  // Modal / Form state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<QualityTask | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [involvedSectors, setInvolvedSectors] = useState<HospitalLocation[]>([]);
  const [responsible, setResponsible] = useState('');
  const [priority, setPriority] = useState<IssuePriority>('Média');
  const [status, setStatus] = useState<'Pendente' | 'Em andamento' | 'Concluída'>('Pendente');
  const [issueId, setIssueId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [checklistItems, setChecklistItems] = useState<{ id: string; text: string; done: boolean }[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDateScope, setFilterDateScope] = useState<'all' | 'today' | 'tomorrow' | 'overdue' | 'week'>('all');
  const [filterSector, setFilterSector] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Expanded items for checklist view
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  // Open Create Modal
  const handleOpenCreate = (prefill?: Partial<QualityTask>) => {
    setTitle(prefill?.title || '');
    setDate(prefill?.date || todayStr);
    setInvolvedSectors(prefill?.involvedSectors || []);
    setResponsible(prefill?.responsible || '');
    setPriority(prefill?.priority || 'Média');
    setStatus(prefill?.status || 'Pendente');
    setIssueId(prefill?.issueId || '');
    setNotes(prefill?.notes || '');
    setChecklistItems(prefill?.checklist || []);
    setNewChecklistText('');
    setFormErrors({});
    setEditingTask(null);
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (task: QualityTask) => {
    setEditingTask(task);
    setTitle(task.title);
    setDate(task.date);
    setInvolvedSectors(task.involvedSectors || []);
    setResponsible(task.responsible);
    setPriority(task.priority);
    setStatus(task.status);
    setIssueId(task.issueId || '');
    setNotes(task.notes || '');
    setChecklistItems(task.checklist || []);
    setNewChecklistText('');
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const handleToggleSector = (sector: HospitalLocation) => {
    setInvolvedSectors((prev) =>
      prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]
    );
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setChecklistItems((prev) => [
      ...prev,
      {
        id: 'chk-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
        text: newChecklistText.trim(),
        done: false,
      },
    ]);
    setNewChecklistText('');
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklistItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = 'Informe a descrição/título da tarefa.';
    }
    if (!date) {
      errors.date = 'Selecione a data prevista da tarefa.';
    }
    if (involvedSectors.length === 0) {
      errors.involvedSectors = 'Selecione ao menos 1 setor envolvido.';
    }
    if (!responsible.trim()) {
      errors.responsible = 'Informe o responsável pela execução.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const selectedIssue = issues.find((i) => i.id === issueId);

    if (editingTask) {
      onUpdateTask({
        ...editingTask,
        title: title.trim(),
        date,
        involvedSectors,
        responsible: responsible.trim(),
        priority,
        status,
        issueId: issueId || undefined,
        issueCode: selectedIssue ? selectedIssue.code : undefined,
        checklist: checklistItems,
        notes: notes.trim() || undefined,
        completedAt: status === 'Concluída' ? editingTask.completedAt || new Date().toISOString() : undefined,
      });
    } else {
      onAddTask({
        title: title.trim(),
        date,
        involvedSectors,
        responsible: responsible.trim(),
        priority,
        status,
        issueId: issueId || undefined,
        issueCode: selectedIssue ? selectedIssue.code : undefined,
        checklist: checklistItems,
        notes: notes.trim() || undefined,
        completedAt: status === 'Concluída' ? new Date().toISOString() : undefined,
      });
    }

    setIsCreateModalOpen(false);
  };

  // Toggle quick completion directly from list
  const handleToggleTaskStatus = (task: QualityTask) => {
    const nextStatus = task.status === 'Concluída' ? 'Pendente' : 'Concluída';
    onUpdateTask({
      ...task,
      status: nextStatus,
      completedAt: nextStatus === 'Concluída' ? new Date().toISOString() : undefined,
    });
  };

  // Toggle subtask checklist item
  const handleToggleChecklist = (task: QualityTask, checkId: string) => {
    const currentList = task.checklist || [];
    const updatedList = currentList.map((item) =>
      item.id === checkId ? { ...item, done: !item.done } : item
    );

    // If all checklist items are done, can suggest or keep status
    const allDone = updatedList.length > 0 && updatedList.every((i) => i.done);

    onUpdateTask({
      ...task,
      checklist: updatedList,
      status: allDone ? 'Concluída' : task.status === 'Concluída' && !allDone ? 'Em andamento' : task.status,
      completedAt: allDone ? task.completedAt || new Date().toISOString() : undefined,
    });
  };

  const toggleExpand = (taskId: string) => {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchResp = task.responsible.toLowerCase().includes(q);
        const matchCode = task.issueCode?.toLowerCase().includes(q);
        const matchSector = task.involvedSectors.some((s) => s.toLowerCase().includes(q));
        if (!matchTitle && !matchResp && !matchCode && !matchSector) {
          return false;
        }
      }

      // Date scope filter
      const effectiveStatus = getEffectiveTaskStatus(task);
      if (filterDateScope === 'today' && task.date !== todayStr) {
        return false;
      }
      if (filterDateScope === 'tomorrow' && task.date !== tomorrowStr) {
        return false;
      }
      if (filterDateScope === 'overdue' && effectiveStatus !== 'Atrasada') {
        return false;
      }
      if (filterDateScope === 'week') {
        // next 7 days
        const tDate = new Date(task.date + 'T00:00:00');
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const next7 = new Date();
        next7.setDate(next7.getDate() + 7);
        next7.setHours(23, 59, 59, 999);
        if (tDate < now || tDate > next7) {
          return false;
        }
      }

      // Sector filter
      if (filterSector !== 'all') {
        if (!task.involvedSectors.includes(filterSector as HospitalLocation)) {
          return false;
        }
      }

      // Status filter
      if (filterStatus !== 'all') {
        if (filterStatus === 'Atrasada') {
          if (effectiveStatus !== 'Atrasada') return false;
        } else if (task.status !== filterStatus) {
          return false;
        }
      }

      // Priority filter
      if (filterPriority !== 'all' && task.priority !== filterPriority) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, filterDateScope, filterSector, filterStatus, filterPriority, todayStr, tomorrowStr]);

  // Statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const concluidas = tasks.filter((t) => t.status === 'Concluída').length;
    const hoje = tasks.filter((t) => t.date === todayStr).length;
    const atrasadas = tasks.filter((t) => getEffectiveTaskStatus(t) === 'Atrasada').length;
    const pendentes = tasks.filter((t) => t.status !== 'Concluída').length;
    const taxa = total > 0 ? Math.round((concluidas / total) * 100) : 0;
    return { total, concluidas, hoje, atrasadas, pendentes, taxa };
  }, [tasks, todayStr]);

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
                <CalendarCheck className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Tarefas e Ações da Rotina
              </h1>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Acompanhamento diário de tarefas, prazos por setor e organização das rotinas.
            </p>
          </div>

          <button
            id="btn-add-new-task"
            onClick={() => handleOpenCreate()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Tarefa</span>
          </button>
        </div>

        {/* Quick summary stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div
            onClick={() => {
              setFilterDateScope('all');
              setFilterStatus('all');
            }}
            className="cursor-pointer p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/70 transition-colors"
          >
            <span className="text-xs font-medium text-slate-500 block">Total de Tarefas</span>
            <span className="text-xl font-bold text-slate-900">{stats.total}</span>
          </div>

          <div
            onClick={() => {
              setFilterDateScope('today');
              setFilterStatus('all');
            }}
            className={`cursor-pointer p-3 rounded-lg border transition-colors ${
              filterDateScope === 'today'
                ? 'bg-teal-50 border-teal-300 ring-1 ring-teal-400'
                : 'bg-slate-50 hover:bg-teal-50/50 border-slate-200/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-teal-800">Dia de Hoje</span>
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
            </div>
            <span className="text-xl font-bold text-teal-900">{stats.hoje}</span>
          </div>

          <div
            onClick={() => {
              setFilterDateScope('overdue');
              setFilterStatus('all');
            }}
            className={`cursor-pointer p-3 rounded-lg border transition-colors ${
              filterDateScope === 'overdue'
                ? 'bg-rose-50 border-rose-300 ring-1 ring-rose-400'
                : 'bg-slate-50 hover:bg-rose-50/50 border-slate-200/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-rose-800">Atrasadas</span>
              {stats.atrasadas > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>}
            </div>
            <span className="text-xl font-bold text-rose-900">{stats.atrasadas}</span>
          </div>

          <div
            onClick={() => {
              setFilterDateScope('all');
              setFilterStatus('Concluída');
            }}
            className={`cursor-pointer p-3 rounded-lg border transition-colors ${
              filterStatus === 'Concluída'
                ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400'
                : 'bg-slate-50 hover:bg-emerald-50/50 border-slate-200/70'
            }`}
          >
            <span className="text-xs font-medium text-emerald-800 block">Concluídas</span>
            <span className="text-xl font-bold text-emerald-900">{stats.concluidas}</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
            <span className="text-xs font-medium text-slate-500 block">Cumprimento</span>
            <span className="text-xl font-bold text-slate-900">{stats.taxa}%</span>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por tarefa, responsável, setor ou código do problema..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Quick Date Scope Buttons */}
          <div className="flex items-center overflow-x-auto gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium text-slate-600">
            <button
              onClick={() => setFilterDateScope('all')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                filterDateScope === 'all' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Todas as datas
            </button>
            <button
              onClick={() => setFilterDateScope('today')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                filterDateScope === 'today' ? 'bg-teal-600 text-white font-semibold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Hoje ({stats.hoje})
            </button>
            <button
              onClick={() => setFilterDateScope('tomorrow')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                filterDateScope === 'tomorrow' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Amanhã
            </button>
            <button
              onClick={() => setFilterDateScope('week')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                filterDateScope === 'week' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Próximos 7 dias
            </button>
            <button
              onClick={() => setFilterDateScope('overdue')}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                filterDateScope === 'overdue' ? 'bg-rose-600 text-white font-semibold shadow-xs' : 'hover:text-rose-700'
              }`}
            >
              Atrasadas ({stats.atrasadas})
            </button>
          </div>
        </div>

        {/* Secondary Select Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filtrar por:
          </span>

          {/* Sector filter */}
          <select
            value={filterSector}
            onChange={(e) => setFilterSector(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">Todos os setores envolvidos</option>
            {HOSPITAL_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">Todos os status</option>
            <option value="Pendente">Pendente</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Concluída">Concluída</option>
            <option value="Atrasada">Atrasada</option>
          </select>

          {/* Priority filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">Todas as prioridades</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                Prioridade: {p}
              </option>
            ))}
          </select>

          {(filterSector !== 'all' || filterStatus !== 'all' || filterPriority !== 'all' || searchQuery || filterDateScope !== 'all') && (
            <button
              onClick={() => {
                setFilterSector('all');
                setFilterStatus('all');
                setFilterPriority('all');
                setSearchQuery('');
                setFilterDateScope('all');
              }}
              className="text-teal-700 hover:text-teal-900 font-semibold ml-auto underline"
            >
              Resetar filtros
            </button>
          )}
        </div>
      </div>

      {/* Task list container */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Nenhuma tarefa encontrada</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Nenhuma tarefa corresponde aos filtros selecionados. Crie uma nova tarefa com data e setores envolvidos.
            </p>
            <button
              onClick={() => handleOpenCreate()}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar Tarefa
            </button>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const effectiveStatus = getEffectiveTaskStatus(task);
            const isCompleted = task.status === 'Concluída';
            const isOverdue = effectiveStatus === 'Atrasada';
            const isToday = task.date === todayStr;
            const isExpanded = !!expandedTasks[task.id];
            const checklist = task.checklist || [];
            const completedChecklistCount = checklist.filter((i) => i.done).length;

            return (
              <div
                key={task.id}
                id={`task-card-${task.id}`}
                className={`bg-white rounded-xl border transition-all shadow-2xs ${
                  isCompleted
                    ? 'border-slate-200 bg-slate-50/40 opacity-85'
                    : isOverdue
                    ? 'border-rose-200 ring-1 ring-rose-100 hover:border-rose-300'
                    : isToday
                    ? 'border-teal-300 ring-1 ring-teal-100 hover:border-teal-400'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Fast Toggle Completion Checkbox */}
                    <button
                      onClick={() => handleToggleTaskStatus(task)}
                      title={isCompleted ? 'Reabrir tarefa' : 'Marcar como concluída'}
                      className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'border-2 border-slate-300 hover:border-teal-600 text-transparent hover:text-teal-600'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    {/* Task Details Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        {/* Date badge */}
                        <div
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                            isCompleted
                              ? 'bg-slate-100 text-slate-600'
                              : isOverdue
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : isToday
                              ? 'bg-teal-100 text-teal-800 border border-teal-300 font-bold'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {isToday
                              ? `Hoje (${task.date.split('-').reverse().join('/')})`
                              : isOverdue
                              ? `Atrasada (${task.date.split('-').reverse().join('/')})`
                              : task.date.split('-').reverse().join('/')}
                          </span>
                        </div>

                        {/* Priority Badge */}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                            task.priority === 'Crítica'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : task.priority === 'Alta'
                              ? 'bg-orange-50 text-orange-700 border border-orange-200'
                              : task.priority === 'Média'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {task.priority}
                        </span>

                        {/* Status badge */}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : task.status === 'Em andamento'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {task.status}
                        </span>

                        {/* Issue Code Link (if linked) */}
                        {task.issueCode && (
                          <div
                            onClick={() => task.issueId && onSelectIssue && onSelectIssue(task.issueId)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold cursor-pointer transition-colors"
                            title="Problema vinculado"
                          >
                            <LinkIcon className="w-3 h-3" />
                            <span>{task.issueCode}</span>
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <h4
                        className={`text-base font-semibold leading-snug ${
                          isCompleted ? 'line-through text-slate-500' : 'text-slate-900'
                        }`}
                      >
                        {task.title}
                      </h4>

                      {/* Involved Sectors & Responsible Row */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs text-slate-600">
                        {/* Involved Sectors Chips */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Setores envolvidos:</span>
                          </span>
                          {task.involvedSectors.map((sector) => (
                            <span
                              key={sector}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-medium border border-slate-200"
                            >
                              {sector}
                            </span>
                          ))}
                        </div>

                        {/* Responsible */}
                        <div className="flex items-center gap-1 text-slate-700 font-medium">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{task.responsible}</span>
                        </div>
                      </div>

                      {/* Optional Notes */}
                      {task.notes && (
                        <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {task.notes}
                        </p>
                      )}

                      {/* Checklist Summary / Progress */}
                      {checklist.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <div
                            onClick={() => toggleExpand(task.id)}
                            className="flex items-center justify-between cursor-pointer py-1 text-xs font-medium text-slate-700 hover:text-teal-700 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">Checklist de Ações:</span>
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {completedChecklistCount} de {checklist.length} concluídas
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-teal-600">
                              <span>{isExpanded ? 'Ocultar' : 'Ver passos'}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </div>
                          </div>

                          {/* Expanded Checklist Interactive Items */}
                          {isExpanded && (
                            <div className="space-y-1.5 mt-2 pl-1">
                              {checklist.map((item) => (
                                <label
                                  key={item.id}
                                  className="flex items-center gap-2 text-xs text-slate-700 hover:bg-slate-50 p-1.5 rounded cursor-pointer transition-colors"
                                >
                                  <input
                                    type="checkbox"
                                    checked={item.done}
                                    onChange={() => handleToggleChecklist(task, item.id)}
                                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                                  />
                                  <span className={item.done ? 'line-through text-slate-400' : 'text-slate-800'}>
                                    {item.text}
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(task)}
                        title="Editar tarefa"
                        className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
                            onDeleteTask(task.id);
                          }
                        }}
                        title="Excluir tarefa"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingTask ? 'Editar Tarefa' : 'Adicionar Nova Tarefa'}
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveForm} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Task Title */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">
                  O que deve ser feito? (Título / Descrição da Tarefa) *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Calibrar sensor do termostato da geladeira de termolábeis..."
                  className={`w-full px-3.5 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                    formErrors.title ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 bg-white'
                  }`}
                />
                {formErrors.title && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.title}</p>}
              </div>

              {/* Date (Dia da Tarefa) with Shortcuts */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-semibold text-slate-800">
                    Dia / Data de Execução Prevista *
                  </label>
                  <div className="flex items-center gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setDate(todayStr)}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 font-medium"
                    >
                      Hoje
                    </button>
                    <button
                      type="button"
                      onClick={() => setDate(tomorrowStr)}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 font-medium"
                    >
                      Amanhã
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 7);
                        setDate(d.toISOString().slice(0, 10));
                      }}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 font-medium"
                    >
                      +7 dias
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                    formErrors.date ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 bg-white'
                  }`}
                />
                {formErrors.date && <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.date}</p>}
              </div>

              {/* Setores Envolvidos (Multiple Selection) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold text-slate-800">
                    Setores Envolvidos na Tarefa *
                  </label>
                  <span className="text-xs text-slate-500">
                    {involvedSectors.length} setor(es) selecionado(s)
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-2">
                  Selecione todas as áreas hospitalares que participam da execução ou validação desta ação:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                  {HOSPITAL_LOCATIONS.map((loc) => {
                    const isSelected = involvedSectors.includes(loc);
                    return (
                      <button
                        type="button"
                        key={loc}
                        onClick={() => handleToggleSector(loc)}
                        className={`flex items-center gap-2 p-2 rounded-md text-xs text-left font-medium transition-colors ${
                          isSelected
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[10px] ${
                          isSelected ? 'border-white bg-white text-teal-700 font-bold' : 'border-slate-400 bg-white'
                        }`}>
                          {isSelected ? '✓' : ''}
                        </span>
                        <span className="truncate">{loc}</span>
                      </button>
                    );
                  })}
                </div>
                {formErrors.involvedSectors && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.involvedSectors}</p>
                )}
              </div>

              {/* Responsible and Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">
                    Responsável pela Execução *
                  </label>
                  <input
                    type="text"
                    value={responsible}
                    onChange={(e) => setResponsible(e.target.value)}
                    placeholder="Ex: Carlos Nogueira (Manutenção)"
                    className={`w-full px-3.5 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      formErrors.responsible ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 bg-white'
                    }`}
                  />
                  {formErrors.responsible && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">{formErrors.responsible}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as IssuePriority)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status and Linked Issue */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">
                    Status Atual
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'Pendente' | 'Em andamento' | 'Concluída')}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Concluída">Concluída</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">
                    Vincular a um Problema / Pendência (Opcional)
                  </label>
                  <select
                    value={issueId}
                    onChange={(e) => setIssueId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Nenhum vínculo (Tarefa Avulsa)</option>
                    {issues.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.code} - {i.problem.substring(0, 45)}...
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Checklist / Subtarefas Builder */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">
                  Checklist de Etapas da Tarefa (Opcional)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddChecklistItem();
                      }
                    }}
                    placeholder="Adicionar passo ou etapa (ex: Coletar assinatura, Emitir laudo)..."
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddChecklistItem}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Adicionar Passo
                  </button>
                </div>

                {checklistItems.length > 0 && (
                  <div className="space-y-1.5 p-2 bg-slate-50 rounded-lg border border-slate-200 max-h-36 overflow-y-auto">
                    {checklistItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-2 p-1.5 bg-white rounded border border-slate-100 text-xs">
                        <span className="truncate text-slate-700">{item.text}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveChecklistItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Operational Notes */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">
                  Observações Operacionais
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informações adicionais para a equipe executora..."
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs"
                >
                  {editingTask ? 'Salvar Alterações' : 'Criar Tarefa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
