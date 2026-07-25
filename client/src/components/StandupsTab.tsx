import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { Person, Standup } from '../types';
import toast from 'react-hot-toast';
import { 
  formatStandupHTML, 
  formatStandupPlainText,
  exportStandupsToCSV, 
  copyRichToClipboard, 
  downloadFile 
} from '../utils/exportUtils';
import { 
  MessageSquare, Calendar, Plus, Copy, Download, 
  AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, 
  X, FileText, Check, Clock, Trash2
} from 'lucide-react';

interface StandupsTabProps {
  featureId: string;
  featureTitle: string;
  people: Person[];
}

interface PointItem {
  id: string;
  text: string;
  hours: string;
}

const StandupsTab = ({ featureId, featureTitle, people }: StandupsTabProps) => {
  const [standups, setStandups] = useState<Standup[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copiedTeams, setCopiedTeams] = useState(false);

  // Form State
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [blockersText, setBlockersText] = useState('');
  const [manualTotalHours, setManualTotalHours] = useState('');

  // Itemized points with separate textboxes and time inputs
  const [yesterdayPoints, setYesterdayPoints] = useState<PointItem[]>([
    { id: 'y1', text: '', hours: '' }
  ]);
  const [todayPoints, setTodayPoints] = useState<PointItem[]>([
    { id: 't1', text: '', hours: '' }
  ]);

  const fetchStandups = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/features/${featureId}/standups`, {
        params: { date: selectedDate }
      });
      setStandups(res.data);
    } catch {
      toast.error('Failed to load standup updates');
    } finally {
      setLoading(false);
    }
  }, [featureId, selectedDate]);

  useEffect(() => {
    fetchStandups();
  }, [fetchStandups]);

  // Calculate sum of hours across all points
  const calculatedHoursSum = yesterdayPoints.reduce((sum, p) => sum + (parseFloat(p.hours) || 0), 0) +
                             todayPoints.reduce((sum, p) => sum + (parseFloat(p.hours) || 0), 0);

  const finalHoursLogged = manualTotalHours !== '' ? parseFloat(manualTotalHours) || 0 : calculatedHoursSum;

  const addPointRow = (type: 'yesterday' | 'today') => {
    const newItem: PointItem = { id: Date.now().toString(), text: '', hours: '' };
    if (type === 'yesterday') {
      setYesterdayPoints(prev => [...prev, newItem]);
    } else {
      setTodayPoints(prev => [...prev, newItem]);
    }
  };

  const removePointRow = (type: 'yesterday' | 'today', id: string) => {
    if (type === 'yesterday') {
      setYesterdayPoints(prev => prev.filter(p => p.id !== id));
    } else {
      setTodayPoints(prev => prev.filter(p => p.id !== id));
    }
  };

  const updatePointRow = (type: 'yesterday' | 'today', id: string, key: 'text' | 'hours', value: string) => {
    const updater = (prev: PointItem[]) =>
      prev.map(p => (p.id === id ? { ...p, [key]: value } : p));
    
    if (type === 'yesterday') {
      setYesterdayPoints(updater);
    } else {
      setTodayPoints(updater);
    }
  };

  const openModalForNew = () => {
    if (people.length > 0) setSelectedPersonId(people[0].id);
    setYesterdayPoints([{ id: 'y1', text: '', hours: '' }]);
    setTodayPoints([{ id: 't1', text: '', hours: '' }]);
    setBlockersText('');
    setManualTotalHours('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonId) {
      toast.error('Please select a team member');
      return;
    }

    // Format yesterday & today text from points
    const yesterdayFormatted = yesterdayPoints
      .filter(p => p.text.trim())
      .map(p => `• ${p.text.trim()}${parseFloat(p.hours) > 0 ? ` (${p.hours} hrs)` : ''}`)
      .join('\n');

    const todayFormatted = todayPoints
      .filter(p => p.text.trim())
      .map(p => `• ${p.text.trim()}${parseFloat(p.hours) > 0 ? ` (${p.hours} hrs)` : ''}`)
      .join('\n');

    try {
      await api.post(`/features/${featureId}/standups`, {
        person_id: selectedPersonId,
        yesterday: yesterdayFormatted || null,
        today: todayFormatted || null,
        blockers: blockersText || null,
        hours_logged: finalHoursLogged,
        standup_date: selectedDate
      });

      toast.success('Standup & time log recorded');
      setShowModal(false);
      fetchStandups();
    } catch {
      toast.error('Failed to save standup update');
    }
  };

  const handleCopyTeams = async () => {
    const htmlText = formatStandupHTML(standups, featureTitle, selectedDate);
    const plainText = formatStandupPlainText(standups, featureTitle, selectedDate);
    const success = await copyRichToClipboard(plainText, htmlText);
    if (success) {
      setCopiedTeams(true);
      toast.success('Copied formatted standup for Teams / Slack!');
      setTimeout(() => setCopiedTeams(false), 2500);
    } else {
      toast.error('Could not copy to clipboard');
    }
  };

  const handleExportCSV = () => {
    exportStandupsToCSV(standups, featureTitle, selectedDate);
    toast.success('Downloaded CSV export');
  };

  const handleExportTxt = () => {
    const plainText = formatStandupPlainText(standups, featureTitle, selectedDate);
    downloadFile(`standup_${selectedDate}.txt`, plainText, 'text/plain;charset=utf-8;');
    toast.success('Downloaded Text export');
  };

  const changeDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const totalDailyHours = standups.reduce((sum, s) => sum + (parseFloat(String(s.hours_logged || 0))), 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Export Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        {/* Date Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => changeDate(-1)}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              title="Previous day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 px-3 text-xs font-bold text-slate-200">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-slate-200 border-none outline-none font-bold text-xs cursor-pointer"
              />
            </div>
            <button
              onClick={() => changeDate(1)}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              title="Next day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all"
          >
            Today
          </button>

          {/* Daily total hours pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-xl">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Daily Logged: <strong>{totalDailyHours}h</strong></span>
          </div>
        </div>

        {/* Export / Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyTeams}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md ${
              copiedTeams
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
            }`}
          >
            {copiedTeams ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiedTeams ? 'Copied to Clipboard!' : 'Copy for Teams / Slack'}
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700/60 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-purple-400" /> Export CSV
          </button>

          <button
            onClick={handleExportTxt}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700/60 transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" /> Export TXT
          </button>

          <button
            onClick={openModalForNew}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Record Standup
          </button>
        </div>
      </div>

      {/* Daily Updates Grid */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-32 bg-slate-900/60 animate-pulse rounded-2xl border border-slate-800" />
          ))}
        </div>
      ) : standups.length === 0 ? (
        <div className="text-center py-14 px-4 rounded-2xl border border-slate-800 bg-slate-900/40">
          <MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-60" />
          <p className="text-slate-300 font-semibold text-sm">No standup notes for {selectedDate}</p>
          <p className="text-slate-500 text-xs mt-1">Record updates and log hours for team members working on this feature.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {standups.map((s) => {
            const initials = s.person_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            const hrsLogged = parseFloat(String(s.hours_logged || 0));

            return (
              <div key={s.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-md"
                      style={{ backgroundColor: s.avatar_color || '#6366f1' }}
                    >
                      {initials}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-100 text-sm">{s.person_name}</h4>
                      <span className="text-[11px] text-indigo-400 font-medium">{s.person_role || 'Team Member'}</span>
                    </div>
                  </div>

                  {hrsLogged > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-xl">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{hrsLogged} hrs logged</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 text-xs">
                  {/* Yesterday */}
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-sky-400" /> Yesterday (Points Completed)
                    </span>
                    <p className="text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                      {s.yesterday || <span className="text-slate-600 italic">None reported</span>}
                    </p>
                  </div>

                  {/* Today */}
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Today (Planned Work)
                    </span>
                    <p className="text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                      {s.today || <span className="text-slate-600 italic">None reported</span>}
                    </p>
                  </div>

                  {/* Blockers */}
                  <div className={`p-3 rounded-xl border space-y-1 ${
                    s.blockers ? 'bg-rose-500/10 border-rose-500/30' : 'bg-slate-950/60 border-slate-800/60'
                  }`}>
                    <span className={`text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 ${
                      s.blockers ? 'text-rose-400' : 'text-slate-400'
                    }`}>
                      <AlertTriangle className={`w-3 h-3 ${s.blockers ? 'text-rose-400' : 'text-emerald-400'}`} /> Blockers
                    </span>
                    <p className={`whitespace-pre-wrap font-sans leading-relaxed ${s.blockers ? 'text-rose-200 font-semibold' : 'text-slate-400'}`}>
                      {s.blockers || <span className="text-slate-600 italic">No blockers</span>}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Record Standup Modal with Separate Textbox & Time Inputs */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">Record Daily Standup & Log Task Times</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Select Team Member *</label>
                  {people.length === 0 ? (
                    <p className="text-xs text-rose-400">Please assign team members to this feature first in the People tab!</p>
                  ) : (
                    <select
                      value={selectedPersonId}
                      onChange={(e) => setSelectedPersonId(e.target.value)}
                      className="glass-input w-full px-3.5 py-2 rounded-xl text-xs"
                    >
                      <option value="">Select person...</option>
                      {people.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.role || 'Member'})</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Total Hours Logged
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder={`Sum: ${calculatedHoursSum}h`}
                    value={manualTotalHours !== '' ? manualTotalHours : (calculatedHoursSum > 0 ? String(calculatedHoursSum) : '')}
                    onChange={(e) => setManualTotalHours(e.target.value)}
                    className="glass-input w-full px-3 py-2 rounded-xl text-xs font-bold text-emerald-400"
                    title="Auto-calculated from point items, or override manually"
                  />
                </div>
              </div>

              {/* Yesterday Itemized Points */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase text-sky-400">
                    Yesterday — Individual Tasks Completed & Time
                  </label>
                  <button
                    type="button"
                    onClick={() => addPointRow('yesterday')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Task Point
                  </button>
                </div>

                <div className="space-y-2">
                  {yesterdayPoints.map((p, idx) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <span className="text-slate-500 text-xs font-bold w-4 text-right">{idx + 1}.</span>
                      <input
                        type="text"
                        placeholder="Task description (e.g. Created OAuth2 login UI)"
                        value={p.text}
                        onChange={(e) => updatePointRow('yesterday', p.id, 'text', e.target.value)}
                        className="glass-input flex-1 px-3 py-2 rounded-xl text-xs"
                      />
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="Hours (e.g. 3.5)"
                        value={p.hours}
                        onChange={(e) => updatePointRow('yesterday', p.id, 'hours', e.target.value)}
                        className="glass-input w-28 px-3 py-2 rounded-xl text-xs text-emerald-400 font-semibold"
                        title="Hours spent on this specific task"
                      />
                      {yesterdayPoints.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePointRow('yesterday', p.id)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Today Itemized Points */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase text-emerald-400">
                    Today — Individual Tasks Planned & Estimated Time
                  </label>
                  <button
                    type="button"
                    onClick={() => addPointRow('today')}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Task Point
                  </button>
                </div>

                <div className="space-y-2">
                  {todayPoints.map((p, idx) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <span className="text-slate-500 text-xs font-bold w-4 text-right">{idx + 1}.</span>
                      <input
                        type="text"
                        placeholder="Planned task (e.g. Implement refresh tokens)"
                        value={p.text}
                        onChange={(e) => updatePointRow('today', p.id, 'text', e.target.value)}
                        className="glass-input flex-1 px-3 py-2 rounded-xl text-xs"
                      />
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        placeholder="Hours (e.g. 2.5)"
                        value={p.hours}
                        onChange={(e) => updatePointRow('today', p.id, 'hours', e.target.value)}
                        className="glass-input w-28 px-3 py-2 rounded-xl text-xs text-sky-400 font-semibold"
                        title="Estimated hours for this planned task"
                      />
                      {todayPoints.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePointRow('today', p.id)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Blockers */}
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Blockers (If any)</label>
                <textarea
                  placeholder="Any dependencies, pending reviews, or blockers?"
                  value={blockersText}
                  onChange={(e) => setBlockersText(e.target.value)}
                  className="glass-input w-full px-3 py-2 rounded-xl text-xs h-16 resize-none border-rose-500/30 focus:border-rose-500"
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
                  className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md cursor-pointer"
                >
                  Save Standup & Time
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StandupsTab;
