const BUILD_VERSION = '2026-06-08 00:20:00 / numbered-output-v3';

const STORAGE_KEY = 'horse_race_simulator_private_v3_numbered';
const STYLES = ['逃げ', '先行', '差し', '追込', '自在'];
const FRAME_COLORS = [
  ['#ffffff', '#111111'], ['#111111', '#ffffff'], ['#f5f5f5', '#111111'], ['#111111', '#ffffff'],
  ['#ff1111', '#ffffff'], ['#ff1111', '#ffffff'], ['#1747ff', '#ffffff'], ['#1747ff', '#ffffff'],
  ['#f6ee1b', '#111111'], ['#f6ee1b', '#111111'], ['#168d24', '#ffffff'], ['#168d24', '#ffffff'],
  ['#ff6a10', '#ffffff'], ['#ff6a10', '#ffffff'], ['#ff63a9', '#111111'], ['#ff63a9', '#111111'],
  ['#ff63a9', '#111111'], ['#ff63a9', '#111111']
];

const HORSE_WORDS_A = ['ライヒス', 'マシンロウ', 'ケント', 'アルト', 'バステール', 'コンジェ', 'メイショウ', 'シュウナン', 'アウダー', 'ジャスティン', 'リアライズ', 'アスケエシン', 'パントル', 'ゴーイントゥ', 'フォルテ', 'グリーン', 'ロフチャン', 'エムズ'];
const HORSE_WORDS_B = ['アドラー', 'ヴィル', 'ン', 'ラムス', 'タス', 'タス', 'ハチコウ', 'ガルフ', 'シア', 'ビスタ', 'シリウス', 'バラ', 'ナイーフ', 'スカイ', 'アンジェロ', 'エナジー', 'ン', 'ビギン'];
const JOCKEYS = ['佐々木', '横山和', '丹内', '横山武', '川田', '西村淳', 'ディー', '浜中', 'レーン', '坂井瑠', '津村', '岩田康', 'ルメール', '武豊', '荻野極', '戸崎圭', '松山弘', 'ゴンサル'];
const VENUES = ['東京競馬場', '中山競馬場', '京都競馬場', '阪神競馬場', '札幌競馬場', '函館競馬場', '新潟競馬場', '中京競馬場', '小倉競馬場'];
const MARKS = ['◎', '○', '▲', '△', '☆'];

const defaultState = () => ({
  settings: {
    raceName: '東京優駿',
    raceDate: '2026-05-31',
    venue: '東京競馬場',
    age: '3歳',
    grade: 'G1',
    course: '芝',
    distance: 2400,
    going: '良',
    weather: '晴',
    sound: true,
    compact: false
  },
  horses: [],
  results: [],
  replaySeed: null,
  running: false,
  stopRequested: false,
  stats: {},
  sortKey: 'score',
  sortDir: 'desc'
});

let state = defaultState();

const els = {
  simulatorView: document.getElementById('simulatorView'),
  statsView: document.getElementById('statsView'),
  raceSummary: document.getElementById('raceSummary'),
  runnerList: document.getElementById('runnerList'),
  track: document.getElementById('track'),
  raceLog: document.getElementById('raceLog'),
  resultList: document.getElementById('resultList'),
  startBtn: document.getElementById('startBtn'),
  replayBtn: document.getElementById('replayBtn'),
  resetBtn: document.getElementById('resetBtn'),
  settingsBtn: document.getElementById('settingsBtn'),
  makerBtn: document.getElementById('makerBtn'),
  statsBtn: document.getElementById('statsBtn'),
  backToRaceBtn: document.getElementById('backToRaceBtn'),
  settingsModal: document.getElementById('settingsModal'),
  makerModal: document.getElementById('makerModal'),
  soundInput: document.getElementById('soundInput'),
  compactInput: document.getElementById('compactInput'),
  savePreferenceBtn: document.getElementById('savePreferenceBtn'),
  raceNameInput: document.getElementById('raceNameInput'),
  raceDateInput: document.getElementById('raceDateInput'),
  venueInput: document.getElementById('venueInput'),
  ageInput: document.getElementById('ageInput'),
  gradeInput: document.getElementById('gradeInput'),
  courseInput: document.getElementById('courseInput'),
  distanceInput: document.getElementById('distanceInput'),
  goingInput: document.getElementById('goingInput'),
  weatherInput: document.getElementById('weatherInput'),
  autoHorseBtn: document.getElementById('autoHorseBtn'),
  saveRaceBtn: document.getElementById('saveRaceBtn'),
  run100Btn: document.getElementById('run100Btn'),
  run1000Btn: document.getElementById('run1000Btn'),
  clearStatsBtn: document.getElementById('clearStatsBtn'),
  statsBody: document.getElementById('statsBody'),
  trialCount: document.getElementById('trialCount'),
  statsRaceCard: document.getElementById('statsRaceCard'),
  statsTable: document.getElementById('statsTable')
};

function randomInt(min, max, rnd = Math.random) {
  return Math.floor(rnd() * (max - min + 1)) + min;
}

function seededRandom(seed) {
  let x = seed % 2147483647;
  if (x <= 0) x += 2147483646;
  return () => {
    x = x * 16807 % 2147483647;
    return (x - 1) / 2147483646;
  };
}

function pick(arr, rnd = Math.random) {
  return arr[Math.floor(rnd() * arr.length)];
}

function generateHorses() {
  const used = new Set();
  state.horses = Array.from({ length: 18 }, (_, index) => {
    let name = '';
    for (let i = 0; i < 40; i++) {
      name = `${pick(HORSE_WORDS_A)}${pick(HORSE_WORDS_B)}`;
      if (!used.has(name)) break;
    }
    used.add(name);
    const base = randomInt(52, 94);
    const stamina = randomInt(48, 96);
    const burst = randomInt(48, 97);
    const style = pick(STYLES);
    const aptitude = pick(['短距離', 'マイル', '中距離', '長距離']);
    return {
      id: crypto.randomUUID ? crypto.randomUUID() : `h-${Date.now()}-${index}`,
      number: index + 1,
      name,
      sexAge: `牡${state.settings.age.replace(/[^0-9]/g, '') || 3}`,
      weight: randomInt(55, 58),
      jockey: JOCKEYS[index] || pick(JOCKEYS),
      style,
      base,
      stamina,
      burst,
      aptitude,
      odds: calculateOdds(base, stamina, burst)
    };
  });
  state.results = [];
  state.stats = {};
  saveState();
  renderAll();
}

function calculateOdds(base, stamina, burst) {
  const score = base * .5 + stamina * .25 + burst * .25;
  const odds = Math.max(1.3, 16.8 - score / 6.7 + Math.random() * 2.4);
  return odds.toFixed(1);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    state = { ...defaultState(), ...parsed, settings: { ...defaultState().settings, ...(parsed.settings || {}) } };
    return Array.isArray(state.horses) && state.horses.length > 0;
  } catch {
    return false;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function renderAll() {
  document.body.classList.toggle('compact', Boolean(state.settings.compact));
  renderRaceInfo();
  renderRunners();
  renderTrack();
  renderResults();
}

function renderRaceInfo() {
  const s = state.settings;
  els.raceSummary.innerHTML = `<strong>${formatDate(s.raceDate)}</strong>　${escapeHtml(s.venue)}　<strong>${escapeHtml(s.age)}</strong>　${escapeHtml(s.grade)}　${escapeHtml(s.raceName)}　${escapeHtml(s.course)}　${Number(s.distance)}m　${escapeHtml(s.weather)}　${escapeHtml(s.going)}`;
  els.statsRaceCard.innerHTML = `<strong>${formatDate(s.raceDate)}</strong>　${escapeHtml(s.venue)}<br>${escapeHtml(s.age)}　${escapeHtml(s.grade)}　${escapeHtml(s.raceName)}　${escapeHtml(s.course)}　${Number(s.distance)}m`;
}

function renderRunners() {
  els.runnerList.innerHTML = state.horses.map((horse, index) => {
    const [bg, fg] = FRAME_COLORS[index % FRAME_COLORS.length];
    return `
      <div class="runner-card" style="--frame:${bg};--frameText:${fg};">
        <div class="number-badge">${horse.number}</div>
        <div>
          <div class="horse-name">${escapeHtml(horse.name)}</div>
          <div class="horse-meta">
            <span>${escapeHtml(horse.sexAge || '牡3')}</span>
            <span>${horse.weight || 57}kg</span>
            <span>🏇 ${escapeHtml(horse.jockey)}</span>
            <span class="style-chip">${escapeHtml(horse.style)}</span>
          </div>
        </div>
        <div class="odds">${horse.odds}</div>
      </div>`;
  }).join('');
}

function renderTrack() {
  const markers = state.horses.map((horse, index) => {
    const [bg, fg] = FRAME_COLORS[index % FRAME_COLORS.length];
    const pos = getStartPosition(index);
    return `<div class="horse-marker" id="horse-${horse.number}" style="--frame:${bg};--frameText:${fg};left:${pos.x}%;top:${pos.y}%">${horse.number}</div>`;
  }).join('');
  els.track.innerHTML = `<div class="goal-line">ゴール</div><div class="start-label">スタート</div>${markers}`;
}

function getStartPosition(index) {
  const col = index % 9;
  const row = Math.floor(index / 9);
  return {
    x: 16 + col * 8.5 + (row ? 3.8 : 0),
    y: 95 - row * 4.2
  };
}

function renderResults() {
  if (!state.results.length) {
    els.resultList.innerHTML = '<div class="log-item">レース結果はまだありません。</div>';
    return;
  }
  els.resultList.innerHTML = state.results.map((r, index) => `
    <div class="result-row">
      <div class="rank">${index + 1}着</div>
      <div>${r.number}　${escapeHtml(r.name)}</div>
      <div class="time">${r.time.toFixed(1)}</div>
    </div>`).join('');
}

function addLog(text) {
  const row = document.createElement('div');
  row.className = 'log-item';
  row.innerHTML = text;
  els.raceLog.prepend(row);
}

function clearRaceView({ keepLog = false } = {}) {
  state.results = [];
  state.stopRequested = false;
  if (!keepLog) els.raceLog.innerHTML = '';
  renderResults();
  state.horses.forEach((horse, index) => {
    const marker = document.getElementById(`horse-${horse.number}`);
    if (!marker) return;
    const pos = getStartPosition(index);
    marker.classList.remove('finished');
    marker.style.left = `${pos.x}%`;
    marker.style.top = `${pos.y}%`;
  });
}

async function startRace({ replay = false } = {}) {
  if (state.running) {
    state.stopRequested = true;
    addLog('<strong>停止。</strong>レース再生を中断しました。');
    return;
  }

  state.running = true;
  state.stopRequested = false;
  els.startBtn.disabled = false;
  els.startBtn.textContent = '■ 停止';
  els.replayBtn.disabled = true;
  clearRaceView();

  const seed = replay && state.replaySeed ? state.replaySeed : Date.now() + randomInt(1, 999999);
  state.replaySeed = seed;
  const raceData = simulateRace(seededRandom(seed));

  addLog(`<strong>ゲートオープン。</strong>${escapeHtml(state.settings.raceName)}、${state.horses.length}頭が一斉にスタート。`);

  const duration = 8300;
  const frameMs = 90;
  const frames = Math.ceil(duration / frameMs);

  for (let frame = 0; frame <= frames; frame++) {
    if (state.stopRequested) break;
    const t = frame / frames;
    raceData.progress.forEach((item, index) => {
      const marker = document.getElementById(`horse-${item.horse.number}`);
      if (!marker) return;
      const pos = item.path(t, index);
      marker.style.left = `${pos.x}%`;
      marker.style.top = `${pos.y}%`;
      marker.classList.toggle('finished', t > .985);
    });

    if (frame === Math.floor(frames * .18)) logLeader(raceData, .18, '序盤');
    if (frame === Math.floor(frames * .43)) logLeader(raceData, .43, '向正面');
    if (frame === Math.floor(frames * .68)) logLeader(raceData, .68, '第4コーナー');
    if (frame === Math.floor(frames * .86)) logLeader(raceData, .86, '最後の直線');
    await wait(frameMs);
  }

  if (!state.stopRequested) {
    state.results = raceData.results;
    updateStats(state.results);
    saveState();
    renderResults();
    addLog(`<strong>ゴール。</strong>1着は${state.results[0].number}番 ${escapeHtml(state.results[0].name)}。`);
  }

  state.running = false;
  state.stopRequested = false;
  els.startBtn.textContent = '▶ 再生';
  els.startBtn.disabled = false;
  els.replayBtn.disabled = !state.replaySeed;
}

function simulateRace(rnd) {
  const distance = Number(state.settings.distance);
  const progress = state.horses.map((horse, index) => {
    const score = calcScore(horse, rnd);
    const time = Math.max(67, 139 - score * .61 + distance / 78 + rnd() * 4.2);
    const startSpeed = stylePhaseBonus(horse.style, 'start');
    const midSpeed = stylePhaseBonus(horse.style, 'mid');
    const endSpeed = stylePhaseBonus(horse.style, 'end');
    const laneShift = (rnd() - .5) * 7;
    const waviness = .9 + rnd() * 1.5;

    const path = (t) => {
      let p;
      if (t < .3) p = t / .3 * (.29 + startSpeed);
      else if (t < .7) p = .29 + ((t - .3) / .4) * (.39 + midSpeed);
      else p = .68 + ((t - .7) / .3) * (.32 + endSpeed);
      p += Math.sin((t * 12 + horse.number) * 1.1) * .008;
      p = Math.min(1, Math.max(0, p));

      const start = getStartPosition(index);
      const finishX = 50 + (index - 8.5) * .65 + laneShift;
      const x = start.x + (finishX - start.x) * p + Math.sin(t * Math.PI * 2 * waviness + horse.number) * 1.1;
      const y = start.y - p * 89;
      return { x: clamp(x, 8, 92), y: clamp(y, 4.5, 96) };
    };
    return { horse, score, time, path };
  });

  const results = [...progress]
    .sort((a, b) => a.time - b.time)
    .map(item => ({
      number: item.horse.number,
      name: item.horse.name,
      score: item.score,
      time: item.time
    }));

  return { progress, results };
}

function calcScore(horse, rnd) {
  const distanceBonus = getDistanceBonus(horse.aptitude, Number(state.settings.distance));
  const goingBonus = getGoingBonus(state.settings.going, horse.style);
  const weatherPenalty = state.settings.weather === '雨' ? -2.8 : state.settings.weather === '曇' ? .4 : 1.1;
  const courseBonus = state.settings.course === 'ダート' && ['逃げ', '先行'].includes(horse.style) ? 2.2 : 0;
  const random = (rnd() - .5) * 16.5;
  return horse.base * .48 + horse.stamina * .25 + horse.burst * .27 + distanceBonus + goingBonus + weatherPenalty + courseBonus + random;
}

function getDistanceBonus(aptitude, distance) {
  const table = {
    '短距離': distance <= 1400 ? 7 : distance >= 2400 ? -8 : -1,
    'マイル': distance >= 1500 && distance <= 1800 ? 7 : distance >= 2400 ? -5 : 1,
    '中距離': distance >= 1800 && distance <= 2400 ? 7 : distance === 1200 ? -6 : 0,
    '長距離': distance >= 2400 ? 8 : distance <= 1600 ? -7 : 0
  };
  return table[aptitude] || 0;
}

function getGoingBonus(going, style) {
  if (going === '良') return style === '差し' ? 1.5 : 0;
  if (going === '稍重') return style === '先行' ? 2 : 0;
  if (going === '重') return ['逃げ', '先行'].includes(style) ? 3 : -1;
  return style === '逃げ' ? 4 : style === '追込' ? -4 : -1;
}

function stylePhaseBonus(style, phase) {
  const map = {
    '逃げ': { start: .13, mid: .02, end: -.07 },
    '先行': { start: .07, mid: .05, end: .00 },
    '差し': { start: -.04, mid: .01, end: .10 },
    '追込': { start: -.10, mid: -.02, end: .19 },
    '自在': { start: .03, mid: .04, end: .05 }
  };
  return map[style]?.[phase] || 0;
}

function logLeader(raceData, t, phase) {
  const leader = [...raceData.progress].sort((a, b) => a.path(t).y - b.path(t).y)[0].horse;
  const phrases = {
    '序盤': '序盤、ハナを奪ったのは',
    '向正面': '向正面、軽快に進むのは',
    '第4コーナー': '第4コーナー、先頭はまだ',
    '最後の直線': '最後の直線、伸びてきたのは'
  };
  addLog(`${phrases[phase] || phase}<strong>${leader.number}番 ${escapeHtml(leader.name)}</strong>。`);
}

function updateStats(results) {
  results.forEach((result, index) => {
    if (!state.stats[result.number]) state.stats[result.number] = { run: 0, win: 0, place2: 0, place3: 0, rankSum: 0, scoreSum: 0 };
    const s = state.stats[result.number];
    s.run += 1;
    s.rankSum += index + 1;
    s.scoreSum += result.score || 0;
    if (index === 0) s.win += 1;
    if (index <= 1) s.place2 += 1;
    if (index <= 2) s.place3 += 1;
  });
}

function renderStats() {
  renderRaceInfo();
  const totalRuns = Math.max(0, ...Object.values(state.stats).map(s => s.run || 0));
  els.trialCount.textContent = `試行 ${totalRuns} 回`;

  const rows = state.horses.map(horse => {
    const s = state.stats[horse.number] || { run: 0, win: 0, place2: 0, place3: 0, rankSum: 0, scoreSum: 0 };
    const avg = s.run ? s.rankSum / s.run : 0;
    const score = s.run ? s.scoreSum / s.run : 0;
    const win = pctValue(s.win, s.run);
    const place2 = pctValue(s.place2, s.run);
    const place3 = pctValue(s.place3, s.run);
    return { horse, s, avg, score, win, place2, place3, mark: getMark(win, place2, score, avg) };
  });

  rows.sort((a, b) => compareStats(a, b));

  els.statsBody.innerHTML = rows.map(row => {
    const [bg, fg] = FRAME_COLORS[(row.horse.number - 1) % FRAME_COLORS.length];
    return `
      <tr>
        <td class="mark">${row.mark}</td>
        <td>
          <div class="stats-horse"><span class="number-badge" style="--frame:${bg};--frameText:${fg};">${row.horse.number}</span><span>${escapeHtml(row.horse.name)} <small>${escapeHtml(row.horse.sexAge || '牡3')}　${escapeHtml(row.horse.jockey)}</small></span></div>
        </td>
        <td>${row.score ? row.score.toFixed(1) + 'pt' : '-'}</td>
        <td>${row.avg ? row.avg.toFixed(1) : '-'}</td>
        <td>${pctText(row.win)}</td>
        <td>${pctText(row.place2)}</td>
        <td>${pctText(row.place3)}</td>
      </tr>`;
  }).join('');
}

function getMark(win, place2, score, avg) {
  if (!score) return '';
  const rating = win * 2.4 + place2 * 1.2 + score * .18 - avg * 1.5;
  if (rating > 72) return '◎';
  if (rating > 55) return '○';
  if (rating > 42) return '▲';
  if (rating > 31) return '△';
  return '☆';
}

function compareStats(a, b) {
  const key = state.sortKey;
  const dir = state.sortDir === 'asc' ? 1 : -1;
  const markScore = (mark) => MARKS.indexOf(mark) === -1 ? 99 : MARKS.indexOf(mark);
  const values = {
    mark: [markScore(a.mark), markScore(b.mark)],
    number: [a.horse.number, b.horse.number],
    score: [a.score, b.score],
    avg: [a.avg || 99, b.avg || 99],
    win: [a.win, b.win],
    place2: [a.place2, b.place2],
    place3: [a.place3, b.place3]
  }[key] || [a.score, b.score];
  if (key === 'avg' || key === 'mark' || key === 'number') return (values[0] - values[1]) * (state.sortDir === 'asc' ? 1 : -1);
  return (values[0] - values[1]) * dir;
}

function runBatch(count) {
  for (let i = 0; i < count; i++) {
    const raceData = simulateRace(seededRandom(Date.now() + i + Math.floor(Math.random() * 1000000)));
    updateStats(raceData.results);
  }
  saveState();
  renderStats();
}

function showStats() {
  els.simulatorView.classList.add('hidden');
  els.statsView.classList.remove('hidden');
  renderStats();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showRace() {
  els.statsView.classList.add('hidden');
  els.simulatorView.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openPreference() {
  els.soundInput.checked = Boolean(state.settings.sound);
  els.compactInput.checked = Boolean(state.settings.compact);
  els.settingsModal.showModal();
}

function savePreference() {
  state.settings.sound = els.soundInput.checked;
  state.settings.compact = els.compactInput.checked;
  saveState();
  renderAll();
  els.settingsModal.close();
}

function openMaker() {
  const s = state.settings;
  els.raceNameInput.value = s.raceName;
  els.raceDateInput.value = s.raceDate;
  els.venueInput.value = s.venue;
  els.ageInput.value = s.age;
  els.gradeInput.value = s.grade;
  els.courseInput.value = s.course;
  els.distanceInput.value = String(s.distance);
  els.goingInput.value = s.going;
  els.weatherInput.value = s.weather;
  els.makerModal.showModal();
}

function saveRaceSettings() {
  state.settings.raceName = els.raceNameInput.value.trim() || '無名レース';
  state.settings.raceDate = els.raceDateInput.value || '2026-05-31';
  state.settings.venue = els.venueInput.value;
  state.settings.age = els.ageInput.value;
  state.settings.grade = els.gradeInput.value;
  state.settings.course = els.courseInput.value;
  state.settings.distance = Number(els.distanceInput.value);
  state.settings.going = els.goingInput.value;
  state.settings.weather = els.weatherInput.value;
  state.results = [];
  saveState();
  renderAll();
  els.makerModal.close();
}

function formatDate(dateString) {
  const d = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '2026年5月31日';
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function pctValue(n, total) {
  return total ? (n / total) * 100 : 0;
}

function pctText(value) {
  return value ? `${value.toFixed(1)}%` : '0.0%';
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

els.startBtn.addEventListener('click', () => startRace());
els.replayBtn.addEventListener('click', () => startRace({ replay: true }));
els.resetBtn.addEventListener('click', () => clearRaceView());
els.settingsBtn.addEventListener('click', openPreference);
els.savePreferenceBtn.addEventListener('click', savePreference);
els.makerBtn.addEventListener('click', openMaker);
els.saveRaceBtn.addEventListener('click', saveRaceSettings);
els.autoHorseBtn.addEventListener('click', () => {
  if (!confirm('出馬表と集計を作り直します。よろしいですか？')) return;
  generateHorses();
});
els.statsBtn.addEventListener('click', showStats);
els.backToRaceBtn.addEventListener('click', showRace);
els.run100Btn.addEventListener('click', () => runBatch(100));
els.run1000Btn.addEventListener('click', () => runBatch(1000));
els.clearStatsBtn.addEventListener('click', () => {
  if (!confirm('集計をクリアします。よろしいですか？')) return;
  state.stats = {};
  saveState();
  renderStats();
});
els.statsTable.querySelectorAll('th[data-sort]').forEach(th => {
  th.addEventListener('click', () => {
    const key = th.dataset.sort;
    if (state.sortKey === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
    else {
      state.sortKey = key;
      state.sortDir = key === 'avg' || key === 'number' || key === 'mark' ? 'asc' : 'desc';
    }
    saveState();
    renderStats();
  });
});

if (!loadState()) generateHorses();
else renderAll();

console.log(`Horse Race Simulator build ${BUILD_VERSION}`);
