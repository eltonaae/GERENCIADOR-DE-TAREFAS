import React from 'react';
import { ViewTab } from '../types';
import {
  ShieldCheck,
  PlusCircle,
  LayoutDashboard,
  AlertCircle,
  CalendarCheck,
  ClipboardCheck,
} from 'lucide-react';

interface HeaderProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  pendingCount: number;
  overdueCount: number;
  tasksCount?: number;
  tasksOverdueCount?: number;
  dailyLogsTodayCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  pendingCount,
  overdueCount,
  tasksCount = 0,
  tasksOverdueCount = 0,
  dailyLogsTodayCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">Rotina Fácil</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  Hospitalar
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Rotinas, tarefas e informações em um só lugar
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              id="nav-dashboard-btn"
              onClick={() => onSelectTab('dashboard')}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'dashboard'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-slate-500" />
              <span>Início</span>
            </button>

            {/* Rotina Diária */}
            <button
              id="nav-daily-collector-btn"
              onClick={() => onSelectTab('daily-collector')}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                currentTab === 'daily-collector'
                  ? 'bg-teal-700 text-white font-semibold shadow-xs'
                  : 'text-teal-900 bg-teal-50/70 hover:bg-teal-100/80 border border-teal-200'
              }`}
            >
              <ClipboardCheck className={`w-4 h-4 ${currentTab === 'daily-collector' ? 'text-white' : 'text-teal-700'}`} />
              <span className="font-bold">Rotina Diária</span>
              {dailyLogsTodayCount > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    currentTab === 'daily-collector'
                      ? 'bg-teal-900 text-teal-100'
                      : 'bg-teal-200 text-teal-900'
                  }`}
                  title="Rotinas registradas hoje"
                >
                  {dailyLogsTodayCount}
                </span>
              )}
            </button>

            <button
              id="nav-tasks-btn"
              onClick={() => onSelectTab('tasks')}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                currentTab === 'tasks'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <CalendarCheck className={`w-4 h-4 ${currentTab === 'tasks' ? 'text-white' : 'text-slate-600'}`} />
              <span>Tarefas</span>
              {tasksCount > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    currentTab === 'tasks'
                      ? 'bg-slate-800 text-white'
                      : tasksOverdueCount > 0
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tasksCount}
                </span>
              )}
            </button>

            <button
              id="nav-pendencies-btn"
              onClick={() => onSelectTab('pendencies')}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                currentTab === 'pendencies'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <AlertCircle className="w-4 h-4 text-slate-500" />
              <span>Registros</span>
              {pendingCount > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    overdueCount > 0
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              id="nav-register-btn"
              onClick={() => onSelectTab('register')}
              className={`hidden sm:flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'register'
                  ? 'bg-teal-50 text-teal-800 font-semibold border border-teal-300'
                  : 'text-teal-700 hover:text-teal-900 hover:bg-teal-50'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-teal-600" />
              <span>+ Fazer registro</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

