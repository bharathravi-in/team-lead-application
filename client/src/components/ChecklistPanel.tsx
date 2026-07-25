import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { ChecklistItem } from '../types';
import toast from 'react-hot-toast';
import { 
  Plus, Trash2, Check, Clock,
  ChevronDown, ChevronRight, Edit2, X
} from 'lucide-react';

interface ChecklistPanelProps {
  featureId: string;
  personId: string;
  personName: string;
  avatarColor: string;
  onTasksChange: () => void;
}

const ChecklistPanel = ({ featureId, personId, personName, avatarColor, onTasksChange }: ChecklistPanelProps) => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Add task inputs
  const [newTitle, setNewTitle] = useState('');
  const [newEstHours, setNewEstHours] = useState('');
  const [newActHours, setNewActHours] = useState('');

  // Editing modal state
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editEstHours, setEditEstHours] = useState('');
  const [editActHours, setEditActHours] = useState('');

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/features/${featureId}/people/${personId}/checklists`);
      setItems(res.data);
    } catch {
      toast.error(`Failed to load checklists for ${personName}`);
    } finally {
      setLoading(false);
    }
  }, [featureId, personId, personName]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await api.post(`/features/${featureId}/people/${personId}/checklists`, { 
        title: newTitle,
        estimated_hours: parseFloat(newEstHours) || 0,
        actual_hours: parseFloat(newActHours) || 0
      });
      setNewTitle('');
      setNewEstHours('');
      setNewActHours('');
      fetchItems();
      onTasksChange();
      toast.success('Task & time estimate added');
    } catch {
      toast.error('Failed to add task');
    }
  };

  const handleToggle = async (item: ChecklistItem) => {
    try {
      await api.put(`/features/${featureId}/people/${personId}/checklists/${item.id}`, {
        is_completed: !item.is_completed
      });
      fetchItems();
      onTasksChange();
    } catch {
      toast.error('Failed to update task');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      await api.put(`/features/${featureId}/people/${personId}/checklists/${editingItem.id}`, {
        title: editTitle,
        estimated_hours: parseFloat(editEstHours) || 0,
        actual_hours: parseFloat(editActHours) || 0
      });
      setEditingItem(null);
      fetchItems();
      onTasksChange();
      toast.success('Task details updated');
    } catch {
      toast.error('Failed to update task');
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await api.delete(`/features/${featureId}/people/${personId}/checklists/${itemId}`);
      fetchItems();
      onTasksChange();
      toast.success('Task removed');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const openEdit = (item: ChecklistItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditEstHours(item.estimated_hours ? String(item.estimated_hours) : '0');
    setEditActHours(item.actual_hours ? String(item.actual_hours) : '0');
  };

  const completedCount = items.filter(i => i.is_completed).length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;
  
  const totalEst = items.reduce((sum, item) => sum + (parseFloat(String(item.estimated_hours || 0))), 0);
  const totalAct = items.reduce((sum, item) => sum + (parseFloat(String(item.actual_hours || 0))), 0);

  const initials = personName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
      {/* Panel Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 bg-slate-900/80 hover:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer border-b border-slate-800/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <button className="text-slate-400 hover:text-slate-200">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <div 
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow"
            style={{ backgroundColor: avatarColor || '#6366f1' }}
          >
            {initials}
          </div>
          <div>
            <h4 className="font-semibold text-slate-100 text-sm">{personName}</h4>
            <span className="text-[11px] text-slate-400 font-medium">
              {completedCount} of {items.length} completed
            </span>
          </div>
        </div>

        {/* Time summary & progress bar */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Time:</span>
            <span className="font-semibold text-slate-200">{totalAct}h</span>
            <span className="text-slate-500">/ {totalEst}h est</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-300 w-8 text-right">{progressPercent}%</span>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-3">
          {/* Add item form with Time Logging */}
          <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row gap-2">
            <input 
              type="text"
              placeholder={`Add task for ${personName}...`}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="glass-input flex-1 px-3 py-2 rounded-xl text-xs"
            />
            <div className="flex items-center gap-2">
              <input 
                type="number"
                step="0.5"
                min="0"
                placeholder="Est (hrs)"
                value={newEstHours}
                onChange={(e) => setNewEstHours(e.target.value)}
                className="glass-input w-24 px-3 py-2 rounded-xl text-xs"
                title="Estimated hours required"
              />
              <input 
                type="number"
                step="0.5"
                min="0"
                placeholder="Act (hrs)"
                value={newActHours}
                onChange={(e) => setNewActHours(e.target.value)}
                className="glass-input w-24 px-3 py-2 rounded-xl text-xs"
                title="Actual hours spent"
              />
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </form>

          {/* Item list */}
          {loading ? (
            <div className="h-10 bg-slate-900/40 animate-pulse rounded-xl" />
          ) : items.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-2 text-center">No tasks assigned to {personName} yet.</p>
          ) : (
            <div className="space-y-2 pt-1">
              {items.map((item) => (
                <div 
                  key={item.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border transition-all gap-2 ${
                    item.is_completed 
                      ? 'bg-slate-950/40 border-slate-800/40 text-slate-500' 
                      : 'bg-slate-900/60 border-slate-800 text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div 
                    onClick={() => handleToggle(item)}
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                  >
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                      item.is_completed 
                        ? 'bg-emerald-600 border-emerald-500 text-white' 
                        : 'border-slate-700 bg-slate-950'
                    }`}>
                      {item.is_completed && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span className={`text-xs font-medium truncate ${item.is_completed ? 'line-through opacity-70' : ''}`}>
                      {item.title}
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                    {/* Time pills */}
                    <div className="flex items-center gap-2 text-[11px]">
                      {parseFloat(String(item.estimated_hours || 0)) > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                          Est: {item.estimated_hours}h
                        </span>
                      )}
                      {parseFloat(String(item.actual_hours || 0)) > 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                          Spent: {item.actual_hours}h
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit time or title"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Task & Time Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">Edit Task & Time Estimate</h3>
              <button 
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Task Description *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="glass-input w-full px-3 py-2 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={editEstHours}
                    onChange={(e) => setEditEstHours(e.target.value)}
                    className="glass-input w-full px-3 py-2 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Actual Hours Spent</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={editActHours}
                    onChange={(e) => setEditActHours(e.target.value)}
                    className="glass-input w-full px-3 py-2 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChecklistPanel;
