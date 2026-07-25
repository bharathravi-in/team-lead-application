import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { Person, Feature } from '../types';
import toast from 'react-hot-toast';
import { 
  Users, Plus, Trash2, Edit2, Mail, Briefcase, 
  Layers, Search, CheckCircle2, X, UserPlus 
} from 'lucide-react';

const PeopleDirectoryPage = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [form, setForm] = useState({ name: '', role: '', email: '' });

  // For assigning to feature directly
  const [assignModalPerson, setAssignModalPerson] = useState<Person | null>(null);
  const [selectedFeatureId, setSelectedFeatureId] = useState('');

  const fetchPeople = useCallback(async () => {
    try {
      const res = await api.get('/people');
      setPeople(res.data);
    } catch {
      toast.error('Failed to load global team members');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFeatures = useCallback(async () => {
    try {
      const res = await api.get('/features');
      setFeatures(res.data);
    } catch {
      // quiet
    }
  }, []);

  useEffect(() => {
    fetchPeople();
    fetchFeatures();
  }, [fetchPeople, fetchFeatures]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      if (editingPerson) {
        await api.put(`/people/${editingPerson.id}`, form);
        toast.success('Team member updated');
      } else {
        await api.post('/people', form);
        toast.success('Team member added to global directory');
      }
      setShowModal(false);
      setEditingPerson(null);
      setForm({ name: '', role: '', email: '' });
      fetchPeople();
    } catch {
      toast.error('Failed to save team member');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this team member from the global directory?')) return;
    try {
      await api.delete(`/people/${id}`);
      toast.success('Team member removed');
      fetchPeople();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleAssignToFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalPerson || !selectedFeatureId) return;

    try {
      await api.post(`/features/${selectedFeatureId}/people`, {
        personIds: [assignModalPerson.id]
      });
      toast.success(`Assigned ${assignModalPerson.name} to feature!`);
      setAssignModalPerson(null);
      setSelectedFeatureId('');
      fetchPeople();
    } catch {
      toast.error('Failed to assign team member');
    }
  };

  const openEdit = (p: Person) => {
    setEditingPerson(p);
    setForm({ name: p.name, role: p.role || '', email: p.email || '' });
    setShowModal(true);
  };

  const filteredPeople = people.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.role && p.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-400" />
            Global Team Directory
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your engineering team members globally and assign them across features
          </p>
        </div>

        <button 
          onClick={() => {
            setEditingPerson(null);
            setForm({ name: '', role: '', email: '' });
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl text-sm transition-all duration-200 shadow-lg shadow-indigo-500/20 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Team Member
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          type="text"
          placeholder="Search team members by name, role, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-slate-200 text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
        />
      </div>

      {/* Team Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-slate-900/60 animate-pulse rounded-2xl border border-slate-800/60" />
          ))}
        </div>
      ) : filteredPeople.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl border border-slate-800/60 bg-slate-900/40">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-60" />
          <h3 className="text-lg font-semibold text-slate-300">No team members found</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
            {searchTerm ? 'No members match your search criteria.' : 'Create global team members so you can easily assign them to feature developments.'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 font-medium rounded-xl text-sm transition-all"
            >
              <UserPlus className="w-4 h-4" /> Add First Member
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPeople.map((person) => {
            const totalTasks = parseInt(person.total_tasks || '0');
            const completedTasks = parseInt(person.completed_tasks || '0');
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            const initials = person.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

            return (
              <div 
                key={person.id}
                className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-md text-base"
                        style={{ backgroundColor: person.avatar_color || '#6366f1' }}
                      >
                        {initials}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-100 text-base leading-tight">{person.name}</h3>
                        {person.role && (
                          <div className="flex items-center gap-1.5 text-xs text-indigo-400 mt-0.5 font-medium">
                            <Briefcase className="w-3.5 h-3.5" />
                            {person.role}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => openEdit(person)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit member"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(person.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Delete member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {person.email && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/80">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{person.email}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Features</span>
                      <span className="text-slate-200 font-semibold text-sm flex items-center gap-1.5 mt-0.5">
                        <Layers className="w-3.5 h-3.5 text-purple-400" />
                        {person.feature_count || 0} Assigned
                      </span>
                    </div>
                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Tasks</span>
                      <span className="text-slate-200 font-semibold text-sm flex items-center gap-1.5 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        {completedTasks}/{totalTasks} ({progress}%)
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setAssignModalPerson(person);
                    setSelectedFeatureId(features[0]?.id || '');
                  }}
                  className="mt-4 w-full py-2 px-3 bg-slate-800/80 hover:bg-indigo-600/20 hover:border-indigo-500/40 text-indigo-300 text-xs font-semibold rounded-xl border border-slate-700/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-indigo-400" /> Assign to Feature
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Member Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-100">
                {editingPerson ? 'Edit Team Member' : 'Add New Team Member'}
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
                  Full Name *
                </label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Role / Title
                </label>
                <input 
                  type="text"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Email Address
                </label>
                <input 
                  type="email"
                  placeholder="sarah@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
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
                  {editingPerson ? 'Save Changes' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign to Feature Quick Modal */}
      {assignModalPerson && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Assign to Feature</h3>
                <p className="text-xs text-indigo-400 font-medium">Assigning {assignModalPerson.name}</p>
              </div>
              <button 
                onClick={() => setAssignModalPerson(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {features.length === 0 ? (
              <p className="text-sm text-slate-400 py-4">No features available. Please create a feature first!</p>
            ) : (
              <form onSubmit={handleAssignToFeature} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Select Target Feature
                  </label>
                  <select
                    value={selectedFeatureId}
                    onChange={(e) => setSelectedFeatureId(e.target.value)}
                    className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                  >
                    {features.map(f => (
                      <option key={f.id} value={f.id}>{f.title} ({f.status})</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setAssignModalPerson(null)}
                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/25 transition-all"
                  >
                    Confirm Assignment
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PeopleDirectoryPage;
