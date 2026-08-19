import React, { useState, useMemo } from 'react';
import {
  Issue,
  IssueStatus,
  HospitalLocation,
  IssuePriority,
  HOSPITAL_LOCATIONS,
  PRIORITIES,
  getEffectiveStatus,
} from '../types';
import {
  Search,
  Filter,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  UserCheck,
  Eye,
  SlidersHorizontal,
  RotateCcw,
  Download,
  FileSpreadsheet,
} from 'lucide-react';

interface PendenciesViewProps {
  issues: Issue[];
  onUpdateStatus: (id: string, newStatus: IssueStatus) => void;
  onSelectIssue: (issue: Issue) => void;
  onNavigateToRegister: () => void;
  initialStatusFilter?: string;
  initialPriorityFilter?: string;
}

export const PendenciesView: React.FC<PendenciesViewProps> = ({
  issues,
  onUpdateStatus,
  onSelectIssue,
  onNavigateToRegister,
  initialStatusFilter = 'Todos',
  initialPriorityFilter = 'Todas',
}) => {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [priorityFilter, setPriorityFilter] = useState(initialPriorityFilter);
  const [locationFilter, setLocationFilter] = useState('Todos');
  const [responsibleFilter, setResponsibleFilter] = useState('');
  const [sortBy, setSortBy] = useState<'deadline' | 'priority' | 'createdAt'>('deadline');

  // List of unique responsibles for quick filter
  const uniqueResponsibles = useMemo(() => {
    const set = new Set<string>();
    issues.forEach((i) => {
      if (i.responsible) set.add(i.responsible);
    });
    return Array.from(set).sort();
  }, [issues]);

  // Filtered and Sorted Issues
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const effectiveStatus = getEffectiveStatus(issue);

      // Search term filter (code, problem, responsible, action)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesCode = issue.code.toLowerCase().includes(query);
        const matchesProblem = issue.problem.toLowerCase().includes(query);
        const matchesResp = issue.responsible.toLowerCase().includes(query);
        const matchesAction = issue.actionNeeded.toLowerCase().includes(query);
        const matchesLoc = issue.location.toLowerCase().includes(query);
        if (!matchesCode && !matchesProblem && !matchesResp && !matchesAction && !matchesLoc) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'Todos') {
        if (statusFilter === 'Em aberto') {
          // Both Aberto and Em andamento and Atrasado (not resolved)
          if (issue.status === 'Resolvido') return false;
        } else if (statusFilter === 'Atrasado') {
          if (effectiveStatus !== 'Atrasado') return false;
        } else if (statusFilter === 'Resolvido') {
          if (effectiveStatus !== 'Resolvido') return false;
        } else if (statusFilter === 'Em andamento') {
          if (issue.status !== 'Em andamento' || effectiveStatus === 'Atrasado') return false;
        } else if (statusFilter === 'Aberto') {
          if (issue.status !== 'Aberto' || effectiveStatus === 'Atrasado') return false;
        }
      }

      // Priority filter
      if (priorityFilter !== 'Todas') {
        if (issue.priority !== priorityFilter) return false;
      }

      // Location filter
      if (locationFilter !== 'Todos') {
        if (issue.location !== locationFilter) return false;
      }

      // Responsible filter
      if (responsibleFilter.trim()) {
        if (!issue.responsible.toLowerCase().includes(responsibleFilter.toLowerCase())) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'deadline') {
        return a.deadline.localeCompare(b.deadline);
      }
      if (sortBy === 'priority') {
        const priorityWeight: Record<IssuePriority, number> = {
          Crítica: 4,
          Alta: 3,
          Média: 2,
          Baixa: 1,
        };
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [issues, searchTerm, statusFilter, priorityFilter, locationFilter, responsibleFilter, sortBy]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('Todos');
    setPriorityFilter('Todas');
    setLocationFilter('Todos');
    setResponsibleFilter('');
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    statusFilter !== 'Todos' ||
    priorityFilter !== 'Todas' ||
    locationFilter !== 'Todos' ||
    responsibleFilter !== '';

  const priorityBadgeClasses: Record<IssuePriority, string> = {
    Crítica: 'bg-rose-100 text-rose-800 border-rose-200',
    Alta: 'bg-orange-100 text-orange-800 border-orange-200',
    Média: 'bg-amber-100 text-amber-800 border-amber-200',
    Baixa: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  // CSV Export for quality report testing
  const exportToCSV = () => {
    const headers = ['Código', 'Problema', 'Local', 'Prioridade', 'Responsável', 'Prazo', 'Status', 'Impacto', 'Ação'];
    const rows = filteredIssues.map((i) => [
      i.code,
      `"${i.problem.replace(/"/g, '""')}"`,
      i.location,
      i.priority,
      `"${i.responsible.replace(/"/g, '""')}"`,
      i.deadline,
      getEffectiveStatus(i),
      i.hasImpact ? `Sim (${i.impactTypes.join(', ')})` : 'Não',
      `"${i.actionNeeded.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rotina_facil_acompanhamento_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-200 text-slate-700">
              Acompanhamento Geral
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Acompanhamento de Pendências
          </h1>
          <p className="text-sm text-slate-600">
            Acompanhe o status, responsáveis e prazos de cada atividade ou registro dos setores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            title="Exportar dados filtrados para CSV"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Exportar CSV</span>
          </button>

          <button
            id="pendencies-new-issue-btn"
            onClick={onNavigateToRegister}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Novo registro</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search text input */}
          <div className="md:col-span-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por problema, código, ação..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Filter Status */}
          <div className="md:col-span-2">
            <select
              id="filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white font-medium text-slate-700"
            >
              <option value="Todos">Status: Todos</option>
              <option value="Em aberto">Status: Em aberto</option>
              <option value="Aberto">⚪ Aberto</option>
              <option value="Em andamento">🟡 Em andamento</option>
              <option value="Resolvido">🟢 Resolvido</option>
              <option value="Atrasado">🔴 Atrasado</option>
            </select>
          </div>

          {/* Filter Priority */}
          <div className="md:col-span-2">
            <select
              id="filter-priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white font-medium text-slate-700"
            >
              <option value="Todas">Prioridade: Todas</option>
              <option value="Crítica">Crítica</option>
              <option value="Alta">Alta</option>
              <option value="Média">Média</option>
              <option value="Baixa">Baixa</option>
            </select>
          </div>

          {/* Filter Location / Sector */}
          <div className="md:col-span-2">
            <select
              id="filter-location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white font-medium text-slate-700"
            >
              <option value="Todos">Local: Todos</option>
              {HOSPITAL_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Responsible */}
          <div className="md:col-span-2">
            <input
              type="text"
              value={responsibleFilter}
              onChange={(e) => setResponsibleFilter(e.target.value)}
              placeholder="Filtrar responsável..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Sub-bar with Results count & Clear filters button */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <span>
              Exibindo <strong>{filteredIssues.length}</strong> de{' '}
              <strong>{issues.length}</strong> registros
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1 cursor-pointer ml-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Limpar filtros
              </button>
            )}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2 text-slate-500">
            <span>Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium text-xs focus:outline-hidden"
            >
              <option value="deadline">Prazo (mais urgente primeiro)</option>
              <option value="priority">Prioridade (maior primeiro)</option>
              <option value="createdAt">Data de Registro</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues Table (Desktop) & Cards (Mobile) */}
      {filteredIssues.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">
            Nenhum registro encontrado
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Não foram encontradas pendências correspondentes aos filtros selecionados.
          </p>
          {hasActiveFilters ? (
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Limpar todos os filtros
            </button>
          ) : (
            <button
              onClick={onNavigateToRegister}
              className="px-5 py-2.5 rounded-xl bg-teal-600 text-white text-xs sm:text-sm font-semibold hover:bg-teal-700 transition-colors cursor-pointer"
            >
              Registrar o primeiro problema
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View (hidden on small screens) */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-24">Código</th>
                  <th className="py-3.5 px-4">Problema & Ação</th>
                  <th className="py-3.5 px-4 w-32">Local</th>
                  <th className="py-3.5 px-4 w-28">Prioridade</th>
                  <th className="py-3.5 px-4 w-44">Responsável</th>
                  <th className="py-3.5 px-4 w-28">Prazo</th>
                  <th className="py-3.5 px-4 w-48">Status</th>
                  <th className="py-3.5 px-4 w-16 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredIssues.map((issue) => {
                  const effectiveStatus = getEffectiveStatus(issue);
                  const isOverdue = effectiveStatus === 'Atrasado';

                  return (
                    <tr
                      key={issue.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Código */}
                      <td className="py-4 px-4 align-top font-bold text-xs text-teal-800">
                        <span className="px-2 py-1 bg-teal-50 border border-teal-200 rounded">
                          {issue.code}
                        </span>
                      </td>

                      {/* Problema & Ação */}
                      <td className="py-4 px-4 align-top max-w-xs">
                        <div
                          onClick={() => onSelectIssue(issue)}
                          className="cursor-pointer group-hover:text-teal-700 transition-colors"
                        >
                          <p className="font-semibold text-slate-900 text-sm leading-snug">
                            {issue.problem}
                          </p>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                            <span className="font-medium text-slate-700">Ação:</span> {issue.actionNeeded}
                          </p>
                          {issue.hasImpact && (
                            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                                Impacto: {issue.impactTypes.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Local */}
                      <td className="py-4 px-4 align-top">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200">
                          <Building2 className="w-3 h-3 text-slate-500" />
                          {issue.location}
                        </span>
                        {issue.involvedSectors && issue.involvedSectors.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {issue.involvedSectors.map((sec) => (
                              <span key={sec} className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.5 rounded font-medium">
                                +{sec}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Prioridade */}
                      <td className="py-4 px-4 align-top">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold border ${
                            priorityBadgeClasses[issue.priority]
                          }`}
                        >
                          {issue.priority}
                        </span>
                      </td>

                      {/* Responsável */}
                      <td className="py-4 px-4 align-top text-xs font-medium text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="line-clamp-2">{issue.responsible || 'Não informado'}</span>
                        </div>
                      </td>

                      {/* Prazo */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-center gap-1 text-xs font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span
                            className={
                              isOverdue
                                ? 'font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200'
                                : 'text-slate-700'
                            }
                          >
                            {issue.deadline}
                          </span>
                        </div>
                      </td>

                      {/* Status & Quick Status Switcher */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-1.5">
                          {/* Visual Status Tag */}
                          {effectiveStatus === 'Resolvido' && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                              🟢 Resolvido
                            </span>
                          )}
                          {effectiveStatus === 'Em andamento' && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                              🟡 Em andamento
                            </span>
                          )}
                          {effectiveStatus === 'Atrasado' && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300">
                              🔴 Atrasado
                            </span>
                          )}
                          {effectiveStatus === 'Aberto' && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full border border-slate-300">
                              ⚪ Aberto
                            </span>
                          )}

                          {/* Interactive Dropdown to Alter Status */}
                          <div>
                            <select
                              value={issue.status}
                              onChange={(e) => onUpdateStatus(issue.id, e.target.value as IssueStatus)}
                              className="w-full text-xs py-1 px-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-700 hover:border-slate-400 focus:outline-hidden focus:ring-1 focus:ring-teal-500 cursor-pointer"
                            >
                              <option value="Aberto">Alterar: Aberto</option>
                              <option value="Em andamento">Alterar: Em andamento</option>
                              <option value="Resolvido">Alterar: Resolvido</option>
                            </select>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 align-top text-center">
                        <button
                          onClick={() => onSelectIssue(issue)}
                          title="Visualizar detalhes completos"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Card View */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4">
            {filteredIssues.map((issue) => {
              const effectiveStatus = getEffectiveStatus(issue);
              const isOverdue = effectiveStatus === 'Atrasado';

              return (
                <div
                  key={issue.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all"
                >
                  {/* Card Header: Code, Priority, Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                        {issue.code}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded border ${
                          priorityBadgeClasses[issue.priority]
                        }`}
                      >
                        {issue.priority}
                      </span>
                    </div>

                    <div>
                      {effectiveStatus === 'Resolvido' && (
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                          🟢 Resolvido
                        </span>
                      )}
                      {effectiveStatus === 'Em andamento' && (
                        <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                          🟡 Em andamento
                        </span>
                      )}
                      {effectiveStatus === 'Atrasado' && (
                        <span className="text-xs font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-300">
                          🔴 Atrasado
                        </span>
                      )}
                      {effectiveStatus === 'Aberto' && (
                        <span className="text-xs font-bold text-slate-700 bg-slate-200 px-2.5 py-0.5 rounded-full border border-slate-300">
                          ⚪ Aberto
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Problem text */}
                  <div>
                    <h3
                      onClick={() => onSelectIssue(issue)}
                      className="font-bold text-slate-900 text-sm cursor-pointer hover:text-teal-700"
                    >
                      {issue.problem}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <strong className="text-slate-800">Ação:</strong> {issue.actionNeeded}
                    </p>
                  </div>

                  {/* Sector, Resp, Deadline */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 block">Local / Setor</span>
                      <span className="font-semibold text-slate-800">{issue.location}</span>
                      {issue.involvedSectors && issue.involvedSectors.length > 0 && (
                        <span className="text-[10px] text-teal-700 block mt-0.5">
                          Envolvidos: {issue.involvedSectors.join(', ')}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-400 block">Prazo</span>
                      <span className={isOverdue ? 'font-bold text-rose-700' : 'font-semibold text-slate-800'}>
                        {issue.deadline} {isOverdue ? '(Vencido)' : ''}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block">Responsável</span>
                      <span className="font-semibold text-slate-800">{issue.responsible || 'Não informado'}</span>
                    </div>
                  </div>

                  {/* Status update buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-500 font-medium">Status:</span>
                      <select
                        value={issue.status}
                        onChange={(e) => onUpdateStatus(issue.id, e.target.value as IssueStatus)}
                        className="text-xs py-1 px-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-800"
                      >
                        <option value="Aberto">Aberto</option>
                        <option value="Em andamento">Em andamento</option>
                        <option value="Resolvido">Resolvido</option>
                      </select>
                    </div>

                    <button
                      onClick={() => onSelectIssue(issue)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Detalhes</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
