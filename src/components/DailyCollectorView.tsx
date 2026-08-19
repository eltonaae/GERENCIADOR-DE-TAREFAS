import React, { useState, useEffect } from 'react';
import {
  DailyLogEntry,
  DailyMetricDefinition,
  HospitalLocation,
  HOSPITAL_LOCATIONS,
  SHIFT_OPTIONS,
  ShiftType,
  SectorLeaderInfo,
} from '../types';
import {
  computeMonthlyConsolidated,
  generateMonthlyCsv,
} from '../storage';
import { SectorLeaderModal } from './SectorLeaderModal';
import { SectorCustomizerModal } from './SectorCustomizerModal';
import {
  ClipboardCheck,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Calendar,
  Building2,
  Clock,
  User,
  Users,
  Download,
  Copy,
  Check,
  TrendingUp,
  FileText,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  Filter,
  PlusCircle,
  Eye,
  Trash2,
  ShieldAlert,
  Printer,
  Hash,
  Percent,
  Gauge,
  UserCheck,
  X,
  Share2,
} from 'lucide-react';

interface DailyCollectorViewProps {
  dailyLogs: DailyLogEntry[];
  sectorTemplates: Record<HospitalLocation, DailyMetricDefinition[]>;
  sectorLeaders: Record<HospitalLocation, SectorLeaderInfo>;
  onSaveDailyLog: (log: Omit<DailyLogEntry, 'id' | 'createdAt'> & { id?: string }) => void;
  onDeleteDailyLog: (id: string) => void;
  onUpdateTemplates: (templates: Record<HospitalLocation, DailyMetricDefinition[]>) => void;
  onUpdateSectorLeaders: (leaders: Record<HospitalLocation, SectorLeaderInfo>) => void;
}

export const DailyCollectorView: React.FC<DailyCollectorViewProps> = ({
  dailyLogs,
  sectorTemplates,
  sectorLeaders,
  onSaveDailyLog,
  onDeleteDailyLog,
  onUpdateTemplates,
  onUpdateSectorLeaders,
}) => {
  // Current date in YYYY-MM-DD
  const todayStr = new Date().toISOString().slice(0, 10);
  const currentMonthStr = todayStr.slice(0, 7); // YYYY-MM

  // Collector Form State
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedSector, setSelectedSector] = useState<HospitalLocation>('Recepção / Atendimento');
  const [selectedShift, setSelectedShift] = useState<ShiftType>('Horário Comercial / Integral');
  const [collectorName, setCollectorName] = useState<string>(() => {
    return localStorage.getItem('ql_last_collector_name') || '';
  });
  const [contributors, setContributors] = useState<string[]>([]);
  const [newContributorInput, setNewContributorInput] = useState<string>('');
  const [verifiedBy, setVerifiedBy] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [formMetrics, setFormMetrics] = useState<Record<string, number | boolean>>({});
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  // Active Sub-Tab
  const [activeSubTab, setActiveSubTab] = useState<'collector' | 'monthly-feeder' | 'history'>('collector');

  // Monthly View State
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedMonthlySector, setSelectedMonthlySector] = useState<HospitalLocation | 'Todos'>('Todos');
  const [copiedSummary, setCopiedSummary] = useState(false);

  // History Filter
  const [historySectorFilter, setHistorySectorFilter] = useState<HospitalLocation | 'Todos'>('Todos');

  // Modals
  const [isLeaderModalOpen, setIsLeaderModalOpen] = useState(false);
  const [isCustomizerModalOpen, setIsCustomizerModalOpen] = useState(false);

  // Load existing log if one exists for the selected date + sector + shift
  useEffect(() => {
    const existing = dailyLogs.find(
      (l) => l.date === selectedDate && l.sector === selectedSector && l.shift === selectedShift
    );

    const template = sectorTemplates[selectedSector] || [];
    const initial: Record<string, number | boolean> = {};

    template.forEach((def) => {
      if (existing && existing.metrics[def.key] !== undefined) {
        initial[def.key] = existing.metrics[def.key];
      } else {
        initial[def.key] = def.defaultValue;
      }
    });

    setFormMetrics(initial);
    if (existing) {
      setEditingLogId(existing.id);
      setCollectorName(existing.collectorName);
      setContributors(existing.contributors || []);
      setVerifiedBy(existing.verifiedBy || '');
      setNotes(existing.notes || '');
    } else {
      setEditingLogId(null);
      setContributors([]);
      setVerifiedBy('');
      setNotes('');
    }
  }, [selectedDate, selectedSector, selectedShift, dailyLogs, sectorTemplates]);

  // Handle counter adjustments
  const handleAdjustMetric = (key: string, delta: number) => {
    setFormMetrics((prev) => {
      const current = typeof prev[key] === 'number' ? (prev[key] as number) : 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [key]: next };
    });
  };

  const handleSetNumberMetric = (key: string, val: number) => {
    setFormMetrics((prev) => ({ ...prev, [key]: val }));
  };

  const handleToggleChecklistMetric = (key: string) => {
    setFormMetrics((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Add contributor tag
  const handleAddContributor = () => {
    const trimmed = newContributorInput.trim();
    if (trimmed && !contributors.includes(trimmed)) {
      setContributors([...contributors, trimmed]);
      setNewContributorInput('');
    }
  };

  const handleRemoveContributor = (nameToRemove: string) => {
    setContributors(contributors.filter((c) => c !== nameToRemove));
  };

  // Quick 1-Click "Everything In Compliance / Zero Incidents / Checklists OK"
  const handleSetAllConforming = () => {
    const template = sectorTemplates[selectedSector] || [];
    const conforming: Record<string, number | boolean> = {};

    template.forEach((def) => {
      if (def.type === 'checklist' || def.type === 'boolean') {
        conforming[def.key] = true;
      } else if (def.target !== undefined) {
        conforming[def.key] = def.target;
      } else if (def.type === 'percentage') {
        conforming[def.key] = 100;
      } else if (def.type === 'counter') {
        conforming[def.key] = 0;
      } else {
        conforming[def.key] = def.defaultValue;
      }
    });

    setFormMetrics(conforming);
  };

  // Submit Form
  const handleSubmitDailyLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectorName.trim()) {
      alert('Por favor, informe o nome da pessoa responsável pelo lançamento.');
      return;
    }

    // Save collector name to storage for quick reuse
    localStorage.setItem('ql_last_collector_name', collectorName.trim());

    // Calculate total adverse events and deviations
    const template = sectorTemplates[selectedSector] || [];
    let adverseCount = 0;
    let hasDeviations = false;

    template.forEach((def) => {
      const val = formMetrics[def.key];
      if (def.type === 'checklist' || def.type === 'boolean') {
        if (val === false) hasDeviations = true;
      } else if (typeof val === 'number') {
        // If it's a counter for events/falls/errors
        if (
          def.key.includes('queda') ||
          def.key.includes('extubacao') ||
          def.key.includes('lesao') ||
          def.key.includes('erro') ||
          def.key.includes('acidente') ||
          def.key.includes('atraso') ||
          def.key.includes('cancelada') ||
          def.key.includes('intercorrencia') ||
          def.key.includes('inconsistencia') ||
          def.key.includes('recoleta')
        ) {
          adverseCount += val;
        }

        if (def.target !== undefined) {
          if (def.targetType === 'max' && val > def.target) hasDeviations = true;
          if (def.targetType === 'min' && val < def.target) hasDeviations = true;
        }
      }
    });

    onSaveDailyLog({
      id: editingLogId || undefined,
      date: selectedDate,
      sector: selectedSector,
      shift: selectedShift,
      collectorName: collectorName.trim(),
      contributors: contributors.length > 0 ? contributors : undefined,
      verifiedBy: verifiedBy.trim() || undefined,
      metrics: formMetrics,
      totalAdverseEvents: adverseCount,
      hasDeviations,
      notes: notes.trim() || undefined,
    });
  };

  // Compute monthly consolidation
  const monthlyData = computeMonthlyConsolidated(dailyLogs, sectorTemplates, selectedMonth, sectorLeaders);

  // Sectors status for the selected date
  const sectorsDailyStatus = HOSPITAL_LOCATIONS.map((sec) => {
    const logsForSec = dailyLogs.filter((l) => l.date === selectedDate && l.sector === sec);
    return {
      sector: sec,
      count: logsForSec.length,
      isCollected: logsForSec.length > 0,
      hasDeviations: logsForSec.some((l) => l.hasDeviations),
    };
  });

  const collectedCount = sectorsDailyStatus.filter((s) => s.isCollected).length;

  // Active sector leader info
  const activeSectorLeader = sectorLeaders[selectedSector] || { name: 'Não definido', role: 'Responsável' };

  // Separate metrics into Checklist items, Quantity Counters, and Percentages/Measurements
  const activeTemplate = sectorTemplates[selectedSector] || [];
  const checklistItems = activeTemplate.filter((m) => m.type === 'checklist' || m.type === 'boolean');
  const counterItems = activeTemplate.filter((m) => m.type === 'counter');
  const measurementItems = activeTemplate.filter((m) => m.type === 'percentage' || m.type === 'number');

  // Copy monthly summary text for quick paste into institutional software/spreadsheets/WhatsApp
  const handleCopyMonthlySummary = () => {
    let text = `RELATÓRIO MENSAL CONSOLIDADO DE ATIVIDADES & ROTINAS - ${selectedMonth}\n`;
    text += `Gerado no Rotina Fácil em ${new Date().toLocaleDateString('pt-BR')}\n\n`;

    Object.values(monthlyData).forEach((sData) => {
      if (sData.totalCollections > 0) {
        text += `========================================\n`;
        text += `SETOR: ${sData.sector.toUpperCase()}\n`;
        text += `Responsável: ${sData.sectorLeader?.name || 'Não informado'} (${sData.sectorLeader?.role || ''})\n`;
        text += `Registros no Mês: ${sData.totalCollections} | Dias Registrados: ${sData.daysWithCollection.length}\n`;
        if (sData.allContributors.length > 0) {
          text += `Colaboradores que Contribuíram: ${sData.allContributors.join(', ')}\n`;
        }
        text += `----------------------------------------\n`;
        sData.metrics.forEach((m) => {
          const targetStr = m.target !== undefined ? ` [Meta: ${m.target} ${m.unit}]` : '';
          const compStr = m.complianceRate !== undefined ? ` (Conformidade: ${m.complianceRate}%)` : '';
          text += `• ${m.label}: Total = ${m.totalSum} ${m.unit} | Média = ${m.average} ${m.unit}${targetStr}${compStr}\n`;
        });
        text += `\n`;
      }
    });

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 3000);
  };

  // Download CSV
  const handleDownloadCsv = () => {
    const csvContent = generateMonthlyCsv(monthlyData, selectedMonth);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_mensal_${selectedMonth}_rotina_facil.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // History filtered list
  const filteredHistoryLogs = dailyLogs
    .filter((l) => (historySectorFilter === 'Todos' ? true : l.sector === historySectorFilter))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner & Multi-Sector Hub */}
      <div className="bg-linear-to-r from-teal-900 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-4xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Rotina dos Setores • Trabalho em Equipe</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Rotinas dos Setores, Listas e Fechamento do Mês
          </h1>

          <p className="text-sm sm:text-base text-teal-100/90 leading-relaxed">
            Cada setor possui um <strong>responsável</strong> que pode personalizar a lista de conferência ou a contagem de itens para o relatório do mês. <strong>Toda a equipe pode colaborar</strong> no registro das informações diárias.
          </p>
        </div>

        {/* Floating background stats */}
        <div className="mt-6 pt-6 border-t border-teal-700/50 flex flex-wrap items-center gap-4 sm:gap-8 text-xs text-teal-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              Hoje: <strong>{collectedCount} de {HOSPITAL_LOCATIONS.length} setores</strong> com informações registradas
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-300" />
            <span>Total de <strong>{dailyLogs.length} registros</strong> no histórico</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-300" />
            <span>Registro colaborativo pela equipe</span>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubTab('collector')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'collector'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Registro do Dia & Lista</span>
          </button>

          <button
            onClick={() => setActiveSubTab('monthly-feeder')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'monthly-feeder'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Relatório do Mês</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Histórico de Registros ({dailyLogs.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MODO COLETOR DIÁRIO & CHECKLIST */}
      {/* ========================================================================= */}
      {activeSubTab === 'collector' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Sector Round Status Checklist */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-700" />
                  <span>Setores do Hospital</span>
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {selectedDate.split('-').reverse().join('/')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Selecione o setor para preencher a rotina do dia ou turno:
              </p>

              <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
                {sectorsDailyStatus.map(({ sector, count, isCollected, hasDeviations }) => {
                  const isSelected = selectedSector === sector;
                  const leader = sectorLeaders[sector];
                  return (
                    <button
                      key={sector}
                      type="button"
                      onClick={() => setSelectedSector(sector)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'bg-teal-50 border-teal-500 text-teal-900 ring-2 ring-teal-500/20'
                          : isCollected
                          ? 'bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-slate-100'
                          : 'bg-white border-dashed border-slate-300 text-slate-500 hover:border-teal-300 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isCollected ? (
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                            hasDeviations ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                          </div>
                        )}
                        <div className="min-w-0 truncate">
                          <span className="block truncate">{sector}</span>
                          {leader?.name && (
                            <span className="text-[10px] text-slate-400 block truncate">
                              Resp: {leader.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {isCollected ? (
                          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
                            hasDeviations ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {count} {count === 1 ? 'coleta' : 'coletas'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Pendente</span>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sector Responsible Quick Card */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-teal-700" />
                  <span>Responsável do Setor</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsLeaderModalOpen(true)}
                  className="text-[11px] font-bold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer"
                >
                  Alterar
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-900">{activeSectorLeader.name}</div>
                <div className="text-slate-500 text-[11px]">{activeSectorLeader.role}</div>
                {activeSectorLeader.contact && (
                  <div className="text-slate-400 text-[10px]">{activeSectorLeader.contact}</div>
                )}
              </div>

              <p className="text-[11px] text-slate-500">
                O titular responde pelo setor, mas <strong>qualquer membro da equipe</strong> pode lançar e contribuir com os dados do dia.
              </p>
            </div>
          </div>

          {/* Right Column: Active Sector Quick Logging Form */}
          <div className="lg:col-span-8">
            <form
              onSubmit={handleSubmitDailyLog}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6"
            >
              {/* Header of the Form */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg bg-teal-100 text-teal-900 text-xs font-extrabold uppercase tracking-wide">
                      {selectedSector}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900">
                      Coleta & Checklist da Rotina
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Responsável Titular: <strong>{activeSectorLeader.name}</strong> • {activeTemplate.length} itens configurados
                  </p>
                </div>

                {/* Actions: Customize Checklist + Fill Conforming */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsCustomizerModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                    title="Personalizar checklist e indicadores deste setor"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Personalizar Checklist / Metas</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSetAllConforming}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Rotina realizada</span>
                  </button>
                </div>
              </div>

              {/* Context Selector: Date, Shift, Main Logger */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    Data da Coleta
                  </label>
                  <input
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Turno / Rotina
                  </label>
                  <select
                    value={selectedShift}
                    onChange={(e) => setSelectedShift(e.target.value as ShiftType)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    {SHIFT_OPTIONS.map((sh) => (
                      <option key={sh} value={sh}>
                        {sh}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      Lançado por (Você) *
                    </label>
                    {activeSectorLeader.name && (
                      <button
                        type="button"
                        onClick={() => setCollectorName(activeSectorLeader.name)}
                        className="text-[10px] text-teal-700 hover:underline font-semibold"
                      >
                        Usar {activeSectorLeader.name.split(' ')[0]}
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Seu nome / cargo"
                    value={collectorName}
                    onChange={(e) => setCollectorName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Multi-Contributor / Team Collaboration Box */}
              <div className="p-3.5 rounded-xl bg-teal-50/50 border border-teal-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-teal-700" />
                    <span>Outras Pessoas Contribuindo no Lançamento de Hoje:</span>
                  </span>
                  <span className="text-[11px] text-teal-800">
                    {contributors.length} colega(s) adicionado(s)
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {contributors.map((contrib) => (
                    <span
                      key={contrib}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-teal-300 text-teal-900 text-xs font-semibold shadow-2xs"
                    >
                      <span>{contrib}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveContributor(contrib)}
                        className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Remover"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  <div className="inline-flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Nome do colega que colaborou..."
                      value={newContributorInput}
                      onChange={(e) => setNewContributorInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddContributor();
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddContributor}
                      className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer"
                    >
                      + Adicionar
                    </button>
                  </div>
                </div>
              </div>

              {/* ========================================================== */}
              {/* SECTION A: CHECKLIST ITEMS (Conforme / Não Conforme) */}
              {/* ========================================================== */}
              {checklistItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Checklist de Verificação Operacional ({checklistItems.length})</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Toque para alternar Conforme / Não Conforme
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {checklistItems.map((def) => {
                      const isConforming = formMetrics[def.key] === true;
                      return (
                        <div
                          key={def.id}
                          onClick={() => handleToggleChecklistMetric(def.key)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isConforming
                              ? 'bg-emerald-50/60 border-emerald-300 hover:border-emerald-400'
                              : 'bg-rose-50/80 border-rose-300 ring-1 ring-rose-200'
                          }`}
                        >
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              {def.category}
                            </span>
                            <span className="text-xs font-bold text-slate-900 leading-tight block">
                              {def.label}
                            </span>
                            {def.helpText && (
                              <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                                {def.helpText}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0">
                            {isConforming ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-extrabold text-[11px] shadow-2xs">
                                <Check className="w-3.5 h-3.5" />
                                <span>Conforme</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 text-white font-extrabold text-[11px] shadow-2xs">
                                <X className="w-3.5 h-3.5" />
                                <span>Desvio / Pendente</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ========================================================== */}
              {/* SECTION B: QUANTITY COUNTERS (+ / -) */}
              {/* ========================================================== */}
              {counterItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                      <Hash className="w-4 h-4 text-blue-600" />
                      <span>Contadores de Quantidade & Produção ({counterItems.length})</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Incremento rápido (+1, +5, +10) ou digitação direta
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {counterItems.map((def) => {
                      const currentVal = typeof formMetrics[def.key] === 'number' ? (formMetrics[def.key] as number) : 0;
                      let isDeviating = false;
                      if (def.target !== undefined) {
                        if (def.targetType === 'max' && currentVal > def.target) isDeviating = true;
                        if (def.targetType === 'min' && currentVal < def.target) isDeviating = true;
                      }

                      return (
                        <div
                          key={def.id}
                          className={`p-3.5 rounded-xl border transition-all ${
                            isDeviating
                              ? 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-200'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">
                                {def.category}
                              </span>
                              <span className="text-xs font-bold text-slate-900 leading-snug">
                                {def.label}
                              </span>
                            </div>

                            {def.target !== undefined && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                                  isDeviating ? 'bg-rose-200 text-rose-900' : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                Meta: {def.targetType === 'max' ? '≤' : def.targetType === 'min' ? '≥' : '='}{' '}
                                {def.target} {def.unit}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs text-slate-500 font-medium">
                              {def.unit}
                            </span>

                            {/* Touch Counters */}
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleAdjustMetric(def.key, -1)}
                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm transition-colors active:scale-95 cursor-pointer"
                                title="-1"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>

                              <input
                                type="number"
                                min="0"
                                value={currentVal}
                                onChange={(e) => handleSetNumberMetric(def.key, Math.max(0, parseInt(e.target.value, 10) || 0))}
                                className="w-14 text-center font-extrabold text-base text-slate-900 py-0.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                              />

                              <button
                                type="button"
                                onClick={() => handleAdjustMetric(def.key, 1)}
                                className="w-8 h-8 rounded-lg bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center font-bold text-sm transition-colors active:scale-95 cursor-pointer shadow-xs"
                                title="+1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleAdjustMetric(def.key, 5)}
                                className="px-1.5 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-colors cursor-pointer"
                                title="+5"
                              >
                                +5
                              </button>
                            </div>
                          </div>

                          {def.helpText && (
                            <p className="text-[11px] text-slate-500 mt-1.5 italic border-t border-slate-100 pt-1">
                              {def.helpText}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ========================================================== */}
              {/* SECTION C: MEASUREMENTS & PERCENTAGES */}
              {/* ========================================================== */}
              {measurementItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-800 flex items-center gap-1.5">
                      <Gauge className="w-4 h-4 text-purple-600" />
                      <span>Medições & Porcentagens ({measurementItems.length})</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {measurementItems.map((def) => {
                      const currentVal = typeof formMetrics[def.key] === 'number' ? (formMetrics[def.key] as number) : 0;
                      let isDeviating = false;
                      if (def.target !== undefined) {
                        if (def.targetType === 'max' && currentVal > def.target) isDeviating = true;
                        if (def.targetType === 'min' && currentVal < def.target) isDeviating = true;
                      }

                      return (
                        <div
                          key={def.id}
                          className={`p-3.5 rounded-xl border transition-all ${
                            isDeviating
                              ? 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-200'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">
                                {def.category}
                              </span>
                              <span className="text-xs font-bold text-slate-900 leading-snug">
                                {def.label}
                              </span>
                            </div>

                            {def.target !== undefined && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                                  isDeviating ? 'bg-rose-200 text-rose-900' : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                Meta: {def.targetType === 'max' ? '≤' : def.targetType === 'min' ? '≥' : '='}{' '}
                                {def.target} {def.unit}
                              </span>
                            )}
                          </div>

                          {def.type === 'percentage' ? (
                            <div className="space-y-1.5 pt-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500 font-medium">{def.unit}</span>
                                <span className="font-extrabold text-slate-900 text-sm">{currentVal}%</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="5"
                                  value={currentVal}
                                  onChange={(e) => handleSetNumberMetric(def.key, parseInt(e.target.value, 10))}
                                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSetNumberMetric(def.key, 100)}
                                  className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[10px] font-bold rounded cursor-pointer shrink-0"
                                >
                                  100%
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-xs text-slate-500 font-medium">
                                {def.unit}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  step="0.1"
                                  value={currentVal}
                                  onChange={(e) => handleSetNumberMetric(def.key, parseFloat(e.target.value) || 0)}
                                  className="w-20 px-2 py-1 text-right rounded-lg border border-slate-300 font-bold text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                />
                                <span className="text-xs font-semibold text-slate-600">{def.unit}</span>
                              </div>
                            </div>
                          )}

                          {def.helpText && (
                            <p className="text-[11px] text-slate-500 mt-1.5 italic border-t border-slate-100 pt-1">
                              {def.helpText}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes / Observations of the Shift */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Observações do Setor / Ocorrências Relevantes (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: 1 atraso de sala devido a urgência; calibragem de aparelho de hematologia realizada pela manhã..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Submit CTA */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="text-xs text-slate-500">
                  {editingLogId ? (
                    <span className="text-amber-700 font-semibold">
                      ✏️ Editando lançamento gravado anteriormente
                    </span>
                  ) : (
                    <span>Novo registro do setor</span>
                  )}
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center gap-2"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>Salvar Lançamento Diário ({selectedSector})</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. FECHAMENTO & RELATÓRIOS MENSAIS */}
      {/* ========================================================================= */}
      {activeSubTab === 'monthly-feeder' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Mês de Referência
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Filtrar Setor
                </label>
                <select
                  value={selectedMonthlySector}
                  onChange={(e) => setSelectedMonthlySector(e.target.value as HospitalLocation | 'Todos')}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 font-semibold text-xs text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Todos">Todos os Setores do Hospital</option>
                  {HOSPITAL_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleCopyMonthlySummary}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Resumo Formatado</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
                title="Imprimir ou Salvar PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir / PDF</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCsv}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar Planilha (Excel CSV)</span>
              </button>
            </div>
          </div>

          {/* Explanation Banner */}
          <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 text-xs text-teal-950 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-700 shrink-0" />
              <span>
                <strong>Relatório Consolidado do Mês de {selectedMonth}:</strong> Soma acumulada de quantidades, médias diárias e % de conformidade dos checklists calculados automaticamente.
              </span>
            </div>
          </div>

          {/* Consolidated Tables by Sector */}
          <div className="space-y-6">
            {Object.values(monthlyData)
              .filter((sData) =>
                selectedMonthlySector === 'Todos' ? true : sData.sector === selectedMonthlySector
              )
              .map((sData) => {
                const hasLogs = sData.totalCollections > 0;
                const leader = sData.sectorLeader;
                return (
                  <div
                    key={sData.sector}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
                  >
                    {/* Header of the Sector Table */}
                    <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-teal-100 text-teal-800">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900">{sData.sector}</h3>
                            {leader?.name && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 font-bold">
                                Titular: {leader.name} ({leader.role})
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {sData.daysWithCollection.length} dia(s) com registro no mês • {sData.totalCollections} coletas realizadas
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {hasLogs ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                            {sData.totalCollections} Lançamentos Gravados
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-600 text-xs font-medium">
                            Sem registros neste mês
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Contributors of the Month */}
                    {hasLogs && (sData.allCollectors.length > 0 || sData.allContributors.length > 0) && (
                      <div className="px-4 py-2 bg-slate-50/50 border-b border-slate-100 text-xs text-slate-600 flex flex-wrap items-center gap-2">
                        <span className="font-bold flex items-center gap-1 text-slate-700">
                          <Users className="w-3.5 h-3.5 text-teal-600" />
                          <span>Pessoas que contribuíram com lançamentos no mês:</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {Array.from(new Set([...sData.allCollectors, ...sData.allContributors])).map((person) => (
                            <span
                              key={person}
                              className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 font-semibold text-[11px]"
                            >
                              {person}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Table of Metrics */}
                    {hasLogs ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100/60 text-slate-600 font-bold border-b border-slate-200">
                              <th className="py-2.5 px-4">Item / Indicador</th>
                              <th className="py-2.5 px-4">Tipo</th>
                              <th className="py-2.5 px-4">Categoria</th>
                              <th className="py-2.5 px-4">Meta</th>
                              <th className="py-2.5 px-4 text-right bg-teal-50/50 text-teal-900 font-extrabold">
                                Total Acumulado
                              </th>
                              <th className="py-2.5 px-4 text-right bg-teal-50/50 text-teal-900 font-extrabold">
                                Média Diária
                              </th>
                              <th className="py-2.5 px-4 text-center">Mínimo / Máximo</th>
                              <th className="py-2.5 px-4 text-center">Conformidade (%)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {sData.metrics.map((m) => {
                              const hasTarget = m.target !== undefined;
                              const isCheck = m.type === 'checklist' || m.type === 'boolean';
                              return (
                                <tr key={m.key} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="py-3 px-4 font-bold text-slate-900">
                                    {m.label}
                                  </td>
                                  <td className="py-3 px-4 text-slate-500">
                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-semibold text-slate-700">
                                      {isCheck ? 'Checklist' : m.type === 'counter' ? 'Contador (+/-)' : m.type === 'percentage' ? 'Adesão %' : 'Medição'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-slate-500">
                                    {m.category}
                                  </td>
                                  <td className="py-3 px-4 text-slate-600 font-semibold">
                                    {hasTarget ? `${m.target} ${m.unit}` : '—'}
                                  </td>
                                  <td className="py-3 px-4 text-right font-extrabold text-teal-950 bg-teal-50/30 text-sm">
                                    {isCheck ? `${m.totalSum} dias conforme` : `${m.totalSum} ${m.unit}`}
                                  </td>
                                  <td className="py-3 px-4 text-right font-bold text-slate-800 bg-teal-50/30">
                                    {isCheck ? `${m.average * 100}%` : `${m.average} ${m.unit}`}
                                  </td>
                                  <td className="py-3 px-4 text-center text-slate-500">
                                    {isCheck ? '—' : `${m.min} a ${m.max}`}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    {m.complianceRate !== undefined ? (
                                      <span
                                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                          m.complianceRate >= 95
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : m.complianceRate >= 80
                                            ? 'bg-amber-100 text-amber-800'
                                            : 'bg-rose-100 text-rose-800'
                                        }`}
                                      >
                                        {m.complianceRate}%
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-500">
                        Nenhuma coleta registrada para o setor {sData.sector} no mês {selectedMonth}.
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. HISTÓRICO & DIÁRIO DE BORDO */}
      {/* ========================================================================= */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Filtrar por Setor:</span>
              <select
                value={historySectorFilter}
                onChange={(e) => setHistorySectorFilter(e.target.value as HospitalLocation | 'Todos')}
                className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800"
              >
                <option value="Todos">Todos os Setores</option>
                {HOSPITAL_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Exibindo {filteredHistoryLogs.length} coletas registradas
            </span>
          </div>

          <div className="space-y-3">
            {filteredHistoryLogs.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                Nenhum registro encontrado para este filtro.
              </div>
            ) : (
              filteredHistoryLogs.map((log) => {
                const leader = sectorLeaders[log.sector];
                return (
                  <div
                    key={log.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 hover:border-teal-300 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-lg bg-teal-100 text-teal-800 text-xs font-extrabold">
                          {log.sector}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {log.date.split('-').reverse().join('/')} • {log.shift}
                        </span>
                        {leader?.name && (
                          <span className="text-[10px] text-slate-400">
                            (Titular: {leader.name})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <User className="w-3 h-3 text-teal-600" />
                          <span>Lançado por: <strong>{log.collectorName}</strong></span>
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDate(log.date);
                            setSelectedSector(log.sector);
                            setSelectedShift(log.shift);
                            setActiveSubTab('collector');
                          }}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold cursor-pointer"
                        >
                          Carregar no Formulário
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Deseja excluir este registro de coleta diária?')) {
                              onDeleteDailyLog(log.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Excluir Coleta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Contributors in this Log */}
                    {log.contributors && log.contributors.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-teal-900">
                        <Users className="w-3.5 h-3.5 text-teal-600" />
                        <span className="font-medium text-[11px]">Co-autores / Contribuidores:</span>
                        <div className="flex flex-wrap gap-1">
                          {log.contributors.map((c) => (
                            <span
                              key={c}
                              className="px-1.5 py-0.2 rounded bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-semibold"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Metric Pills */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {Object.entries(log.metrics).map(([k, val]) => {
                        const templateDef = (sectorTemplates[log.sector] || []).find((d) => d.key === k);
                        const label = templateDef ? templateDef.label : k;
                        const unit = templateDef ? templateDef.unit : '';
                        const isBoolean = typeof val === 'boolean';

                        return (
                          <div
                            key={k}
                            className={`px-2.5 py-1 rounded-lg border text-[11px] flex items-center gap-1.5 ${
                              isBoolean
                                ? val
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                                  : 'bg-rose-50 border-rose-200 text-rose-900 font-semibold'
                                : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                          >
                            <span className="text-slate-500 font-medium">{label}:</span>
                            <span className="font-extrabold">
                              {isBoolean ? (val ? '✓ Conforme' : '✗ Desvio') : `${val} ${unit}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {log.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50/60 p-2.5 rounded-lg italic">
                        <strong>Obs do Setor:</strong> {log.notes}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Sector Leader Edit Modal */}
      <SectorLeaderModal
        isOpen={isLeaderModalOpen}
        onClose={() => setIsLeaderModalOpen(false)}
        sector={selectedSector}
        sectorLeaders={sectorLeaders}
        onSaveLeaders={onUpdateSectorLeaders}
      />

      {/* Sector Checklist & Quantity Customizer Modal */}
      <SectorCustomizerModal
        isOpen={isCustomizerModalOpen}
        onClose={() => setIsCustomizerModalOpen(false)}
        sector={selectedSector}
        sectorTemplates={sectorTemplates}
        onUpdateTemplates={onUpdateTemplates}
      />
    </div>
  );
};
