import React, { useState } from 'react';
import {
  HospitalLocation,
  IssueNature,
  ImpactType,
  IssuePriority,
  Issue,
  HOSPITAL_LOCATIONS,
  ISSUE_NATURES,
  IMPACT_TYPES,
  PRIORITIES,
} from '../types';
import {
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building2,
  UserCheck,
  ClipboardList,
  Sparkles,
  ArrowRight,
  Plus,
} from 'lucide-react';

interface RegisterIssueViewProps {
  onAddIssue: (issue: Omit<Issue, 'id' | 'code' | 'createdAt'>) => Issue;
  onNavigateToPendencies: () => void;
  onRegisterAnother: () => void;
}

export const RegisterIssueView: React.FC<RegisterIssueViewProps> = ({
  onAddIssue,
  onNavigateToPendencies,
}) => {
  // Form State
  const [problem, setProblem] = useState('');
  const [location, setLocation] = useState<HospitalLocation>('Enfermagem & Posto');
  const [customLocation, setCustomLocation] = useState('');
  const [involvedSectors, setInvolvedSectors] = useState<HospitalLocation[]>(['Enfermagem & Posto']);
  const [nature, setNature] = useState<IssueNature[]>(['Processo']);
  const [hasImpact, setHasImpact] = useState<boolean>(false);
  const [impactTypes, setImpactTypes] = useState<ImpactType[]>([]);
  const [priority, setPriority] = useState<IssuePriority>('Média');
  const [responsible, setResponsible] = useState('');
  const [deadline, setDeadline] = useState('');
  const [actionNeeded, setActionNeeded] = useState('');

  // Validation & Feedback State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedIssue, setSubmittedIssue] = useState<Issue | null>(null);

  const toggleInvolvedSector = (sec: HospitalLocation) => {
    setInvolvedSectors((prev) =>
      prev.includes(sec) ? prev.filter((s) => s !== sec) : [...prev, sec]
    );
  };

  // Helper for quick date presets (+3, +7, +15, +30 days)
  const setQuickDeadline = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setDeadline(`${yyyy}-${mm}-${dd}`);
    if (errors.deadline) {
      setErrors((prev) => ({ ...prev, deadline: '' }));
    }
  };

  // Toggle multi-select Nature
  const toggleNature = (item: IssueNature) => {
    setNature((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
    if (errors.nature) {
      setErrors((prev) => ({ ...prev, nature: '' }));
    }
  };

  // Toggle multi-select Impact
  const toggleImpact = (item: ImpactType) => {
    setImpactTypes((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
    if (errors.impactTypes) {
      setErrors((prev) => ({ ...prev, impactTypes: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!problem.trim()) {
      newErrors.problem = 'Por favor, descreva qual é o problema ocorrido.';
    }

    if (location === 'Outro' && !customLocation.trim()) {
      newErrors.customLocation = 'Especifique o local onde ocorreu.';
    }

    if (nature.length === 0) {
      newErrors.nature = 'Selecione ao menos uma natureza do problema.';
    }

    if (hasImpact && impactTypes.length === 0) {
      newErrors.impactTypes = 'Selecione quem ou o que foi impactado.';
    }

    if (!responsible.trim()) {
      newErrors.responsible = 'Informe o nome ou cargo do responsável pela tratativa.';
    }

    if (!deadline) {
      newErrors.deadline = 'Defina uma data limite (prazo) para resolução.';
    }

    if (!actionNeeded.trim()) {
      newErrors.actionNeeded = 'Descreva a ação recomendada ou o que precisa ser feito.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      // Scroll to first error
      const firstError = document.querySelector('.form-error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const created = onAddIssue({
      problem: problem.trim(),
      location,
      customLocation: location === 'Outro' ? customLocation.trim() : undefined,
      involvedSectors: involvedSectors.length > 0 ? involvedSectors : [location],
      nature,
      hasImpact,
      impactTypes: hasImpact ? impactTypes : [],
      priority,
      responsible: responsible.trim(),
      deadline,
      actionNeeded: actionNeeded.trim(),
      status: 'Aberto',
    });

    setSubmittedIssue(created);
  };

  const handleResetForm = () => {
    setProblem('');
    setLocation('Enfermagem');
    setCustomLocation('');
    setInvolvedSectors(['Enfermagem']);
    setNature(['Processo']);
    setHasImpact(false);
    setImpactTypes([]);
    setPriority('Média');
    setResponsible('');
    setDeadline('');
    setActionNeeded('');
    setErrors({});
    setSubmittedIssue(null);
  };

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* Confirmation Card after successful submission */}
      {submittedIssue ? (
        <div className="bg-white rounded-2xl border border-emerald-200 p-8 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
              Registro Concluído
            </span>
            <h2 className="text-2xl font-bold text-slate-900">
              Ocorrência registrada com sucesso!
            </h2>
            <p className="text-slate-600 max-w-md mx-auto text-sm">
              O registro foi gravado com o código{' '}
              <strong className="text-teal-700 font-bold">{submittedIssue.code}</strong> e já está disponível no acompanhamento para os setores envolvidos.
            </p>
          </div>

          {/* Quick Summary of Created Record */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left max-w-xl mx-auto space-y-2 text-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">Código / Setor:</span>
              <span className="font-bold text-slate-900">
                {submittedIssue.code} • {submittedIssue.location}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">Prioridade:</span>
              <span className="font-semibold text-slate-900">{submittedIssue.priority}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">Responsável:</span>
              <span className="font-semibold text-slate-900">{submittedIssue.responsible}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">Prazo de Resolução:</span>
              <span className="font-bold text-teal-800">{submittedIssue.deadline}</span>
            </div>
            <div className="pt-1">
              <span className="text-slate-500 font-medium block mb-1">Problema:</span>
              <p className="text-slate-800 font-normal italic bg-white p-2.5 rounded border border-slate-200">
                "{submittedIssue.problem}"
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              id="success-go-pendencies-btn"
              onClick={onNavigateToPendencies}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <span>Ver no Acompanhamento</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              id="success-register-another-btn"
              onClick={handleResetForm}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo registro</span>
            </button>
          </div>
        </div>
      ) : (
        /* Form Card */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Form Header */}
          <div className="p-6 sm:p-8 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200">
                Rotina Fácil • Registro
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Registrar Ocorrência ou Desvio
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Preencha os campos abaixo para registrar a situação e organizar a ação necessária.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
            {/* 1. Qual é o problema? */}
            <div className="space-y-2">
              <label htmlFor="problem-desc" className="block text-sm font-bold text-slate-900">
                1. Qual é o problema? <span className="text-rose-500">*</span>
              </label>
              <p className="text-xs text-slate-500">
                Descreva claramente o fato observado, desvio de protocolo ou falha no processo.
              </p>
              <textarea
                id="problem-desc"
                rows={3}
                value={problem}
                onChange={(e) => {
                  setProblem(e.target.value);
                  if (errors.problem) setErrors((prev) => ({ ...prev, problem: '' }));
                }}
                placeholder="Ex: Falha na identificação da amostra laboratorial coletada no posto de enfermagem..."
                className={`w-full px-4 py-3 rounded-xl border text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 transition-all text-sm ${
                  errors.problem
                    ? 'border-rose-400 bg-rose-50/20 form-error'
                    : 'border-slate-300 bg-white hover:border-slate-400'
                }`}
              />
              {errors.problem && (
                <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.problem}
                </p>
              )}
            </div>

            {/* 2. Onde ocorreu? */}
            <div className="space-y-2">
              <label htmlFor="location-select" className="block text-sm font-bold text-slate-900">
                2. Onde ocorreu? <span className="text-rose-500">*</span>
              </label>
              <p className="text-xs text-slate-500">
                Selecione o setor ou unidade hospitalar onde a ocorrência foi identificada.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {HOSPITAL_LOCATIONS.map((loc) => (
                  <button
                    type="button"
                    key={loc}
                    onClick={() => setLocation(loc)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                      location === loc
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 opacity-70" />
                    <span>{loc}</span>
                  </button>
                ))}
              </div>

              {location === 'Outro' && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={customLocation}
                    onChange={(e) => {
                      setCustomLocation(e.target.value);
                      if (errors.customLocation) setErrors((prev) => ({ ...prev, customLocation: '' }));
                    }}
                    placeholder="Especifique o setor (ex: Almoxarifado, Hemodinâmica, etc.)"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                  {errors.customLocation && (
                    <p className="text-xs text-rose-600 font-medium mt-1">
                      {errors.customLocation}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Setores Envolvidos na Tratativa */}
            <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-slate-900">
                  Setores envolvidos na tratativa / Ações
                </label>
                <span className="text-xs text-slate-500 font-medium">
                  {involvedSectors.length} selecionado(s)
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Selecione todos os setores que devem participar do plano de ação ou execução das tarefas:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {HOSPITAL_LOCATIONS.map((loc) => {
                  const isSelected = involvedSectors.includes(loc);
                  return (
                    <button
                      type="button"
                      key={loc}
                      onClick={() => toggleInvolvedSector(loc)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span>{isSelected ? '✓' : '+'}</span>
                      <span>{loc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Qual foi a natureza do problema? */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-900">
                3. Qual foi a natureza do problema? <span className="text-rose-500">*</span>
              </label>
              <p className="text-xs text-slate-500">
                Selecione todas as categorias aplicáveis (múltipla escolha).
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {ISSUE_NATURES.map((nat) => {
                  const isSelected = nature.includes(nat);
                  return (
                    <button
                      type="button"
                      key={nat}
                      onClick={() => toggleNature(nat)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span>{isSelected ? '✓' : '+'}</span>
                      <span>{nat}</span>
                    </button>
                  );
                })}
              </div>
              {errors.nature && (
                <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.nature}
                </p>
              )}
            </div>

            {/* 4. Houve impacto? */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-sm font-bold text-slate-900">
                4. Houve impacto? <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setHasImpact(true)}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                    hasImpact
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHasImpact(false);
                    setImpactTypes([]);
                  }}
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                    !hasImpact
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Não
                </button>
              </div>

              {/* Impact sub-options if Sim */}
              {hasImpact && (
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Qual foi o impacto? (Selecione uma ou mais opções)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {IMPACT_TYPES.map((imp) => {
                      const isSelected = impactTypes.includes(imp);
                      return (
                        <button
                          type="button"
                          key={imp}
                          onClick={() => toggleImpact(imp)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-rose-100 text-rose-800 border-rose-300 ring-2 ring-rose-200'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {isSelected ? '✓ ' : ''}{imp}
                        </button>
                      );
                    })}
                  </div>
                  {errors.impactTypes && (
                    <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.impactTypes}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 5. Prioridade */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-900">
                5. Prioridade <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PRIORITIES.map((p) => {
                  let activeClass = '';
                  if (priority === p) {
                    if (p === 'Crítica') activeClass = 'bg-rose-600 text-white border-rose-600 shadow-xs';
                    else if (p === 'Alta') activeClass = 'bg-orange-600 text-white border-orange-600 shadow-xs';
                    else if (p === 'Média') activeClass = 'bg-amber-500 text-white border-amber-500 shadow-xs';
                    else activeClass = 'bg-slate-700 text-white border-slate-700 shadow-xs';
                  } else {
                    activeClass = 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50';
                  }

                  return (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold border transition-all text-center cursor-pointer ${activeClass}`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Two Column Row: 6. Responsável & 7. Prazo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* 6. Responsável */}
              <div className="space-y-2">
                <label htmlFor="resp-input" className="block text-sm font-bold text-slate-900">
                  6. Responsável <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <input
                    id="resp-input"
                    type="text"
                    value={responsible}
                    onChange={(e) => {
                      setResponsible(e.target.value);
                      if (errors.responsible) setErrors((prev) => ({ ...prev, responsible: '' }));
                    }}
                    placeholder="Ex: Dra. Marina Santos / Farmacêutica"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 ${
                      errors.responsible
                        ? 'border-rose-400 bg-rose-50/20 form-error'
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                  />
                </div>
                {errors.responsible && (
                  <p className="text-xs text-rose-600 font-medium">
                    {errors.responsible}
                  </p>
                )}
              </div>

              {/* 7. Prazo */}
              <div className="space-y-2">
                <label htmlFor="deadline-input" className="block text-sm font-bold text-slate-900">
                  7. Prazo <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    id="deadline-input"
                    type="date"
                    value={deadline}
                    onChange={(e) => {
                      setDeadline(e.target.value);
                      if (errors.deadline) setErrors((prev) => ({ ...prev, deadline: '' }));
                    }}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 ${
                      errors.deadline
                        ? 'border-rose-400 bg-rose-50/20 form-error'
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                  />
                </div>
                {/* Quick Date Presets */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-xs text-slate-400">Atalhos:</span>
                  <button
                    type="button"
                    onClick={() => setQuickDeadline(3)}
                    className="px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                  >
                    +3 dias
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDeadline(7)}
                    className="px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                  >
                    +7 dias
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDeadline(15)}
                    className="px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                  >
                    +15 dias
                  </button>
                </div>
                {errors.deadline && (
                  <p className="text-xs text-rose-600 font-medium">
                    {errors.deadline}
                  </p>
                )}
              </div>
            </div>

            {/* 8. O que precisa ser feito? */}
            <div className="space-y-2">
              <label htmlFor="action-input" className="block text-sm font-bold text-slate-900">
                8. O que precisa ser feito? <span className="text-rose-500">*</span>
              </label>
              <p className="text-xs text-slate-500">
                Indique a ação imediata, contenção ou plano preventivo necessário para resolução.
              </p>
              <textarea
                id="action-input"
                rows={3}
                value={actionNeeded}
                onChange={(e) => {
                  setActionNeeded(e.target.value);
                  if (errors.actionNeeded) setErrors((prev) => ({ ...prev, actionNeeded: '' }));
                }}
                placeholder="Ex: Realizar recalibração do sensor de temperatura e treinar a equipe do plantão noturno..."
                className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 ${
                  errors.actionNeeded
                    ? 'border-rose-400 bg-rose-50/20 form-error'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              />
              {errors.actionNeeded && (
                <p className="text-xs text-rose-600 font-medium">
                  {errors.actionNeeded}
                </p>
              )}
            </div>

            {/* Form Submit Button */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-500">
                * Todos os campos são necessários para o bom andamento do processo.
              </span>

              <button
                id="submit-register-btn"
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-base shadow-sm transition-all hover:shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <ClipboardList className="w-5 h-5" />
                <span>Salvar registro</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
