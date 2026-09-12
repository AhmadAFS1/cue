const { randomUUID } = require('crypto');

// Keep resumeText synchronized for existing prompt and transcription consumers.
// The library lives in userData, never in the packaged app or repository.
function normalizeResumeSettings(settings) {
  const resumes = Array.isArray(settings.resumes) ? settings.resumes.filter(r =>
    r && typeof r.id === 'string' && typeof r.name === 'string' && typeof r.text === 'string'
  ).map(r => ({ ...r })) : [];
  let activeResumeId = settings.activeResumeId || '';
  if (!resumes.length && typeof settings.resumeText === 'string' && settings.resumeText.trim()) {
    resumes.push({ id: 'legacy-resume', name: 'Saved resume', text: settings.resumeText, fileName: '' });
    activeResumeId = 'legacy-resume';
  }
  const selected = resumes.find(r => r.id === activeResumeId);
  return { ...settings, resumes, activeResumeId: selected?.id || '', resumeText: selected?.text || '' };
}

function selectResume(settings, id) {
  const normalized = normalizeResumeSettings(settings);
  if (id && !normalized.resumes.some(r => r.id === id)) throw new Error('Resume not found.');
  return normalizeResumeSettings({ ...normalized, activeResumeId: id, resumeText: '' });
}

function upsertResume(settings, entry) {
  if (!entry || typeof entry.text !== 'string' || !entry.text.trim()) throw new Error('The resume contains no readable text.');
  if (entry.text.length > 200000) throw new Error('Resume exceeds 200,000 characters. It was not truncated or imported.');
  const normalized = normalizeResumeSettings(settings);
  const id = entry.id || randomUUID();
  const resume = { id, name: String(entry.name || 'Resume').trim() || 'Resume', text: entry.text, fileName: entry.fileName || '' };
  const resumes = normalized.resumes.filter(r => r.id !== id).concat(resume);
  return normalizeResumeSettings({ ...normalized, resumes, activeResumeId: id });
}

module.exports = { normalizeResumeSettings, selectResume, upsertResume };
