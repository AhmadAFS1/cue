const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeResumeSettings, selectResume, upsertResume } = require('../src/resume-library');
const { buildInterviewContext } = require('../src/interview-context');
test('legacy resume is preserved and selection isolates complete resumes', () => {
  const legacy = normalizeResumeSettings({ resumeText: 'original' });
  let next = upsertResume(legacy, { id: 'second', name: 'Second', text: 'long '.repeat(3000) + 'TAIL' });
  assert.equal(legacy.resumes.length, 1);
  assert.ok(next.resumeText.endsWith('TAIL'));
  next = selectResume(next, 'legacy-resume');
  assert.equal(next.resumeText, 'original');
  assert.equal(selectResume(next, '').resumeText, '');
  assert.throws(() => selectResume(next, 'missing'));
});
test('full supporting references and resume tails reach the live prompt', () => {
  const context = buildInterviewContext({ resumeText: 'resume '.repeat(5000) + 'RESUME_TAIL', supportingDocuments: [{ name: 'Design', text: 'reference '.repeat(25000) + 'REFERENCE_TAIL' }, { name: 'Letter', text: 'LETTER_TAIL' }] }, 'say', []);
  for (const tail of ['RESUME_TAIL', 'REFERENCE_TAIL', 'LETTER_TAIL', 'proposed designs']) assert.ok(context.includes(tail));
});
test('pausing OpenAI transcription cancels reconnect and ignores late text', () => {
  const { OpenAIRealtimeSTT } = require('../src/stt-streaming');
  let called = false;
  const stt = new OpenAIRealtimeSTT('test', { onTranscript: () => { called = true; } });
  assert.equal(stt.model, 'gpt-4o-mini-transcribe');
  stt._attemptReconnect();
  stt.disconnect();
  assert.equal(stt._reconnectTimer._destroyed, true);
  stt._handleEvent({ type: 'conversation.item.input_audio_transcription.completed', transcript: 'late' });
  assert.equal(called, false);
});
