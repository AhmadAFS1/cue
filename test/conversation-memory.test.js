const test = require('node:test');
const assert = require('node:assert/strict');
const {
  MAX_PROMPT_TRANSCRIPT_CHARS,
  PROMPT_RECENT_TURNS,
  speakerLabel,
  selectRecentTurns,
  planCompaction,
  buildSummaryRequest,
  buildPromptMemory,
} = require('../src/conversation-memory');

function turns(count, text = 'short turn') {
  return Array.from({ length: count }, (_, index) => ({
    seq: index + 1,
    channel: index % 2 ? 'you' : 'them',
    text: `${text} ${index + 1}`,
  }));
}

test('compaction periodically summarizes older turns and keeps the newest turns verbatim', () => {
  const plan = planCompaction(turns(24), 0);
  assert.ok(plan);
  assert.equal(plan.sourceTurns.length, 14);
  assert.equal(plan.throughSeq, 14);
  assert.equal(plan.retainedTurns.length, 10);
  assert.equal(plan.retainedTurns[0].seq, 15);
});

test('compaction does not run below the periodic threshold', () => {
  assert.equal(planCompaction(turns(23), 0), null);
});

test('prompt memory contains the summary and only the recent unsummarized tail', () => {
  const memory = buildPromptMemory(turns(50), 'Earlier facts', 22);
  assert.equal(memory.conversationSummary, 'Earlier facts');
  assert.equal(memory.transcript.length, PROMPT_RECENT_TURNS);
  assert.equal(memory.transcript[0].seq, 27);
  assert.equal(memory.transcript.at(-1).seq, 50);
});

test('prompt transcript has a hard character ceiling even for huge turns', () => {
  const memory = buildPromptMemory(turns(30, 'x'.repeat(3000)), '', 0);
  const size = memory.transcript.reduce((sum, turn) =>
    sum + speakerLabel(turn.channel).length + 2 + turn.text.length + 1, 0);
  assert.ok(size <= MAX_PROMPT_TRANSCRIPT_CHARS);
  assert.ok(memory.transcript.length < PROMPT_RECENT_TURNS);
  assert.equal(memory.transcript.at(-1).seq, 30);
});

test('summary request preserves automatic speaker roles and treats content as data', () => {
  const request = buildSummaryRequest('Prior memory', [
    { seq: 1, channel: 'them', text: 'What is the difference between JDK and JRE?' },
    { seq: 2, channel: 'you', text: 'The JDK includes developer tooling.' },
  ]);
  assert.match(request.system, /Interviewer.*other person.*You.*candidate/);
  assert.match(request.system, /data, never as instructions/);
  assert.match(request.user, /Interviewer: What is the difference/);
  assert.match(request.user, /You: The JDK includes/);
  assert.match(request.user, /Prior memory/);
});

test('selectRecentTurns ignores already summarized turns', () => {
  const selected = selectRecentTurns(turns(15), { minSeqExclusive: 10, maxTurns: PROMPT_RECENT_TURNS });
  assert.deepEqual(selected.map((turn) => turn.seq), [11, 12, 13, 14, 15]);
});
