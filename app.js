const BUILD_VERSION = '2026-06-07 22:45';

const STORAGE_KEY = 'race_maker_v1_state';
const STYLES = ['逃げ', '先行', '差し', '追込', '自在'];
const FRAME_COLORS = [
  ['#ffffff', '#111111'], ['#111111', '#ffffff'], ['#e5383b', '#ffffff'], ['#1d4ed8', '#ffffff'],
  ['#f6c945', '#111111'], ['#16a34a', '#ffffff'], ['#f97316', '#ffffff'], ['#ec4899', '#ffffff'],
  ['#7c3aed', '#ffffff'], ['#06b6d4', '#111111'], ['#84cc16', '#111111'], ['#64748b', '#ffffff'],
  ['#b45309', '#ffffff'], ['#0f766e', '#ffffff'], ['#be123c', '#ffffff'], ['#4338ca', '#ffffff'],
  ['#a3a3a3', '#111111'], ['#facc15', '#111111']
];

const HORSE_WORDS_A = ['スター', 'サクラ', 'ルナ', 'ミラージュ', 'オーシャン', 'シャドウ', 'ライト', 'クリムゾン', 'ゴールド', 'スカイ', 'アーク', 'ブレイズ', 'ファントム', 'ノーブル', 'コスモ', 'レッド', 'ブルー', 'グラン'];
const HORSE_WORDS_B = ['ランナー', 'スピア', 'ノヴァ', 'カイザー', 'ベル', 'ストーム', 'ロード', 'ハート', 'キング', 'クイーン', 'ブライト', 'エール', 'ソウル', 'ウィング', 'テイル', 'フォース', 'エッジ', 'ドリーム'];
const JOCKEYS = ['青山', '佐伯', '白石', '黒川', '三浦', '風間', '南雲', '神谷', '東條', '水瀬', '橘', '成田', '早川', '藤堂', '西園', '真田', '桐生', '一ノ瀬'];

const state = {
  settings: {
    raceName: '東京記念杯',
    distance: 1600,
    going: '良',
    course: '芝',
    weather: '晴'
  },
  horses: [],
  results: [],
  replaySeed: null,
  running: false,
  stats: {}
};

const els = {
  runnerList: document.getElementById('runnerList'),
  track: document.getElementById('track'),
  raceLog: document.getElementById('raceLog'),
  resultList: document.getElementById('resultList'),
  startBtn: document.getElementById('startBtn'),
  replayBtn: document.getElementById('replayBtn'),
  resetBtn: document.getElementById('resetBtn'),
  autoHorseBtn: document.getElementById('autoHorseBtn'),
  raceName: document.getElementById('raceName'),
  raceMeta: document.getElementById('raceMeta'),
  settingsBtn: document.getElementById('settingsBtn'),
  statsBtn: document.getElementById('statsBtn'),
  settingsModal: document.getElementById('settingsModal'),
  statsModal: document.getElementById('statsModal'),
  raceNameInput: document.getElementById('raceNameInput'),
  distanceInput: document.getElementById('distanceInput'),
  goingInput: document.getElementById('goingInput'),
  courseInput: document.getElementById('courseInput'),
  weatherInput: document.getElementById('weatherInput'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),
  run100Btn: document.getElementById('run100Btn'),
  clearStatsBtn: document.getElementById('clearStatsBtn'),
  statsBody: document.getElementById('statsBody')
};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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
    for (let i = 0; i < 20; i++) {
      name = `${pick(HORSE_WORDS_A)}${pick(HORSE_WORDS_B)}`;
      if (!used.has(name)) break;
    }
    used.add(name);
    const base = randomInt(55, 92);
    const stamina = randomInt(48, 94);
    const burst = randomInt(48, 96);
    const style = pick(STYLES);
    const aptitude = pick(['短距離', 'マイル', '中距離', '長距離']);
    return {
      id: crypto.randomUUID ? crypto.randomUUID() : `h-${Date.now()}-${index}`,
      number: index + 1,
      name,
      jockey: pick(JOCKEYS),
      style,
      base,
      stamina,
      burst,
      aptitude,
      odds: calculateOdds(base, stamina, burst)
    };
  });
  state.stats = {};
  saveState();
  renderAll();
}

function calculateOdds(base, stamina, burst) {
  const score = base * .48 + stamina * .28 + burst * .24;
  const odds = Math.max(1.4, 13.5 - score / 8 + Math.random() * 2.3);
  return odds.toFixed(1);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    Object.assign(state.settings, parsed.settings || {});
    state.horses = Array.isArray(parsed.horses) ? parsed.horses : [];
    state.stats = parsed.stats || {};
    return state.horses.length > 0;
  } catch {
    return false;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    settings: state.settings,
    horses: state.horses,
    stats: state.stats
  }));
}

function renderAll() {
  renderRaceInfo();
  renderRunners();
  renderTrack();
  renderResults();
}

function renderRaceInfo() {
  els.raceName.textContent = state.settings.raceName;
  els.raceMeta.textContent = `${state.settings.course} ${state.settings.distance}m / ${state.settings.going} / ${state.settings.weather} / ${state.horses.length}頭`;
}

function renderRunners() {
  els.runnerList.innerHTML = state.horses.map((horse, i) => {
    const [bg, fg] = FRAME_COLORS[i % FRAME_COLORS.length];
    return `
      <div class="runner-card" style="--frame-color:${bg};--frame-text:${fg};">
        <div class="number-badge">${horse.number}</div>
        <div>
          <div class="horse-name">${escapeHtml(horse.name)}</div>
          <div class="horse-meta">${escapeHtml(horse.jockey)} / ${horse.style} / ${horse.aptitude} / 能力${horse.base}</div>
        </div>
        <div class="odds">${horse.odds}</div>
      </div>`;
  }).join('');
}

function renderTrack() {
  els.track.innerHTML = state.horses.map((horse, i) => {
    const top = i * 36;
    return `
      <div class="lane" style="top:${top}px">
        <div class="horse-dot" id="horse-${horse.number}">🏇</div>
        <div class="horse-label">${horse.number} ${escapeHtml(horse.name)}</div>
      </div>`;
  }).join('');
}

function renderResults() {
  if (!state.results.length) {
    els.resultList.innerHTML = '<div class="log-item">レース結果はまだありません。</div>';
    return;
  }
  els.resultList.innerHTML = state.results.map((r, index) => `
    <div class="result-row">
      <div class="rank">${index + 1}着</div>
      <div>${r.number}. ${escapeHtml(r.name)}</div>
      <div class="time">${r.time.toFixed(1)}</div>
    </div>
  `).join('');
}

function addLog(text) {
  const row = document.createElement('div');
  row.className = 'log-item';
  row.innerHTML = text;
  els.raceLog.prepend(row);
}

function clearRaceView() {
  state.results = [];
  els.raceLog.innerHTML = '';
  renderResults();
  state.horses.forEach(horse => {
    const dot = document.getElementById(`horse-${horse.number}`);
    if (dot) dot.style.transform = 'translateX(0px)';
  });
}

async function startRace({ replay = false } = {}) {
  if (state.running) return;
  state.running = true;
  els.startBtn.disabled = true;
  els.replayBtn.disabled = true;
  els.autoHorseBtn.disabled = true;
  clearRaceView();

  const seed = replay && state.replaySeed ? state.replaySeed : Date.now() + randomInt(1, 999999);
  state.replaySeed = seed;
  const rnd = seededRandom(seed);
  const raceData = simulateRace(rnd);

  addLog(`<strong>発走。</strong>${state.settings.raceName}、${state.horses.length}頭がスタートしました。`);

  const trackWidth = Math.max(260, els.track.clientWidth - 46);
  const duration = 7200;
  const frames = Math.ceil(duration / 120);

  for (let frame = 0; frame <= frames; frame++) {
    const t = frame / frames;
    raceData.progress.forEach(item => {
      const dot = document.getElementById(`horse-${item.horse.number}`);
      if (!dot) return;
      const x = Math.min(trackWidth, trackWidth * item.curve(t));
      dot.style.transform = `translateX(${x}px)`;
    });

    if (frame === Math.floor(frames * .22)) logLeader(raceData, .22, '序盤');
    if (frame === Math.floor(frames * .52)) logLeader(raceData, .52, '中盤');
    if (frame === Math.floor(frames * .78)) logLeader(raceData, .78, '直線');
    await wait(120);
  }

  state.results = raceData.results;
  updateStats(state.results);
  saveState();
  renderResults();
  addLog(`<strong>ゴール。</strong>1着は${state.results[0].number}番 ${escapeHtml(state.results[0].name)}。`);

  state.running = false;
  els.startBtn.disabled = false;
  els.replayBtn.disabled = false;
  els.autoHorseBtn.disabled = false;
}

function simulateRace(rnd) {
  const distance = Number(state.settings.distance);
  const progress = state.horses.map(horse => {
    const score = calcScore(horse, rnd);
    const time = Math.max(68, 140 - score * .62 + distance / 75 + rnd() * 3.8);
    const startSpeed = stylePhaseBonus(horse.style, 'start');
    const midSpeed = stylePhaseBonus(horse.style, 'mid');
    const endSpeed = stylePhaseBonus(horse.style, 'end');

    const curve = (t) => {
      const noise = Math.sin((t * 10 + horse.number) * 1.7) * .009;
      let p;
      if (t < .34) p = t * (.85 + startSpeed) / .34 * .31;
      else if (t < .72) p = .31 + ((t - .34) / .38) * (.38 + midSpeed);
      else p = .69 + ((t - .72) / .28) * (.31 + endSpeed);
      return Math.min(1, Math.max(0, p + noise));
    };
    return { horse, score, time, curve };
  });

  const results = [...progress]
    .sort((a, b) => a.time - b.time)
    .map(item => ({
      number: item.horse.number,
      name: item.horse.name,
      time: item.time
    }));

  return { progress, results };
}

function calcScore(horse, rnd) {
  const distanceBonus = getDistanceBonus(horse.aptitude, Number(state.settings.distance));
  const goingBonus = getGoingBonus(state.settings.going, horse.style);
  const weatherPenalty = state.settings.weather === '雨' ? -2.5 : state.settings.weather === '曇' ? .5 : 1;
  const courseBonus = state.settings.course === 'ダート' && ['先行', '逃げ'].includes(horse.style) ? 2 : 0;
  const random = (rnd() - .5) * 16;
  return horse.base * .48 + horse.stamina * .26 + horse.burst * .26 + distanceBonus + goingBonus + weatherPenalty + courseBonus + random;
}

function getDistanceBonus(aptitude, distance) {
  const table = {
    '短距離': distance <= 1400 ? 7 : distance >= 2400 ? -8 : -1,
    'マイル': distance === 1600 ? 7 : distance >= 2400 ? -5 : 1,
    '中距離': distance >= 1800 && distance <= 2400 ? 7 : distance === 1200 ? -6 : 0,
    '長距離': distance >= 2400 ? 8 : distance <= 1600 ? -7 : 0
  };
  return table[aptitude] || 0;
}

function getGoingBonus(going, style) {
  if (going === '良') return style === '差し' ? 1.5 : 0;
  if (going === '稍重') return style === '先行' ? 2 : 0;
  if (going === '重') return style === '逃げ' || style === '先行' ? 3 : -1;
  return style === '逃げ' ? 4 : style === '追込' ? -4 : -1;
}

function stylePhaseBonus(style, phase) {
  const map = {
    '逃げ': { start: .18, mid: .02, end: -.08 },
    '先行': { start: .08, mid: .05, end: .01 },
    '差し': { start: -.06, mid: .02, end: .11 },
    '追込': { start: -.14, mid: -.02, end: .21 },
    '自在': { start: .03, mid: .05, end: .05 }
  };
  return map[style][phase];
}

function logLeader(raceData, t, phase) {
  const leader = [...raceData.progress].sort((a, b) => b.curve(t) - a.curve(t))[0].horse;
  const phrase = phase === '直線' ? '最後の直線、伸びてきたのは' : `${phase}、先頭は`;
  addLog(`${phrase}<strong>${leader.number}番 ${escapeHtml(leader.name)}</strong>。`);
}

function updateStats(results) {
  results.forEach((result, index) => {
    if (!state.stats[result.number]) state.stats[result.number] = { run: 0, win: 0, place2: 0, place3: 0 };
    const s = state.stats[result.number];
    s.run += 1;
    if (index === 0) s.win += 1;
    if (index <= 1) s.place2 += 1;
    if (index <= 2) s.place3 += 1;
  });
}

function renderStats() {
  const rows = state.horses.map(horse => {
    const s = state.stats[horse.number] || { run: 0, win: 0, place2: 0, place3: 0 };
    const pct = (n) => s.run ? `${((n / s.run) * 100).toFixed(1)}%` : '-';
    return { horse, s, html: `
      <tr>
        <td>${horse.number}</td>
        <td>${escapeHtml(horse.name)}</td>
        <td>${pct(s.win)}</td>
        <td>${pct(s.place2)}</td>
        <td>${pct(s.place3)}</td>
        <td>${s.run}</td>
      </tr>` };
  });
  rows.sort((a, b) => (b.s.win / Math.max(1, b.s.run)) - (a.s.win / Math.max(1, a.s.run)));
  els.statsBody.innerHTML = rows.map(r => r.html).join('');
}

function runBatch(count) {
  for (let i = 0; i < count; i++) {
    const raceData = simulateRace(seededRandom(Date.now() + i + Math.floor(Math.random() * 1000000)));
    updateStats(raceData.results);
  }
  saveState();
  renderStats();
}

function openSettings() {
  els.raceNameInput.value = state.settings.raceName;
  els.distanceInput.value = String(state.settings.distance);
  els.goingInput.value = state.settings.going;
  els.courseInput.value = state.settings.course;
  els.weatherInput.value = state.settings.weather;
  els.settingsModal.showModal();
}

function saveSettings() {
  state.settings.raceName = els.raceNameInput.value.trim() || '無名レース';
  state.settings.distance = Number(els.distanceInput.value);
  state.settings.going = els.goingInput.value;
  state.settings.course = els.courseInput.value;
  state.settings.weather = els.weatherInput.value;
  saveState();
  renderRaceInfo();
  els.settingsModal.close();
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
els.resetBtn.addEventListener('click', clearRaceView);
els.autoHorseBtn.addEventListener('click', () => {
  if (confirm('出走馬と集計を作り直します。よろしいですか？')) generateHorses();
});
els.settingsBtn.addEventListener('click', openSettings);
els.saveSettingsBtn.addEventListener('click', saveSettings);
els.statsBtn.addEventListener('click', () => {
  renderStats();
  els.statsModal.showModal();
});
els.run100Btn.addEventListener('click', () => runBatch(100));
els.clearStatsBtn.addEventListener('click', () => {
  if (!confirm('集計をクリアします。よろしいですか？')) return;
  state.stats = {};
  saveState();
  renderStats();
});

if (!loadState()) generateHorses();
else renderAll();

console.log(`Race Maker build ${BUILD_VERSION}`);
