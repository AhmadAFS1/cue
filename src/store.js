// Simple JSON-file settings store (avoids native modules so `npm install` stays clean).
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { normalizeBaseUrl } = require('./openai-compatible');
const { normalizeResumeSettings } = require('./resume-library');

const FILE = path.join(app.getPath('userData'), 'cue-data.json');

// Cap on the user's custom response rules. Generous but bounded: anything longer
// should live in a real prompt file, not in a settings field.
const MAX_AI_RULES_CHARS = 2000;
const CURRENT_OPENAI_DEFAULT = 'gpt-5.6-sol';

const DEFAULTS = {
  provider: 'openai',
  sttProvider: 'openai',
  sttModel: 'gpt-4o-mini-transcribe',
  localWhisper: {
    modelId: 'base.en',
    language: 'auto',
    threads: 0
  },
  smart: false,
  baseUrl: '',
  minimaxRegion: 'global_en',
  apiKeys: { openai: '', anthropic: '', gemini: '', deepgram: '', custom: '', ollama: '', groq: '', minimax: '' , azure: '' },
  azureEndpoint: '',
  // Tab 2: Profile
  resumeText: '',
  resumes: [],
  supportingDocuments: [],
  activeResumeId: '',
  jobDescription: '',
  // Tab 3: Interview Prep
  starStories: '',       // 3-5 behavioral STAR stories in plain English
  whyCompany: '',        // Why do you want to work here?
  whyLeaving: '',        // Why are you leaving your current job?
  workStyle: '',         // How you work, decision-making style, values
  // Tab 4: Q&A
  salaryTarget: '',      // e.g. "$150k-$180k base + equity"
  questionsToAsk: '',    // Questions to ask the interviewer
  // Tab 5: Style — custom response rules
  // The user writes how the AI should write: e.g. "no em-dashes", "use bullet
  // points", "casual tone". Applied to every LLM mode EXCEPT LeetCode (kept
  // strict for coding problems).
  aiRules: '',
  // Window position
  windowX: null,
  windowY: null,
  windowWidth: 700,
  windowHeight: 600,
  windowExpanded: false,
  windowRestoreBounds: null,
  models: {
    openai: { fast: CURRENT_OPENAI_DEFAULT, smart: CURRENT_OPENAI_DEFAULT },
    anthropic: { fast: 'claude-3-5-haiku-latest', smart: 'claude-3-5-sonnet-latest' },
    // Kept in sync with CURRENT_GEMINI_DEFAULT in src/llm.js — gemini-2.0-flash
    // (the previous default here) was retired by Google on 2026-03-03 and 404s
    // on every request. gemini-2.5-flash is current and free-tier available.
    gemini: { fast: 'gemini-2.5-flash', smart: 'gemini-2.5-flash' },
    custom: { fast: '', smart: '' },
    ollama: { fast: 'llama3.2', smart: 'llama3.3' },
    groq: { fast: 'llama-3.1-8b-instant', smart: 'llama-3.3-70b-versatile' },
    minimax: { fast: 'MiniMax-M2.7', smart: 'MiniMax-M3' },
    azure: { fast: 'gpt-4o-mini', smart: 'gpt-4o' }
  }
};

let data = null;

function migrateLegacyOpenAIDefaults(settings) {
  const openai = settings.models && settings.models.openai;
  if (!openai) return false;
  let changed = false;
  // Upgrade only the exact defaults shipped by cue. Any other model ID is a
  // user choice and must remain untouched.
  if (openai.fast === 'gpt-4o-mini') { openai.fast = CURRENT_OPENAI_DEFAULT; changed = true; }
  if (openai.smart === 'gpt-4o') { openai.smart = CURRENT_OPENAI_DEFAULT; changed = true; }
  return changed;
}

function deepMerge(base, over) {
  const out = Array.isArray(base) ? base.slice() : { ...base };
  for (const k of Object.keys(over || {})) {
    if (over[k] && typeof over[k] === 'object' && !Array.isArray(over[k]) && typeof base[k] === 'object') {
      out[k] = deepMerge(base[k], over[k]);
    } else {
      if (k === 'aiRules' && typeof over[k] === 'string') {
        out[k] = over[k].slice(0, MAX_AI_RULES_CHARS);
      } else {
        out[k] = over[k];
      }
    }
  }
  return out;
}

function load() {
  if (data) return data;
  try { data = deepMerge(DEFAULTS, JSON.parse(fs.readFileSync(FILE, 'utf8'))); }
  catch { data = deepMerge(DEFAULTS, {}); }

  const legacyResume = (!Array.isArray(data.resumes) || !data.resumes.length) && !!data.resumeText;
  data = normalizeResumeSettings(data);
  if (migrateLegacyOpenAIDefaults(data) || legacyResume) save();

  return data;
}
function save() { try { fs.writeFileSync(FILE, JSON.stringify(data, null, 2)); } catch (e) { /* ignore */ } }

module.exports = {
  MAX_AI_RULES_CHARS,
  getSettings() { return load(); },
  setSettings(patch) {
    load();
    const nextSettings = deepMerge(data, patch || {});
    nextSettings.baseUrl = normalizeBaseUrl(nextSettings.baseUrl);
    data = normalizeResumeSettings(nextSettings);
    save();
    return data;
  }
};
