import { useState, useEffect, useCallback } from 'react';
import type { Person } from '../types';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Users, UserPlus, Trash2, Mail, Briefcase, 
  CheckCircle2, Plus, X, Check 
} from 'lucide-react';

interface PeopleTabProps {
  featureId: string;
  people: Person[];
  onPeopleChange: () => void;
}

const PeopleTab = ({ featureId, people, onPeopleChange }: PeopleTabProps) => {
  const [globalPeople, setGlobalPeople] = useState<Person[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'select' | 'create'>('select');
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);
  const [newPersonForm, setNewPersonForm] = useState({ name: '', role: '', email: '' });

  const fetchGlobalPeople = useCallback(async () => {
    try {
      const res = await api.get('/people');
      setGlobalPeople(res.data);
    } catch {
      // quiet
    }
  }, []);

  useEffect(() => {
    fetchGlobalPeople();
  }, [fetchGlobalPeople]);

  const assignedIds = people.map(p => p.id);

  const handleAssignSelected = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPersonIds.length === 0) return;

    try {
      await api.post(`/features/${featureId}/people`, {
        personIds: selectedPersonIds
      });
      toast.success('Assigned team members to feature');
      setShowModal(false);
      setSelectedPersonIds([]);
      onPeopleChange();
    } catch {
      toast.error('Failed to assign team members');
    }
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonForm.name.trim()) return;

    try {
      await api.post(`/features/${featureId}/people`, newPersonForm);
      toast.success('Created and assigned team member');
      setShowModal(false);
      setNewPersonForm({ name: '', role: '', email: '' });
      onPeopleChange();
      fetchGlobalPeople();
    } catch {
      toast.error('Failed to create team member');
    }
  };

  const handleUnassign = async (personId: string) => {
    if (!confirm('Unassign this team member from feature?')) return;
    try {
      await api.delete(`/features/${featureId}/people/${personId}`);
      toast.success('Team member unassigned');
      onPeopleChange();
    } catch {
      toast.error('Failed to unassign team member');
    }
  };

  const toggleSelectPerson = (id: string) => {
    setSelectedPersonIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Assigned Team Members ({people.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Team members assigned to work on this feature and complete individual task checklists
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-indigo-500/20 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Add / Assign People
        </button>
      </div>

      {people.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl border border-slate-800 bg-slate-900/40">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-60" />
          <p className="text-slate-300 font-semibold text-sm">No team members assigned yet</p>
          <p className="text-slate-500 text-xs mt-1">Assign existing global team members or create new ones to start creating checklists.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" /> Assign Members Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {people.map((person) => {
            const totalTasks = parseInt(person.total_tasks || '0');
            const completedTasks = parseInt(person.completed_tasks || '0');
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            const initials = person.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

            return (
              <div key={person.id} className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-md"
                        style={{ backgroundColor: person.avatar_color || '#6366f1' }}
                      >
                        {initials}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-200 text-sm">{person.name}</h4>
                        {person.role && (
                          <div className="flex items-center gap-1 text-[11px] text-indigo-400 font-medium">
                            <Briefcase className="w-3 h-3" /> {person.role}
                          </div>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={() => handleUnassign(person.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Unassign member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {person.email && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-3 pt-2.5 border-t border-slate-800/60">
                      <Mail className="w-3 h-3 text-slate-500" />
                      <span className="truncate">{person.email}</span>
                    </div>
                  )}

                  <div className="mt-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Tasks Progress
                    </span>
                    <span className="font-semibold text-slate-200">{completedTasks}/{totalTasks} ({progress}%)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Assign People Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">Add Team Members to Feature</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab switch */}
            <div className="grid grid-cols-2 p-1 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab('select')}
                className={`py-1.5 rounded-lg transition-all ${
                  activeTab === 'select' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Global Directory
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`py-1.5 rounded-lg transition-all ${
                  activeTab === 'create' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Create New Member
              </button>
            </div>

            {activeTab === 'select' ? (
              <form onSubmit={handleAssignSelected} className="space-y-4">
                <div className="max-h-60 overflow-y-auto space-y-1.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  {globalPeople.length === 0 ? (
                    <p className="text-xs text-slate-400 p-2 text-center">No global team members available.</p>
                  ) : (
                    globalPeople.map((gp) => {
                      const isAlreadyAssigned = assignedIds.includes(gp.id);
                      const isSelected = selectedPersonIds.includes(gp.id);

                      return (
                        <div
                          key={gp.id}
                          onClick={() => !isAlreadyAssigned && toggleSelectPerson(gp.id)}
                          className={`flex items-center justify-between p-2.5 rounded-xl transition-all ${
                            isAlreadyAssigned 
                              ? 'opacity-50 bg-slate-900 border border-slate-800/40 cursor-not-allowed' 
                              : isSelected 
                                ? 'bg-indigo-600/20 border border-indigo-500/40 text-slate-100 cursor-pointer' 
                                : 'hover:bg-slate-800/60 text-slate-300 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs"
                              style={{ backgroundColor: gp.avatar_color }}
                            >
                              {gp.name[0]}
                            </div>
                            <div>
                              <div className="text-xs font-semibold">{gp.name}</div>
                              <div className="text-[10px] text-slate-400">{gp.role || 'Team Member'}</div>
                            </div>
                          </div>

                          {isAlreadyAssigned ? (
                            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">Assigned</span>
                          ) : (
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                              isSelected ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-700'
                            }`}>
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={selectedPersonIds.length === 0}
                    className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl shadow-md"
                  >
                    Assign Selected ({selectedPersonIds.length})
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreateNew} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full name"
                    value={newPersonForm.name}
                    onChange={(e) => setNewPersonForm({ ...newPersonForm, name: e.target.value })}
                    className="glass-input w-full px-3 py-2 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Backend Dev"
                    value={newPersonForm.role}
                    onChange={(e) => setNewPersonForm({ ...newPersonForm, role: e.target.value })}
                    className="glass-input w-full px-3 py-2 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="email@company.com"
                    value={newPersonForm.email}
                    onChange={(e) => setNewPersonForm({ ...newPersonForm, email: e.target.value })}
                    className="glass-input w-full px-3 py-2 rounded-xl text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md"
                  >
                    Create & Assign
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

export default PeopleTab;
