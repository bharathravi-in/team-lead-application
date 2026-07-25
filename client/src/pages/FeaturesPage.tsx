import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { Feature, Person } from '../types';
import toast from 'react-hot-toast';
import { 
  Plus, Layers, Users, CheckSquare, Calendar, 
  MoreVertical, Trash2, Edit3, Filter, Clock,
  ArrowUpRight, AlertCircle, Search, X, Check
} from 'lucide-react';

const FeaturesPage = () => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [globalPeople, setGlobalPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    start_date: '',
    target_date: '',
    selectedPersonIds: [] as string[]
  });
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const navigate = useNavigate();

  const fetchFeatures = useCallback(async () => {
    try {
      const res = await api.get('/features');
      setFeatures(res.data);
    } catch {
      toast.error('Failed to load features');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGlobalPeople = useCallback(async () => {
    try {
      const res = await api.get('/people');
      setGlobalPeople(res.data);
    } catch {
      // quiet
    }
  }, []);

  useEffect(() => {
    fetchFeatures();
    fetchGlobalPeople();
  }, [fetchFeatures, fetchGlobalPeople]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    try {
      let createdOrUpdatedId = editingFeature?.id;

      if (editingFeature) {
        await api.put(`/features/${editingFeature.id}`, form);
        toast.success('Feature updated');
      } else {
        const res = await api.post('/features', form);
        createdOrUpdatedId = res.data.id;
        toast.success('Feature created');
      }

      // Assign selected global team members if any
      if (createdOrUpdatedId && form.selectedPersonIds.length > 0) {
        await api.post(`/features/${createdOrUpdatedId}/people`, {
          personIds: form.selectedPersonIds
        });
      }

      setShowModal(false);
      setEditingFeature(null);
      setForm({
        title: '', description: '', status: 'planning', priority: 'medium',
        start_date: '', target_date: '', selectedPersonIds: []
      });
      fetchFeatures();
    } catch {
      toast.error('Failed to save feature');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feature and its data?')) return;
    try {
      await api.delete(`/features/${id}`);
      toast.success('Feature deleted');
      fetchFeatures();
    } catch {
      toast.error('Failed to delete feature');
    }
  };

  const openEdit = async (f: Feature) => {
    setEditingFeature(f);
    // Fetch people assigned to this feature to pre-fill checkboxes
    let assignedIds: string[] = [];
    try {
      const res = await api.get(`/features/${f.id}/people`);
      assignedIds = res.data.map((p: Person) => p.id);
    } catch {
      // quiet
    }

    setForm({
      title: f.title,
      description: f.description || '',
      status: f.status,
      priority: f.priority,
      start_date: f.start_date ? f.start_date.split('T')[0] : '',
      target_date: f.target_date ? f.target_date.split('T')[0] : '',
      selectedPersonIds: assignedIds
    });
    setShowModal(true);
    setMenuOpenId(null);
  };

  const togglePersonSelection = (personId: string) => {
    setForm(prev => {
      const exists = prev.selectedPersonIds.includes(personId);
      if (exists) {
        return { ...prev, selectedPersonIds: prev.selectedPersonIds.filter(id => id !== personId) };
      } else {
        return { ...prev, selectedPersonIds: [...prev.selectedPersonIds, personId] };
      }
    });
  };

  const filteredFeatures = features.filter(f => {
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
    const matchesSearch = f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (f.description && f.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'in_progress':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'review':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'high':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      case 'medium':
        return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-indigo-400" />
            Feature Engineering Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track feature lifecycles, assign team members, and monitor daily progress
          </p>
        </div>

        <button
          onClick={() => {
            setEditingFeature(null);
            setForm({
              title: '', description: '', status: 'planning', priority: 'medium',
              start_date: '', target_date: '', selectedPersonIds: []
            });
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl text-sm transition-all duration-200 shadow-lg shadow-indigo-500/25 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New Feature
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-100">{features.length}</div>
            <div className="text-xs text-slate-400 font-medium">Total Features</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-100">
              {features.filter(f => f.status === 'in_progress').length}
            </div>
            <div className="text-xs text-slate-400 font-medium">Active In-Progress</div>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-100">
              {features.filter(f => f.status === 'completed').length}
            </div>
            <div className="text-xs text-slate-400 font-medium">Features Shipped</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search features..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-slate-200 text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-500 mr-1" />
          {['all', 'planning', 'in_progress', 'review', 'completed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                statusFilter === st 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                  : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-slate-900/60 animate-pulse rounded-2xl border border-slate-800" />
          ))}
        </div>
      ) : filteredFeatures.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-slate-800/60 bg-slate-900/40">
          <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-60" />
          <h3 className="text-lg font-semibold text-slate-300">No features found</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
            {searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Get started by creating your first feature.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredFeatures.map((f) => {
            const totalTasks = parseInt(f.total_tasks || '0');
            const completedTasks = parseInt(f.completed_tasks || '0');
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return (
              <div 
                key={f.id}
                onClick={() => navigate(`/features/${f.id}`)}
                className="glass-panel glass-panel-hover rounded-2xl p-6 border border-slate-800 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-bold text-slate-100 text-lg group-hover:text-indigo-300 transition-colors flex items-center gap-2">
                        {f.title}
                        <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all opacity-0 group-hover:opacity-100" />
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${getStatusBadge(f.status)}`}>
                          {f.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${getPriorityBadge(f.priority)}`}>
                          {f.priority}
                        </span>
                      </div>
                    </div>

                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === f.id ? null : f.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {menuOpenId === f.id && (
                        <div 
                          className="absolute right-0 top-8 bg-slate-900 border border-slate-800 rounded-xl p-1.5 shadow-xl z-20 w-36 space-y-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => openEdit(f)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition-colors font-medium"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-indigo-400" /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(f.id)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors font-medium"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {f.description && (
                    <p className="text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed">
                      {f.description}
                    </p>
                  )}
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-purple-400" /> {f.people_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> {completedTasks}/{totalTasks}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" /> {f.total_actual_hours || 0}h / {f.total_estimated_hours || 0}h
                      </span>
                    </div>
                    {f.target_date && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-sky-400" /> {new Date(f.target_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 text-right font-medium">
                      {progress}% complete
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Feature Creation / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-100">
                {editingFeature ? 'Edit Feature' : 'Create New Feature'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Feature Title *
                </label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. OAuth2 & SSO Integration"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Description
                </label>
                <textarea 
                  placeholder="What is the scope of this feature?"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="glass-input w-full px-3 py-2 rounded-xl text-sm"
                  >
                    <option value="planning">Planning</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="glass-input w-full px-3 py-2 rounded-xl text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Assign Global Team Members Checklist */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Assign Team Members (Global Directory)
                </label>
                {globalPeople.length === 0 ? (
                  <div className="text-xs text-slate-500 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    No global team members found. You can add people in the "Team Directory" tab anytime!
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-1.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                    {globalPeople.map((person) => {
                      const isSelected = form.selectedPersonIds.includes(person.id);
                      return (
                        <div
                          key={person.id}
                          onClick={() => togglePersonSelection(person.id)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                            isSelected ? 'bg-indigo-600/20 border border-indigo-500/40 text-slate-100' : 'hover:bg-slate-800/60 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div 
                              className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs"
                              style={{ backgroundColor: person.avatar_color }}
                            >
                              {person.name[0]}
                            </div>
                            <div>
                              <div className="text-xs font-semibold">{person.name}</div>
                              {person.role && <div className="text-[10px] text-slate-400">{person.role}</div>}
                            </div>
                          </div>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isSelected ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700'
                          }`}>
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/25 transition-all"
                >
                  {editingFeature ? 'Update Feature' : 'Create Feature'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeaturesPage;
