import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { Feature } from '../types';
import toast from 'react-hot-toast';
import { 
  Compass, Calendar, Clock, Users, CheckSquare, 
  AlertCircle, ChevronRight, Plus, Sparkles, Filter 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PlanningPage = () => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchFeatures = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/features');
      setFeatures(res.data);
    } catch {
      toast.error('Failed to load features for planning');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const updateFeatureStatus = async (featureId: string, newStatus: Feature['status']) => {
    try {
      await api.put(`/features/${featureId}`, { status: newStatus });
      toast.success(`Feature moved to ${newStatus.replace('_', ' ')}`);
      fetchFeatures();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const planningFeatures = features.filter(f => f.status === 'planning');
  const inProgressFeatures = features.filter(f => f.status === 'in_progress');
  const reviewFeatures = features.filter(f => f.status === 'review');
  const completedFeatures = features.filter(f => f.status === 'completed');

  const totalEstHours = features.reduce((sum, f) => sum + (parseFloat(String(f.total_estimated_hours || 0))), 0);
  const totalActHours = features.reduce((sum, f) => sum + (parseFloat(String(f.total_actual_hours || 0))), 0);

  const columns = [
    { id: 'planning', label: 'Planning', color: 'border-amber-500/40 text-amber-400 bg-amber-500/10', items: planningFeatures },
    { id: 'in_progress', label: 'In Progress', color: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10', items: inProgressFeatures },
    { id: 'review', label: 'Code Review', color: 'border-purple-500/40 text-purple-400 bg-purple-500/10', items: reviewFeatures },
    { id: 'completed', label: 'Completed', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10', items: completedFeatures },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2.5">
            <Compass className="w-7 h-7 text-indigo-400" />
            Sprint & Feature Planning Roadmap
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Visual milestone tracking, workload capacity estimation, and stage stage progression.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="glass-panel px-4 py-2 rounded-xl border border-slate-800 flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Est Backlog</span>
              <span className="font-extrabold text-indigo-400 text-sm">{totalEstHours} hrs</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Spent to Date</span>
              <span className="font-extrabold text-emerald-400 text-sm">{totalActHours} hrs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Planning Kanban Columns */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-80 bg-slate-900/60 animate-pulse rounded-2xl border border-slate-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {columns.map(col => (
            <div key={col.id} className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 flex flex-col h-full min-h-[500px]">
              {/* Column Header */}
              <div className={`flex items-center justify-between p-2.5 rounded-xl border font-bold text-xs ${col.color}`}>
                <span>{col.label}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-950/60 text-[11px]">
                  {col.items.length}
                </span>
              </div>

              {/* Column Feature Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {col.items.length === 0 ? (
                  <p className="text-xs text-slate-600 italic text-center py-8">No features in {col.label.toLowerCase()}</p>
                ) : (
                  col.items.map(f => {
                    const est = parseFloat(String(f.total_estimated_hours || 0));
                    const act = parseFloat(String(f.total_actual_hours || 0));
                    const totalT = parseInt(f.total_tasks || '0');
                    const compT = parseInt(f.completed_tasks || '0');
                    const pct = totalT > 0 ? Math.round((compT / totalT) * 100) : 0;

                    return (
                      <div 
                        key={f.id} 
                        className="p-3.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl space-y-3 transition-all shadow-md group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Link 
                            to={`/features/${f.id}`}
                            className="font-bold text-slate-200 hover:text-indigo-400 text-xs transition-colors line-clamp-2"
                          >
                            {f.title}
                          </Link>

                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            f.priority === 'critical' ? 'bg-rose-500/20 text-rose-400' :
                            f.priority === 'high' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {f.priority}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Tasks: {compT}/{totalT}</span>
                            <span className="font-semibold">{pct}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400" 
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        {/* Hours summary */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                          <span className="flex items-center gap-1 font-semibold text-slate-300">
                            <Clock className="w-3 h-3 text-indigo-400" /> {act}h / {est}h
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-purple-400" /> {f.people_count}
                          </span>
                        </div>

                        {/* Quick Move Select */}
                        <div className="pt-2 flex items-center justify-between gap-2">
                          <select
                            value={f.status}
                            onChange={(e) => updateFeatureStatus(f.id, e.target.value as Feature['status'])}
                            className="bg-slate-900 text-slate-300 border border-slate-800 rounded-lg px-2 py-1 text-[11px] outline-none cursor-pointer w-full"
                          >
                            <option value="planning">Status: Planning</option>
                            <option value="in_progress">Status: In Progress</option>
                            <option value="review">Status: Code Review</option>
                            <option value="completed">Status: Completed</option>
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlanningPage;
