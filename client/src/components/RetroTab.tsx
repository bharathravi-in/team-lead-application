import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { Retrospective } from '../types';
import toast from 'react-hot-toast';
import { 
  formatRetroHTML, 
  formatRetroPlainText,
  exportRetroToCSV, 
  copyRichToClipboard, 
  downloadFile 
} from '../utils/exportUtils';
import { 
  Sparkles, Plus, Copy, Download, FileText, 
  CheckCircle2, AlertCircle, ListTodo, Trash2, X, Check 
} from 'lucide-react';

interface RetroTabProps {
  featureId: string;
  featureTitle: string;
}

const RetroTab = ({ featureId, featureTitle }: RetroTabProps) => {
  const [retros, setRetros] = useState<Retrospective[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedRetro, setCopiedRetro] = useState(false);

  const [form, setForm] = useState({
    went_well: '',
    to_improve: '',
    action_items: ''
  });

  const fetchRetros = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/features/${featureId}/retrospectives`);
      setRetros(res.data);
    } catch {
      toast.error('Failed to load retrospectives');
    } finally {
      setLoading(false);
    }
  }, [featureId]);

  useEffect(() => {
    fetchRetros();
  }, [fetchRetros]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.went_well.trim() && !form.to_improve.trim() && !form.action_items.trim()) {
      toast.error('Please fill in at least one retrospective field');
      return;
    }

    try {
      await api.post(`/features/${featureId}/retrospectives`, form);
      toast.success('Retrospective saved');
      setShowModal(false);
      setForm({ went_well: '', to_improve: '', action_items: '' });
      fetchRetros();
    } catch {
      toast.error('Failed to save retrospective');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this retrospective entry?')) return;
    try {
      await api.delete(`/features/${featureId}/retrospectives/${id}`);
      toast.success('Retrospective deleted');
      fetchRetros();
    } catch {
      toast.error('Failed to delete retrospective');
    }
  };

  const handleCopyRetro = async () => {
    const htmlText = formatRetroHTML(retros, featureTitle);
    const plainText = formatRetroPlainText(retros, featureTitle);
    const success = await copyRichToClipboard(plainText, htmlText);
    if (success) {
      setCopiedRetro(true);
      toast.success('Copied retrospective report for Teams / Slack!');
      setTimeout(() => setCopiedRetro(false), 2500);
    } else {
      toast.error('Could not copy to clipboard');
    }
  };

  const handleExportCSV = () => {
    exportRetroToCSV(retros, featureTitle);
    toast.success('Downloaded CSV retrospective export');
  };

  const handleExportTxt = () => {
    const plainText = formatRetroPlainText(retros, featureTitle);
    downloadFile(`retro_${featureTitle.toLowerCase().replace(/\s+/g, '_')}.txt`, plainText, 'text/plain;charset=utf-8;');
    toast.success('Downloaded Text retrospective export');
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Feature Retrospective ({retros.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Capture engineering takeaways, improvements, and action items for post-completion reviews
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyRetro}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md ${
              copiedRetro
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
            }`}
          >
            {copiedRetro ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-purple-400" />}
            {copiedRetro ? 'Copied!' : 'Copy Summary'}
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700/60 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-purple-400" /> CSV
          </button>

          <button
            onClick={handleExportTxt}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700/60 transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" /> TXT
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-purple-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Retrospective
          </button>
        </div>
      </div>

      {/* Retrospective Entries */}
      {loading ? (
        <div className="h-36 bg-slate-900/60 animate-pulse rounded-2xl border border-slate-800" />
      ) : retros.length === 0 ? (
        <div className="text-center py-14 px-4 rounded-2xl border border-slate-800 bg-slate-900/40">
          <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-60" />
          <p className="text-slate-300 font-semibold text-sm">No retrospective recorded yet</p>
          <p className="text-slate-500 text-xs mt-1">Reflect on what went well and what action items to improve on future sprints.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {retros.map((r, idx) => (
            <div key={r.id} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-300">
                    By {r.created_by_name || 'Tech Lead'} on {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>

                <button
                  onClick={() => handleDelete(r.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Went well */}
                <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> What Went Well?
                  </span>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                    {r.went_well || <span className="text-slate-500 italic">None entered</span>}
                  </p>
                </div>

                {/* To Improve */}
                <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/20 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> What To Improve?
                  </span>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                    {r.to_improve || <span className="text-slate-500 italic">None entered</span>}
                  </p>
                </div>

                {/* Action Items */}
                <div className="bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/20 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-1.5">
                    <ListTodo className="w-3.5 h-3.5" /> Action Items
                  </span>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                    {r.action_items || <span className="text-slate-500 italic">None entered</span>}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Retro Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">Add Retrospective Summary</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-emerald-400 mb-1">What Went Well?</label>
                <textarea
                  placeholder="Highlights, achievements, clean execution..."
                  value={form.went_well}
                  onChange={(e) => setForm({ ...form, went_well: e.target.value })}
                  className="glass-input w-full px-3 py-2 rounded-xl text-sm h-20 resize-none border-emerald-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-amber-400 mb-1">What To Improve?</label>
                <textarea
                  placeholder="Bottlenecks, miscommunications, technical debt..."
                  value={form.to_improve}
                  onChange={(e) => setForm({ ...form, to_improve: e.target.value })}
                  className="glass-input w-full px-3 py-2 rounded-xl text-sm h-20 resize-none border-amber-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-indigo-400 mb-1">Action Items</label>
                <textarea
                  placeholder="Concrete steps for next sprint..."
                  value={form.action_items}
                  onChange={(e) => setForm({ ...form, action_items: e.target.value })}
                  className="glass-input w-full px-3 py-2 rounded-xl text-sm h-20 resize-none border-indigo-500/30"
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
                  className="px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-md"
                >
                  Save Retrospective
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetroTab;
