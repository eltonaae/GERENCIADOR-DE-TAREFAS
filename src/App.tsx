import React, { useState, useEffect } from 'react';
import {
  Issue,
  QualityTask,
  DailyLogEntry,
  DailyMetricDefinition,
  HospitalLocation,
  SectorLeaderInfo,
  ViewTab,
  IssueStatus,
  getEffectiveStatus,
  getEffectiveTaskStatus,
} from './types';
import {
  getStoredIssues,
  saveStoredIssues,
  generateNextCode,
  INITIAL_DEMO_ISSUES,
  getStoredTasks,
  saveStoredTasks,
  INITIAL_DEMO_TASKS,
  getStoredDailyLogs,
  saveStoredDailyLogs,
  getStoredCustomTemplates,
  saveStoredCustomTemplates,
  getStoredSectorLeaders,
  saveStoredSectorLeaders,
} from './storage';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { RegisterIssueView } from './components/RegisterIssueView';
import { PendenciesView } from './components/PendenciesView';
import { TasksView } from './components/TasksView';
import { DailyCollectorView } from './components/DailyCollectorView';
import { IssueDetailModal } from './components/IssueDetailModal';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [issues, setIssues] = useState<Issue[]>(() => getStoredIssues());
  const [tasks, setTasks] = useState<QualityTask[]>(() => getStoredTasks());
  const [dailyLogs, setDailyLogs] = useState<DailyLogEntry[]>(() => getStoredDailyLogs());
  const [sectorTemplates, setSectorTemplates] = useState<Record<HospitalLocation, DailyMetricDefinition[]>>(() =>
    getStoredCustomTemplates()
  );
  const [sectorLeaders, setSectorLeaders] = useState<Record<HospitalLocation, SectorLeaderInfo>>(() =>
    getStoredSectorLeaders()
  );

  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [priorityFilter, setPriorityFilter] = useState<string>('Todas');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync issues to localStorage
  useEffect(() => {
    saveStoredIssues(issues);
  }, [issues]);

  // Sync tasks to localStorage
  useEffect(() => {
    saveStoredTasks(tasks);
  }, [tasks]);

  // Sync daily logs to localStorage
  useEffect(() => {
    saveStoredDailyLogs(dailyLogs);
  }, [dailyLogs]);

  // Sync custom templates to localStorage
  useEffect(() => {
    saveStoredCustomTemplates(sectorTemplates);
  }, [sectorTemplates]);

  // Sync sector leaders to localStorage
  useEffect(() => {
    saveStoredSectorLeaders(sectorLeaders);
  }, [sectorLeaders]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Add new issue
  const handleAddIssue = (newIssueData: Omit<Issue, 'id' | 'code' | 'createdAt'>): Issue => {
    const nextCode = generateNextCode(issues);
    const newIssue: Issue = {
      ...newIssueData,
      id: `issue-${Date.now()}`,
      code: nextCode,
      createdAt: new Date().toISOString(),
    };

    const updated = [newIssue, ...issues];
    setIssues(updated);
    showToast(`Problema ${nextCode} registrado com sucesso.`);
    return newIssue;
  };

  // Update status (Aberto, Em andamento, Resolvido)
  const handleUpdateStatus = (id: string, newStatus: IssueStatus) => {
    setIssues((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const isNowResolved = newStatus === 'Resolvido';
          return {
            ...item,
            status: newStatus,
            resolvedAt: isNowResolved ? new Date().toISOString() : undefined,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );

    // Also update modal selection if open
    if (selectedIssue && selectedIssue.id === id) {
      setSelectedIssue((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              resolvedAt: newStatus === 'Resolvido' ? new Date().toISOString() : undefined,
            }
          : null
      );
    }

    showToast(`Status atualizado para: ${newStatus}`);
  };

  // Delete issue
  const handleDeleteIssue = (id: string) => {
    setIssues((prev) => prev.filter((i) => i.id !== id));
    showToast('Registro de não conformidade excluído.');
  };

  // TASK MANAGEMENT HANDLERS
  const handleAddTask = (taskData: Omit<QualityTask, 'id' | 'createdAt'>) => {
    const newTask: QualityTask = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    showToast(`Tarefa "${newTask.title}" adicionada com sucesso.`);
  };

  const handleUpdateTask = (taskData: QualityTask) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskData.id ? { ...taskData, updatedAt: new Date().toISOString() } : t))
    );
    showToast(`Tarefa atualizada com sucesso.`);
  };

  const handleToggleTaskStatus = (task: QualityTask) => {
    const newStatus = task.status === 'Concluída' ? 'Pendente' : 'Concluída';
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: newStatus,
              completedAt: newStatus === 'Concluída' ? new Date().toISOString() : undefined,
            }
          : t
      )
    );
    showToast(
      newStatus === 'Concluída'
        ? `Tarefa "${task.title}" marcada como Concluída!`
        : `Tarefa reaberta como Pendente.`
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    showToast('Tarefa excluída.');
  };

  const handleToggleChecklistItem = (taskId: string, itemId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId && t.checklist) {
          const updatedChecklist = t.checklist.map((item) =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          );
          // If all items completed, mark task as Concluída
          const allCompleted = updatedChecklist.every((c) => c.completed);
          return {
            ...t,
            checklist: updatedChecklist,
            status: allCompleted ? 'Concluída' : t.status,
            completedAt: allCompleted ? new Date().toISOString() : t.completedAt,
          };
        }
        return t;
      })
    );
  };

  // DAILY COLLECTOR HANDLERS
  const handleSaveDailyLog = (newLogData: Omit<DailyLogEntry, 'id' | 'createdAt'> & { id?: string }) => {
    const logId = newLogData.id || `dlog-${Date.now()}`;
    const newLog: DailyLogEntry = {
      ...newLogData,
      id: logId,
      createdAt: new Date().toISOString(),
    };
    setDailyLogs((prev) => {
      const filtered = prev.filter((l) => l.id !== logId);
      return [newLog, ...filtered];
    });
    showToast(`Coleta de ${newLog.sector} (${newLog.shift}) salva com sucesso!`);
  };

  const handleDeleteDailyLog = (logId: string) => {
    setDailyLogs((prev) => prev.filter((l) => l.id !== logId));
    showToast('Coleta diária excluída.');
  };

  const handleUpdateSectorTemplates = (templates: Record<HospitalLocation, DailyMetricDefinition[]>) => {
    setSectorTemplates(templates);
    showToast('Checklist e indicadores atualizados.');
  };

  const handleUpdateSectorLeaders = (leaders: Record<HospitalLocation, SectorLeaderInfo>) => {
    setSectorLeaders(leaders);
    showToast('Responsáveis dos setores atualizados.');
  };

  // Reset to initial demo data
  const handleResetData = () => {
    if (window.confirm('Deseja restaurar os registros e tarefas de demonstração iniciais?')) {
      setIssues(INITIAL_DEMO_ISSUES);
      setTasks(INITIAL_DEMO_TASKS);
      showToast('Dados de demonstração restaurados.');
    }
  };

  // Quick navigate from dashboard metrics with preset filters
  const handleFilterPendenciesFromDashboard = (
    statusPref?: string,
    priorityPref?: string
  ) => {
    if (statusPref) setStatusFilter(statusPref);
    else setStatusFilter('Todos');

    if (priorityPref) setPriorityFilter(priorityPref);
    else setPriorityFilter('Todas');

    setCurrentTab('pendencies');
  };

  // Count non-resolved and overdue items for navigation badges
  const pendingCount = issues.filter((i) => i.status !== 'Resolvido').length;
  const overdueCount = issues.filter(
    (i) => i.status !== 'Resolvido' && getEffectiveStatus(i) === 'Atrasado'
  ).length;

  const pendingTasksCount = tasks.filter((t) => t.status !== 'Concluída').length;
  const overdueTasksCount = tasks.filter(
    (t) => t.status !== 'Concluída' && getEffectiveTaskStatus(t) === 'Atrasada'
  ).length;

  const todayStr = new Date().toISOString().slice(0, 10);
  const dailyLogsTodayCount = dailyLogs.filter((l) => l.date === todayStr).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-sm animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Top Navigation Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        pendingCount={pendingCount}
        overdueCount={overdueCount}
        tasksCount={pendingTasksCount}
        tasksOverdueCount={overdueTasksCount}
        dailyLogsTodayCount={dailyLogsTodayCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {currentTab === 'dashboard' && (
          <DashboardView
            issues={issues}
            tasks={tasks}
            dailyLogs={dailyLogs}
            onNavigate={setCurrentTab}
            onFilterPendencies={handleFilterPendenciesFromDashboard}
            onResetData={handleResetData}
          />
        )}

        {currentTab === 'daily-collector' && (
          <DailyCollectorView
            dailyLogs={dailyLogs}
            sectorTemplates={sectorTemplates}
            sectorLeaders={sectorLeaders}
            onSaveDailyLog={handleSaveDailyLog}
            onDeleteDailyLog={handleDeleteDailyLog}
            onUpdateTemplates={handleUpdateSectorTemplates}
            onUpdateSectorLeaders={handleUpdateSectorLeaders}
          />
        )}

        {currentTab === 'tasks' && (
          <TasksView
            tasks={tasks}
            issues={issues}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onToggleTaskStatus={handleToggleTaskStatus}
            onDeleteTask={handleDeleteTask}
            onToggleChecklistItem={handleToggleChecklistItem}
            onNavigateToIssue={(issue) => {
              setSelectedIssue(issue);
            }}
          />
        )}

        {currentTab === 'register' && (
          <RegisterIssueView
            onAddIssue={handleAddIssue}
            onNavigateToPendencies={() => {
              setStatusFilter('Todos');
              setPriorityFilter('Todas');
              setCurrentTab('pendencies');
            }}
            onRegisterAnother={() => setCurrentTab('register')}
          />
        )}

        {currentTab === 'pendencies' && (
          <PendenciesView
            issues={issues}
            onUpdateStatus={handleUpdateStatus}
            onSelectIssue={setSelectedIssue}
            onNavigateToRegister={() => setCurrentTab('register')}
            initialStatusFilter={statusFilter}
            initialPriorityFilter={priorityFilter}
          />
        )}
      </main>

      {/* Detail & Action Modal */}
      <IssueDetailModal
        issue={selectedIssue}
        tasks={tasks}
        onClose={() => setSelectedIssue(null)}
        onUpdateStatus={handleUpdateStatus}
        onDelete={handleDeleteIssue}
        onAddTaskForIssue={handleAddTask}
        onToggleTaskStatus={handleToggleTaskStatus}
        onOpenTasksTab={() => setCurrentTab('tasks')}
      />

      {/* App Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Rotina Fácil</span>
            <span>•</span>
            <span>Rotinas, tarefas e informações em um só lugar</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <span>Apoio à Rotina dos Setores</span>
            <span>Registros & Relatório do Mês</span>
            <span>Armazenamento Local</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

