import React, { useState } from 'react';
import { HospitalLocation, SectorLeaderInfo, HOSPITAL_LOCATIONS } from '../types';
import { UserCheck, Building2, Phone, Briefcase, Check, X, Shield } from 'lucide-react';

interface SectorLeaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  sector: HospitalLocation;
  sectorLeaders: Record<HospitalLocation, SectorLeaderInfo>;
  onSaveLeaders: (leaders: Record<HospitalLocation, SectorLeaderInfo>) => void;
}

export const SectorLeaderModal: React.FC<SectorLeaderModalProps> = ({
  isOpen,
  onClose,
  sector,
  sectorLeaders,
  onSaveLeaders,
}) => {
  const currentLeader = sectorLeaders[sector] || { name: '', role: '', contact: '' };

  const [activeSector, setActiveSector] = useState<HospitalLocation>(sector);
  const [name, setName] = useState(currentLeader.name || '');
  const [role, setRole] = useState(currentLeader.role || '');
  const [contact, setContact] = useState(currentLeader.contact || '');
  const [viewAll, setViewAll] = useState(false);

  // When active sector changes, sync local state
  const handleSelectSector = (sec: HospitalLocation) => {
    setActiveSector(sec);
    const leader = sectorLeaders[sec] || { name: '', role: '', contact: '' };
    setName(leader.name || '');
    setRole(leader.role || '');
    setContact(leader.contact || '');
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updated = {
      ...sectorLeaders,
      [activeSector]: {
        name: name.trim(),
        role: role.trim() || 'Responsável do Setor',
        contact: contact.trim() || undefined,
      },
    };

    onSaveLeaders(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-700">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Responsável pelo Setor
              </h3>
              <p className="text-xs text-slate-500">
                Pessoa titular pela gestão, conferência e rotina de dados
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

        {/* Sector Selector Tabs */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Setor Hospitalar:</span>
            </label>
            <button
              type="button"
              onClick={() => setViewAll(!viewAll)}
              className="text-[11px] font-bold text-teal-700 hover:underline"
            >
              {viewAll ? 'Ocultar outros setores' : 'Ver todos os setores'}
            </button>
          </div>

          <select
            value={activeSector}
            onChange={(e) => handleSelectSector(e.target.value as HospitalLocation)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-xs text-slate-900 bg-slate-50 focus:ring-2 focus:ring-teal-500 focus:outline-none"
          >
            {HOSPITAL_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc} {sectorLeaders[loc]?.name ? `(${sectorLeaders[loc].name})` : ''}
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nome do Responsável Titular *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Dra. Marina Santos, Camila Duarte, Enf. Roberto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span>Cargo / Função</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Supervisora, Farmacêutica RT"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Ramal / Contato</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Ramal 204 / Coren 123"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200 text-teal-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Shield className="w-3.5 h-3.5 text-teal-700" />
              <span>Colaboração & Coleta de Dados</span>
            </div>
            <p className="text-[11px] text-teal-800 leading-relaxed">
              O responsável titular lidera a gestão dos indicadores do setor. No dia a dia, <strong>qualquer membro da equipe</strong> pode realizar os lançamentos diários e adicionar colegas como contribuidores do turno.
            </p>
          </div>

          {/* Quick List of All Leaders if Expanded */}
          {viewAll && (
            <div className="space-y-2 border-t border-slate-200 pt-3 max-h-48 overflow-y-auto pr-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Responsáveis atuais de cada setor:
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {HOSPITAL_LOCATIONS.map((loc) => {
                  const l = sectorLeaders[loc];
                  return (
                    <div
                      key={loc}
                      onClick={() => handleSelectSector(loc)}
                      className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                        activeSector === loc
                          ? 'bg-teal-50 border-teal-400 text-teal-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{loc}</span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {l?.name || 'Não definido'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Responsável</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
