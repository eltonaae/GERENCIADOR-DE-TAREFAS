import React, { useState } from 'react';
import {
  DailyMetricDefinition,
  HospitalLocation,
  DEFAULT_SECTOR_TEMPLATES,
  HOSPITAL_LOCATIONS,
} from '../types';
import {
  SlidersHorizontal,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Hash,
  Percent,
  Gauge,
  HelpCircle,
  Check,
  X,
  Building2,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from 'lucide-react';

interface SectorCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sector: HospitalLocation;
  sectorTemplates: Record<HospitalLocation, DailyMetricDefinition[]>;
  onUpdateTemplates: (templates: Record<HospitalLocation, DailyMetricDefinition[]>) => void;
}

export const SectorCustomizerModal: React.FC<SectorCustomizerModalProps> = ({
  isOpen,
  onClose,
  sector,
  sectorTemplates,
  onUpdateTemplates,
}) => {
  const [activeSector, setActiveSector] = useState<HospitalLocation>(sector);
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');

  // Form State for New Item
  const [itemLabel, setItemLabel] = useState('');
  const [itemCategory, setItemCategory] = useState('Rotina & Verificação');
  const [itemType, setItemType] = useState<'checklist' | 'counter' | 'percentage' | 'number'>('counter');
  const [itemUnit, setItemUnit] = useState('unidades');
  const [itemDefault, setItemDefault] = useState('0');
  const [hasTarget, setHasTarget] = useState(false);
  const [itemTarget, setItemTarget] = useState('0');
  const [itemTargetType, setItemTargetType] = useState<'max' | 'min' | 'exact'>('max');
  const [itemHelp, setItemHelp] = useState('');

  if (!isOpen) return null;

  const currentMetrics = sectorTemplates[activeSector] || [];

  // Add new item
  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemLabel.trim()) return;

    const key =
      itemLabel
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '_') +
      '_' +
      Date.now().toString().slice(-4);

    let defaultVal: number | boolean = 0;
    if (itemType === 'checklist') {
      defaultVal = true;
    } else if (itemType === 'percentage') {
      defaultVal = parseFloat(itemDefault) || 100;
    } else {
      defaultVal = parseFloat(itemDefault) || 0;
    }

    const newDef: DailyMetricDefinition = {
      id: `metric-${Date.now()}`,
      key,
      label: itemLabel.trim(),
      category: itemCategory.trim() || 'Rotina & Indicadores',
      unit: itemType === 'checklist' ? 'conforme' : itemType === 'percentage' ? '%' : itemUnit.trim() || 'unidades',
      type: itemType,
      defaultValue: defaultVal,
      target: hasTarget && itemTarget ? parseFloat(itemTarget) : undefined,
      targetType: hasTarget ? itemTargetType : undefined,
      helpText: itemHelp.trim() || undefined,
      isStandard: false,
    };

    const updated = {
      ...sectorTemplates,
      [activeSector]: [...currentMetrics, newDef],
    };

    onUpdateTemplates(updated);
    // Reset form
    setItemLabel('');
    setItemHelp('');
    setItemDefault('0');
    setHasTarget(false);
    setActiveTab('list');
  };

  // Delete item
  const handleDeleteItem = (id: string) => {
    if (window.confirm('Deseja remover este item do checklist/indicadores do setor?')) {
      const updated = {
        ...sectorTemplates,
        [activeSector]: currentMetrics.filter((m) => m.id !== id),
      };
      onUpdateTemplates(updated);
    }
  };

  // Move item up or down
  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentMetrics.length) return;

    const newList = [...currentMetrics];
    const [moved] = newList.splice(index, 1);
    newList.splice(targetIndex, 0, moved);

    onUpdateTemplates({
      ...sectorTemplates,
      [activeSector]: newList,
    });
  };

  // Restore default templates for active sector
  const handleRestoreDefaults = () => {
    if (
      window.confirm(
        `Deseja restaurar os indicadores e checklists padrão institucionais para o setor ${activeSector}?`
      )
    ) {
      const defaults = DEFAULT_SECTOR_TEMPLATES[activeSector] || [];
      onUpdateTemplates({
        ...sectorTemplates,
        [activeSector]: defaults,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-700">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Personalizar Checklists & Indicadores
              </h3>
              <p className="text-xs text-slate-500">
                Ajuste os itens de verificação e contadores de quantidade para a rotina diária
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sector Picker Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700">Setor:</span>
            <select
              value={activeSector}
              onChange={(e) => setActiveSector(e.target.value as HospitalLocation)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 font-bold text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {HOSPITAL_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc} ({sectorTemplates[loc]?.length || 0} itens)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-teal-700 text-white'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Itens Ativos ({currentMetrics.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('add')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                activeTab === 'add'
                  ? 'bg-teal-700 text-white'
                  : 'bg-white text-teal-700 border border-teal-300 hover:bg-teal-50'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Adicionar Item</span>
            </button>
          </div>
        </div>

        {/* TAB 1: LIST OF ACTIVE METRICS */}
        {activeTab === 'list' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Organize ou exclua os itens coletados diariamente em <strong>{activeSector}</strong>:</span>
              <button
                type="button"
                onClick={handleRestoreDefaults}
                className="text-slate-500 hover:text-rose-600 flex items-center gap-1 font-semibold hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restaurar Padrão Institucional</span>
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {currentMetrics.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  Nenhum item configurado para este setor. Clique em "+ Adicionar Item" acima.
                </div>
              ) : (
                currentMetrics.map((metric, idx) => {
                  const isChecklist = metric.type === 'checklist' || metric.type === 'boolean';
                  const isCounter = metric.type === 'counter';
                  const isPercentage = metric.type === 'percentage';

                  return (
                    <div
                      key={metric.id}
                      className="p-3 rounded-2xl border border-slate-200 bg-white hover:border-teal-300 transition-all flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Type Icon Badge */}
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isChecklist
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isCounter
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : isPercentage
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                          title={
                            isChecklist
                              ? 'Checklist de Verificação (Conforme/Não Conforme)'
                              : isCounter
                              ? 'Contador de Quantidade (+ / -)'
                              : isPercentage
                              ? 'Porcentagem (%)'
                              : 'Medição Contínua'
                          }
                        >
                          {isChecklist ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : isCounter ? (
                            <Hash className="w-4 h-4" />
                          ) : isPercentage ? (
                            <Percent className="w-4 h-4" />
                          ) : (
                            <Gauge className="w-4 h-4" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {metric.category}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                              {isChecklist
                                ? 'Checklist'
                                : isCounter
                                ? 'Contador (+ / -)'
                                : isPercentage
                                ? 'Adesão %'
                                : 'Medição'}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-slate-900 block truncate">
                            {metric.label}
                          </span>
                          {metric.target !== undefined && (
                            <span className="text-[10px] text-teal-800 font-semibold">
                              Meta: {metric.targetType === 'max' ? '≤' : metric.targetType === 'min' ? '≥' : '='}{' '}
                              {metric.target} {metric.unit}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions: Reorder & Delete */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveItem(idx, 'up')}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                          title="Mover para Cima"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === currentMetrics.length - 1}
                          onClick={() => handleMoveItem(idx, 'down')}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                          title="Mover para Baixo"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteItem(metric.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1 cursor-pointer"
                          title="Excluir Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ADD NEW ITEM FORM */}
        {activeTab === 'add' && (
          <form onSubmit={handleAddNewItem} className="space-y-4 text-xs">
            {/* Step 1: Type Selection with Cards */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Escolha o Tipo de Registro:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setItemType('counter');
                    setItemUnit('ocorrências / un');
                  }}
                  className={`p-2.5 rounded-2xl border text-left flex flex-col items-center text-center gap-1 transition-all cursor-pointer ${
                    itemType === 'counter'
                      ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-400/20 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Hash className="w-5 h-5 text-blue-600" />
                  <span className="text-xs font-bold">Contador de Quantidade</span>
                  <span className="text-[10px] text-slate-500">Botões + / - e soma</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setItemType('checklist');
                    setItemUnit('conforme');
                  }}
                  className={`p-2.5 rounded-2xl border text-left flex flex-col items-center text-center gap-1 transition-all cursor-pointer ${
                    itemType === 'checklist'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-400/20 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-bold">Checklist Diário</span>
                  <span className="text-[10px] text-slate-500">Conforme / Não Conforme</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setItemType('percentage');
                    setItemUnit('% adesão');
                  }}
                  className={`p-2.5 rounded-2xl border text-left flex flex-col items-center text-center gap-1 transition-all cursor-pointer ${
                    itemType === 'percentage'
                      ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-400/20 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Percent className="w-5 h-5 text-amber-600" />
                  <span className="text-xs font-bold">Porcentagem</span>
                  <span className="text-[10px] text-slate-500">0% a 100% adesão</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setItemType('number');
                    setItemUnit('minutos / °C');
                  }}
                  className={`p-2.5 rounded-2xl border text-left flex flex-col items-center text-center gap-1 transition-all cursor-pointer ${
                    itemType === 'number'
                      ? 'bg-purple-50 border-purple-500 text-purple-900 ring-2 ring-purple-400/20 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Gauge className="w-5 h-5 text-purple-600" />
                  <span className="text-xs font-bold">Medição Direta</span>
                  <span className="text-[10px] text-slate-500">Tempo, temperatura, etc.</span>
                </button>
              </div>
            </div>

            {/* Item Title */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nome do Item / Indicador *
              </label>
              <input
                type="text"
                required
                placeholder={
                  itemType === 'checklist'
                    ? 'Ex: Checagem do Kit de Emergência / Carro de Parada'
                    : itemType === 'counter'
                    ? 'Ex: Total de Exames / Altas / Prescrições do Dia'
                    : itemType === 'percentage'
                    ? 'Ex: Adesão à Checagem de Identificação do Paciente'
                    : 'Ex: Tempo Médio de Espera para Atendimento'
                }
                value={itemLabel}
                onChange={(e) => setItemLabel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Categoria</label>
                <input
                  type="text"
                  placeholder="Ex: Rotina, Segurança, Atendimento, Produção"
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Unidade de Medida</label>
                <input
                  type="text"
                  placeholder="Ex: ocorrências, guias, exames, %, minutos, °C"
                  value={itemUnit}
                  onChange={(e) => setItemUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Target Settings */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasTarget}
                    onChange={(e) => setHasTarget(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Definir Meta Institucional para este indicador</span>
                </label>
              </div>

              {hasTarget && (
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Regra da Meta
                    </label>
                    <select
                      value={itemTargetType}
                      onChange={(e) => setItemTargetType(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
                    >
                      <option value="max">Quanto menor melhor (≤ Meta)</option>
                      <option value="min">Quanto maior melhor (≥ Meta)</option>
                      <option value="exact">Valor exato (= Meta)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Valor da Meta
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 0 ou 95 ou 10"
                      value={itemTarget}
                      onChange={(e) => setItemTarget(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Help / Guidance Text */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>Instrução de Coleta para a Equipe (Opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Checar na troca de plantão e anotar antes das 19h..."
                value={itemHelp}
                onChange={(e) => setItemHelp(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
              >
                Voltar à Lista
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar ao Setor {activeSector}</span>
              </button>
            </div>
          </form>
        )}

        {/* Modal Footer */}
        <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>As personalizações são salvas instantaneamente para o setor.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl cursor-pointer"
          >
            Concluir & Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
