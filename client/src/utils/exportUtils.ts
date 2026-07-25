import type { Standup, Retrospective } from '../types';

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
};

export const copyRichToClipboard = async (plainText: string, htmlText: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const textBlob = new Blob([plainText], { type: 'text/plain' });
      const htmlBlob = new Blob([htmlText], { type: 'text/html' });
      const item = new ClipboardItem({
        'text/plain': textBlob,
        'text/html': htmlBlob,
      });
      await navigator.clipboard.write([item]);
      return true;
    } else {
      await navigator.clipboard.writeText(plainText);
      return true;
    }
  } catch (err) {
    console.error('Failed to copy rich content to clipboard', err);
    try {
      await navigator.clipboard.writeText(plainText);
      return true;
    } catch {
      return false;
    }
  }
};

export const downloadFile = (filename: string, content: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Formats standups into HTML for Microsoft Teams (rich paste with bolding, lists, and spacing)
export const formatStandupHTML = (standups: Standup[], featureTitle?: string, dateStr?: string): string => {
  const formattedDate = dateStr || new Date().toISOString().split('T')[0];
  
  let html = `<div style="font-family: 'Segoe UI', -apple-system, sans-serif; font-size: 14px; color: #1e293b; line-height: 1.5;">`;
  html += `<p style="font-size: 15px; margin: 0 0 4px 0;">🚀 <strong>DAILY STANDUP UPDATE</strong> - ${formattedDate}</p>`;
  if (featureTitle) {
    html += `<p style="font-size: 13px; color: #475569; margin: 0 0 10px 0;">📌 <strong>Feature:</strong> ${featureTitle}</p>`;
  }
  html += `<hr style="border: none; border-top: 1px solid #cbd5e1; margin: 10px 0 14px 0;" />`;

  if (standups.length === 0) {
    html += `<p style="color: #64748b; italic;">No standup updates submitted for this date.</p>`;
    html += `</div>`;
    return html;
  }

  standups.forEach((s) => {
    const hrs = parseFloat(String(s.hours_logged || 0));
    html += `<div style="margin-bottom: 14px;">`;
    html += `<p style="margin: 0 0 4px 0; font-size: 14px;">👤 <strong>${s.person_name}</strong> ${s.person_role ? `<span style="color: #64748b; font-size: 12px;">(${s.person_role})</span>` : ''} ${hrs > 0 ? `<span style="color: #059669; font-size: 12px; font-weight: bold;">[⏱️ ${hrs} hrs logged]</span>` : ''}</p>`;
    html += `<div style="margin-left: 16px; font-size: 13px;">`;

    const yesterdayText = (s.yesterday || 'None reported').replace(/\n/g, '<br/>');
    const todayText = (s.today || 'None reported').replace(/\n/g, '<br/>');
    const blockersText = (s.blockers || 'None').replace(/\n/g, '<br/>');

    html += `<p style="margin: 3px 0;">🔹 <strong>Yesterday:</strong><br/>${yesterdayText}</p>`;
    html += `<p style="margin: 3px 0;">🟢 <strong>Today:</strong><br/>${todayText}</p>`;
    if (s.blockers) {
      html += `<p style="margin: 3px 0; color: #dc2626;">🚨 <strong>Blockers:</strong><br/>${blockersText}</p>`;
    } else {
      html += `<p style="margin: 3px 0; color: #16a34a;">✅ <strong>Blockers:</strong> None</p>`;
    }
    html += `</div></div>`;
  });

  html += `</div>`;
  return html;
};

// Formats standups into clean plain text
export const formatStandupPlainText = (standups: Standup[], featureTitle?: string, dateStr?: string): string => {
  const formattedDate = dateStr || new Date().toISOString().split('T')[0];
  let text = `🚀 DAILY STANDUP UPDATE - ${formattedDate}\n`;
  if (featureTitle) text += `📌 Feature: ${featureTitle}\n`;
  text += `───────────────────────────────────\n\n`;

  if (standups.length === 0) {
    text += `No standup updates submitted for this date.\n`;
    return text;
  }

  standups.forEach((s) => {
    const hrs = parseFloat(String(s.hours_logged || 0));
    text += `👤 ${s.person_name} ${s.person_role ? `(${s.person_role})` : ''} ${hrs > 0 ? `[${hrs} hrs logged]` : ''}\n`;
    
    if (s.yesterday) {
      text += `  🔹 Yesterday:\n    ${s.yesterday.replace(/\n/g, '\n    ')}\n`;
    } else {
      text += `  🔹 Yesterday: None reported\n`;
    }

    if (s.today) {
      text += `  🟢 Today:\n    ${s.today.replace(/\n/g, '\n    ')}\n`;
    } else {
      text += `  🟢 Today: None reported\n`;
    }

    if (s.blockers) {
      text += `  🚨 Blockers:\n    ${s.blockers.replace(/\n/g, '\n    ')}\n`;
    } else {
      text += `  ✅ Blockers: None\n`;
    }
    text += `\n`;
  });

  return text;
};

export const exportStandupsToCSV = (standups: Standup[], featureTitle: string, dateStr: string) => {
  const headers = ['Date', 'Feature', 'Person', 'Role', 'Hours Logged', 'Yesterday', 'Today', 'Blockers'];
  const rows = standups.map(s => [
    dateStr,
    `"${featureTitle.replace(/"/g, '""')}"`,
    `"${s.person_name.replace(/"/g, '""')}"`,
    `"${(s.person_role || '').replace(/"/g, '""')}"`,
    s.hours_logged || 0,
    `"${(s.yesterday || '').replace(/"/g, '""')}"`,
    `"${(s.today || '').replace(/"/g, '""')}"`,
    `"${(s.blockers || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(`standups_${dateStr}.csv`, csvContent, 'text/csv;charset=utf-8;');
};

export const formatRetroHTML = (retros: Retrospective[], featureTitle: string): string => {
  let html = `<div style="font-family: 'Segoe UI', -apple-system, sans-serif; font-size: 14px; color: #1e293b; line-height: 1.5;">`;
  html += `<p style="font-size: 15px; margin: 0 0 4px 0;">💡 <strong>RETROSPECTIVE REPORT</strong></p>`;
  html += `<p style="font-size: 13px; color: #475569; margin: 0 0 4px 0;">📌 <strong>Feature:</strong> ${featureTitle}</p>`;
  html += `<p style="font-size: 12px; color: #64748b; margin: 0 0 10px 0;">📅 <strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>`;
  html += `<hr style="border: none; border-top: 1px solid #cbd5e1; margin: 10px 0 14px 0;" />`;

  if (retros.length === 0) {
    html += `<p style="color: #64748b; italic;">No retrospective entries recorded.</p></div>`;
    return html;
  }

  retros.forEach((r, index) => {
    html += `<div style="margin-bottom: 16px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #f8fafc;">`;
    html += `<p style="margin: 0 0 8px 0; font-weight: bold; font-size: 13px; color: #475569;">Entry #${index + 1} (By ${r.created_by_name} on ${new Date(r.created_at).toLocaleDateString()})</p>`;
    
    if (r.went_well) {
      html += `<p style="margin: 4px 0; color: #16a34a;">🟢 <strong>What Went Well:</strong><br/>${r.went_well.replace(/\n/g, '<br/>')}</p>`;
    }
    
    if (r.to_improve) {
      html += `<p style="margin: 4px 0; color: #d97706;">🟡 <strong>What To Improve:</strong><br/>${r.to_improve.replace(/\n/g, '<br/>')}</p>`;
    }
    
    if (r.action_items) {
      html += `<p style="margin: 4px 0; color: #2563eb;">🔵 <strong>Action Items:</strong><br/>${r.action_items.replace(/\n/g, '<br/>')}</p>`;
    }

    html += `</div>`;
  });

  html += `</div>`;
  return html;
};

export const formatRetroPlainText = (retros: Retrospective[], featureTitle: string): string => {
  let text = `💡 RETROSPECTIVE REPORT\n`;
  text += `📌 Feature: ${featureTitle}\n`;
  text += `📅 Generated: ${new Date().toLocaleDateString()}\n`;
  text += `───────────────────────────────────\n\n`;

  if (retros.length === 0) {
    text += `No retrospective entries recorded.\n`;
    return text;
  }

  retros.forEach((r, index) => {
    text += `Entry #${index + 1} (By ${r.created_by_name} on ${new Date(r.created_at).toLocaleDateString()})\n\n`;
    
    if (r.went_well) {
      text += `🟢 What Went Well:\n${r.went_well}\n\n`;
    }
    
    if (r.to_improve) {
      text += `🟡 What To Improve:\n${r.to_improve}\n\n`;
    }
    
    if (r.action_items) {
      text += `🔵 Action Items:\n${r.action_items}\n\n`;
    }

    text += `-----------------------------------\n\n`;
  });

  return text;
};

export const exportRetroToCSV = (retros: Retrospective[], featureTitle: string) => {
  const headers = ['Date', 'Author', 'Feature', 'Went Well', 'To Improve', 'Action Items'];
  const rows = retros.map(r => [
    new Date(r.created_at).toLocaleDateString(),
    `"${(r.created_by_name || '').replace(/"/g, '""')}"`,
    `"${featureTitle.replace(/"/g, '""')}"`,
    `"${(r.went_well || '').replace(/"/g, '""')}"`,
    `"${(r.to_improve || '').replace(/"/g, '""')}"`,
    `"${(r.action_items || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(`retro_${featureTitle.toLowerCase().replace(/\s+/g, '_')}.csv`, csvContent, 'text/csv;charset=utf-8;');
};
