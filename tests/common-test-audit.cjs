'use strict';
const fs = require('node:fs');
function extractArray(source, marker) {
  const at = source.indexOf('const ' + marker + '=');
  if (at < 0) throw new Error('Missing array: ' + marker);
  const open = source.indexOf('[', at);
  let depth = 0, quote = '', escaped = false;
  for (let i = open; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = '';
      continue;
    }
    if (ch === '"') { quote = ch; continue; }
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) return JSON.parse(source.slice(open, i + 1));
    }
  }
  throw new Error('Unclosed array: ' + marker);
}
const index = fs.readFileSync('index.html', 'utf8');
const practice = fs.readFileSync('practice.html', 'utf8');
const errors = [];
const a = index.indexOf('const COMMON_CASES=');
const b = index.indexOf('const EXTRA_QUESTIONS=', a);
const casesSource = a >= 0 && b > a ? index.slice(a, b) : '';
const tracks = ['geo', 'jhist', 'whist', 'politics', 'ethics', 'integrated'];
for (const track of tracks) if (!new RegExp('\\b' + track + '\\s*:\\s*\\[').test(casesSource)) errors.push('Missing common-test track: ' + track);
const caseCount = (casesSource.match(/makeSocialCase\(/g) || []).length;
const questionCalls = [...casesSource.matchAll(/makeSocialQuestion\("([^"]*)"/g)];
const questionRecords = [...casesSource.matchAll(/makeSocialQuestion\("([^"]*)",\s*\[([^\]]*)\],\s*([0-9]+),\s*"([^"]*)"/g)];
if (caseCount !== 42) errors.push('Expected 42 common/mock cases, found ' + caseCount);
if (questionCalls.length !== 192) errors.push('Expected 192 common/mock questions, found ' + questionCalls.length);
if (questionRecords.length !== 192) errors.push('Expected to parse 192 complete common/mock question records, found ' + questionRecords.length);
const normalize = s => String(s || '').normalize('NFKC').toLowerCase().replace(/\s+/g, '');
const seenCasePrompts = new Set();
for (const match of questionCalls) {
  const prompt = normalize(match[1]);
  if (seenCasePrompts.has(prompt)) errors.push('Duplicate track-specific question prompt: ' + match[1]);
  seenCasePrompts.add(prompt);
}
for (const [i, match] of questionRecords.entries()) {
  const prompt = match[1];
  const options = [...match[2].matchAll(/"([^"]*)"/g)].map(option => option[1]);
  const answer = Number(match[3]);
  const explanation = match[4];
  if (!prompt.trim()) errors.push('Track-specific question ' + (i + 1) + ': missing prompt.');
  if (options.length !== 4 || options.some(option => !option.trim())) errors.push('Track-specific question ' + (i + 1) + ': expected four non-empty options.');
  if (new Set(options).size !== options.length) errors.push('Track-specific question ' + (i + 1) + ': duplicate options.');
  if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) errors.push('Track-specific question ' + (i + 1) + ': answer index out of range.');
  if (explanation.trim().length < 8) errors.push('Track-specific question ' + (i + 1) + ': missing or too-short explanation.');
}
const caseMatches = [...casesSource.matchAll(/makeSocialCase\("([^"]*)","([^"]*)",\\s*"([^"]*)",\\[/g)];
for (let i = 0; i < caseMatches.length; i++) {
  const match = caseMatches[i], end = caseMatches[i + 1]?.index ?? casesSource.length;
  const caseSource = casesSource.slice(match.index, end);
  const qMatches = [...caseSource.matchAll(/makeSocialQuestion\("([^"]*)",\\s*\\[([^\\]]*)\\],\\s*(\\d+),/g)];
  if (match[2].length < 200) errors.push('Case stimulus shorter than 200 characters: ' + match[1]);
  if (![4, 8].includes(qMatches.length)) errors.push(match[1] + ': expected four or eight linked questions');
  const positions = [0, 0, 0, 0];
  for (const q of qMatches) positions[Number(q[3])]++;
  if (Math.max(...positions) - Math.min(...positions) > 1) errors.push(match[1] + ': answer positions are imbalanced');
}
let stimuli, questions;
try {
  stimuli = extractArray(practice, 'COMMON_STIMULI');
  questions = extractArray(practice, 'COMMON_TEST');
} catch (e) { errors.push(e.message); }
if (stimuli && stimuli.length !== 4) errors.push('Generic practice should have four stimuli.');
if (questions && questions.length !== 20) errors.push('Generic practice should have 20 questions.');
if (questions && stimuli) {
  const genericPositions = [0, 0, 0, 0];
  for (const stimulus of stimuli) if (typeof stimulus.text !== 'string' || stimulus.text.length < 200) errors.push('Generic stimulus shorter than 200 characters.');
  const counts = new Map(), seen = new Set(), prompts = new Set();
  let previous = null;
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i], label = 'generic question ' + (i + 1);
    if (!Array.isArray(q) || q.length !== 5) { errors.push(label + ': invalid record shape'); continue; }
    if (!Array.isArray(q[1]) || q[1].length !== 4 || q[1].some(x => typeof x !== 'string' || !x.trim())) errors.push(label + ': expected four options');
    if (!Number.isInteger(q[2]) || q[2] < 0 || q[2] > 3) errors.push(label + ': invalid answer index');
    if (typeof q[3] !== 'string' || !q[3].trim()) errors.push(label + ': missing explanation');
    if (!Number.isInteger(q[4]) || q[4] < 0 || q[4] >= stimuli.length) errors.push(label + ': invalid stimulus index');
    if (q[4] !== previous) {
      if (seen.has(q[4])) errors.push(label + ': a stimulus is split across groups');
      seen.add(q[4]); previous = q[4];
    }
    counts.set(q[4], (counts.get(q[4]) || 0) + 1);\n    genericPositions[q[2]]++;
    const prompt = normalize(q[0]);
    if (prompts.has(prompt)) errors.push(label + ': duplicate generic prompt');
    prompts.add(prompt);
  }
  for (let i = 0; i < stimuli.length; i++) if (counts.get(i) !== 5) errors.push('Stimulus ' + i + ' should have five questions.');\n  if (genericPositions.some(n => n !== 5)) errors.push('Generic common-test answer positions should be balanced 5 per option.');
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('Social studies common-test data OK: six tracks, 42 cases/192 questions, plus four linked generic stimuli.');
