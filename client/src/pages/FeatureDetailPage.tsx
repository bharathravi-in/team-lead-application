import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import type { Feature, Person } from '../types';
import toast from 'react-hot-toast';
import PeopleTab from '../components/PeopleTab';
import StandupsTab from '../components/StandupsTab';
import RetroTab from '../components/RetroTab';
import ChecklistPanel from '../components/ChecklistPanel';
import { 
  ArrowLeft, Users, MessageSquare, 
  CheckSquare, Sparkles, Calendar, Clock, AlertCircle,
  ChevronRight, ChevronLeft
} from 'lucide-react';

const TABS: Array<{ id: 'people' | 'standups' | 'checklists' | 'retro'; label: string; icon: any }> = [
  { id: 'people', label: 'Team Members', icon: Users },
  { id: 'standups', label: 'Daily Standups', icon: MessageSquare },
  { id: 'checklists', label: 'Person Checklists', icon: CheckSquare },
  { id: 'retro', label: 'Retrospective', icon: Sparkles },
];

const FeatureDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [feature, setFeature] = useState<Feature | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [activeTab, setActiveTab] = useState<'people' | 'standups' | 'checklists' | 'retro'>('people');
  const [loading, setLoading] = useState(true);

  const fetchFeature = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get(`/features/${id}`);
      setFeature(res.data);
    } catch {
      toast.error('Failed to load feature details');
    }
  }, [id]);

  const fetchPeople = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get(`/features/${id}/people`);
      setPeople(res.data);
    } catch {
      toast.error('Failed to load assigned team members');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchFeature();
    fetchPeople();
  }, [fetchFeature, fetchPeople]);

  // Tab navigation helpers
  const currentTabIndex = TABS.findIndex(t => t.id === activeTab);
  const prevTab = currentTabIndex > 0 ? TABS[currentTabIndex - 1] : null;
  const nextTab = currentTabIndex < TABS.length - 1 ? TABS[currentTabIndex + 1] : null;

  // Keyboard shortcut listener (Alt + RightArrow / Alt + LeftArrow)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'ArrowRight' && nextTab) {
        setActiveTab(nextTab.id);
        toast(`Switched to ${nextTab.label}`, { icon: '➡️' });
      } else if (e.altKey && e.key === 'ArrowLeft' && prevTab) {
        setActiveTab(prevTab.id);
        toast(`Switched to ${prevTab.label}`, { icon: '⬅️' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextTab, prevTab]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-900 rounded-xl" />
        <div className="h-40 bg-slate-900 rounded-2xl" />
        <div className="h-64 bg-slate-900 rounded-2xl" />
      </div>
    );
  }

  if (!feature) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-300">Feature not found</h2>
        <Link to="/features" className="mt-4 inline-block text-indigo-400 font-semibold text-sm hover:underline">
          Back to Features
        </Link>
      </div>
    );
  }

  const totalTasks = parseInt(feature.total_tasks || '0');
  const completedTasks = parseInt(feature.completed_tasks || '0');
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Days remaining calculation
  let daysRemainingText = null;
  if (feature.target_date) {
    const target = new Date(feature.target_date);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      daysRemainingText = `⏳ ${diffDays} days remaining`;
    } else if (diffDays === 0) {
      daysRemainingText = `🎯 Target is Today!`;
    } else {
      daysRemainingText = `⚠️ ${Math.abs(diffDays)} days overdue`;
    }
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link 
          to="/features" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-indigo-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Features
        </Link>

        <span className="text-[11px] text-slate-500 font-medium hidden sm:inline-block">
          💡 Shortcut: <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400">Alt + ← / →</kbd> to switch tabs
        </span>
      </div>

      {/* Feature Header Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">{feature.title}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {feature.status.replace('_', ' ')}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
                {feature.priority}
              </span>
              {daysRemainingText && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {daysRemainingText}
                </span>
              )}
            </div>

            {feature.description && (
              <p className="text-slate-400 text-sm mt-2 max-w-3xl leading-relaxed">
                {feature.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 min-w-52">
            <div className="flex-1">
              <div className="text-xs text-slate-400 font-medium">Overall Progress</div>
              <div className="text-xl font-extrabold text-slate-100 mt-0.5">{progressPercent}%</div>
              <div className="h-2 w-full bg-slate-900 rounded-full mt-1 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Feature dates, team count & total time metrics */}
        <div className="flex items-center gap-6 pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex-wrap">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-purple-400" /> {people.length} Team Members
          </span>
          <span className="flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> {completedTasks}/{totalTasks} Tasks Done
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-300">
            <Clock className="w-3.5 h-3.5 text-indigo-400" /> 
            Time Spent: <span className="text-emerald-400">{feature.total_actual_hours || 0}h</span> / <span className="text-indigo-400">{feature.total_estimated_hours || 0}h estimated</span>
          </span>
          {feature.target_date && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-400" /> Target: {new Date(feature.target_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className="w-4 h-4" /> 
                {tab.label} {tab.id === 'people' ? `(${people.length})` : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'people' && (
        <PeopleTab 
          featureId={feature.id} 
          people={people} 
          onPeopleChange={() => { fetchPeople(); fetchFeature(); }} 
        />
      )}

      {activeTab === 'standups' && (
        <StandupsTab 
          featureId={feature.id} 
          featureTitle={feature.title} 
          people={people} 
        />
      )}

      {activeTab === 'checklists' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-400" />
              Checklists by Team Member
            </h3>
          </div>

          {people.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800">
              <p className="text-slate-400 text-sm">No team members assigned to this feature yet.</p>
              <button 
                onClick={() => setActiveTab('people')} 
                className="mt-3 text-xs font-semibold text-indigo-400 hover:underline"
              >
                Go to Team Members tab to assign people
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {people.map((person) => (
                <ChecklistPanel
                  key={person.id}
                  featureId={feature.id}
                  personId={person.id}
                  personName={person.name}
                  avatarColor={person.avatar_color}
                  onTasksChange={fetchFeature}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'retro' && (
        <RetroTab 
          featureId={feature.id} 
          featureTitle={feature.title} 
        />
      )}

      {/* User-Friendly Tab Stepper Footer (Next / Previous Workflow) */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
        <div>
          {prevTab ? (
            <button
              onClick={() => setActiveTab(prevTab.id)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-800 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Previous: {prevTab.label}
            </button>
          ) : <div />}
        </div>

        <div>
          {nextTab ? (
            <button
              onClick={() => setActiveTab(nextTab.id)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              Next: {nextTab.label} <ChevronRight className="w-4 h-4" />
            </button>
          ) : <div />}
        </div>
      </div>
    </div>
  );
};

export default FeatureDetailPage;
