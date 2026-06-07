const BUILD_VERSION = '2026-06-08 00:40:00 / movement-model-v4';

const STORAGE_KEY = 'horse_race_simulator_private_v4_movement';
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
  els.track.dataset.phase = 'start';
  els.track.innerHTML = `
    <div class="goal-line" aria-hidden="true"></div>
    <div class="start-gate" aria-hidden="true"></div>
    <div class="track-phase-label" id="trackPhaseLabel">スタート</div>
    ${markers}`;
}

function getStartPosition(index) {
  const total = Math.max(1, state.horses.length || 18);
  const lane = gateToLane(index + 1, total);
  return {
    x: laneToPercent(lane),
    y: TRACK_MODEL.startY
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
  const label = document.getElementById('trackPhaseLabel');
  if (label) label.textContent = 'スタート';
  if (els.track) els.track.dataset.phase = 'start';
  state.horses.forEach((horse, index) => {
    const marker = document.getElementById(`horse-${horse.number}`);
    if (!marker) return;
    const pos = getStartPosition(index);
    marker.classList.remove('finished', 'is-leading');
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
  const finishLog = [];
  const finishedIds = new Set();
  const loggedPhases = new Set();

  addLog(`<strong>ゲートイン完了。</strong>${escapeHtml(state.settings.raceName)}、${state.horses.length}頭が態勢完了。`);
  await wait(420);
  if (!state.stopRequested) addLog(`<strong>スタート。</strong>ゲートが開き、一斉に飛び出しました。`);

  const duration = 9800;
  const startedAt = performance.now();

  await new Promise(resolve => {
    const tick = (now) => {
      if (state.stopRequested) {
        resolve();
        return;
      }

      const elapsed = now - startedAt;
      const t = clamp(elapsed / duration, 0, 1);
      const phase = getRacePhase(t);
      updateTrackPhase(phase);

      const rawPositions = raceData.progress.map((item) => ({
        item,
        ...item.positionAt(t)
      }));
      const visualPositions = resolveVisualPositions(rawPositions);
      const leader = [...visualPositions].sort((a, b) => a.y - b.y)[0];

      visualPositions.forEach((pos) => {
        const marker = document.getElementById(`horse-${pos.item.horse.number}`);
        if (!marker) return;
        marker.style.left = `${pos.x}%`;
        marker.style.top = `${pos.y}%`;
        const finished = pos.rawProgress >= 1;
        marker.classList.toggle('finished', finished);
        marker.classList.toggle('is-leading', leader?.item?.horse?.number === pos.item.horse.number && !finished);
      });

      raceData.results.forEach((result) => {
        const progressItem = raceData.progress.find(p => p.horse.number === result.number);
        if (!progressItem) return;
        const p = progressItem.rawProgressAt(t);
        if (p < 1 || finishedIds.has(result.number)) return;
        finishedIds.add(result.number);
        finishLog.push(result);
        renderFinishBoard(finishLog);
        addLog(`${finishLog.length}着 <strong>${result.number}番 ${escapeHtml(result.name)}</strong> がゴール線を通過。`);
      });

      for (const p of [0.12, 0.33, 0.56, 0.73, 0.88]) {
        if (t >= p && !loggedPhases.has(p)) {
          loggedPhases.add(p);
          logLeaderFromPositions(visualPositions, phase.label);
        }
      }

      if (t >= 1) {
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  if (!state.stopRequested) {
    state.results = raceData.results;
    updateStats(state.results);
    saveState();
    renderResults();
    updateTrackPhase({ key: 'goal', label: 'ゴールシーン' });
    addLog(`<strong>確定。</strong>1着は${state.results[0].number}番 ${escapeHtml(state.results[0].name)}。`);
  }

  state.running = false;
  state.stopRequested = false;
  els.startBtn.textContent = '▶ 再生';
  els.startBtn.disabled = false;
  els.replayBtn.disabled = !state.replaySeed;
}

const TRACK_MODEL = {
  laneCount: 18,
  railLeft: 8.5,
  railRight: 91.5,
  startY: 94,
  finishY: 7.8,
  overrunY: -11,
  collisionX: 3.0,
  collisionY: 4.7
};

function simulateRace(rnd) {
  const distance = Number(state.settings.distance);
  const total = Math.max(1, state.horses.length || 18);
  const baseTime = getBaseFinishTime(distance);

  const progress = state.horses.map((horse, index) => {
    const score = calcScore(horse, rnd);
    const formNoise = (rnd() - .5) * 2.8;
    const finishTime = Math.max(
      baseTime - 7.5,
      baseTime - (score - 70) * .145 + formNoise
    );
    const gateLane = gateToLane(index + 1, total);
    const lanePlan = makeLanePlan(horse, gateLane, rnd);
    const lateKick = getLateKick(horse.style, rnd);
    const earlyKick = getEarlyKick(horse.style, rnd);

    const rawProgressAt = (t) => {
      const raceClock = t * (baseTime + 5.8);
      let raw = raceClock / finishTime;
      raw += earlyKick * smoothstep(0.02, 0.23, t) * (1 - smoothstep(0.28, 0.48, t));
      raw += lateKick * smoothstep(0.66, 0.96, t);
      raw += Math.sin((t * 8.2 + horse.number * .37 + lanePlan.phase) * Math.PI) * .0045;
      return raw;
    };

    const positionAt = (t) => {
      const raw = rawProgressAt(t);
      const onCourse = clamp(raw, 0, 1);
      const displayProgress = Math.pow(onCourse, 0.82);
      const overrun = Math.max(0, raw - 1);
      const y = lerp(TRACK_MODEL.startY, TRACK_MODEL.finishY, displayProgress)
        + (overrun > 0 ? -overrun * 42 : 0);
      const lane = laneAt(t, lanePlan);
      const x = laneToPercent(lane);
      return {
        x: clamp(x, TRACK_MODEL.railLeft + 1.7, TRACK_MODEL.railRight - 1.7),
        y: clamp(y, TRACK_MODEL.overrunY, TRACK_MODEL.startY),
        rawProgress: raw,
        lane
      };
    };

    return { horse, score, finishTime, rawProgressAt, positionAt };
  });

  const results = [...progress]
    .sort((a, b) => a.finishTime - b.finishTime)
    .map(item => ({
      number: item.horse.number,
      name: item.horse.name,
      score: item.score,
      time: item.finishTime
    }));

  return { progress, results };
}

function renderFinishBoard(rows) {
  if (!rows.length) {
    renderResults();
    return;
  }
  els.resultList.innerHTML = rows.map((r, index) => `
    <div class="result-row">
      <div class="rank">${index + 1}着</div>
      <div>${r.number}　${escapeHtml(r.name)}</div>
      <div class="time">${r.time.toFixed(1)}</div>
    </div>`).join('');
}

function getBaseFinishTime(distance) {
  const d = Number(distance) || 2400;
  if (d <= 1200) return 70.5;
  if (d <= 1600) return 94.0;
  if (d <= 1800) return 107.0;
  if (d <= 2000) return 120.5;
  if (d <= 2400) return 145.0;
  if (d <= 3000) return 187.0;
  return 202.0;
}

function gateToLane(gate, total = 18) {
  if (!Number.isFinite(total) || total <= 1) return 1;
  const ratio = (clamp(Number(gate) || 1, 1, total) - 1) / (total - 1);
  return 1 + ratio * (TRACK_MODEL.laneCount - 1);
}

function laneToPercent(lane) {
  const ratio = (clamp(lane, 1, TRACK_MODEL.laneCount) - 1) / (TRACK_MODEL.laneCount - 1);
  return TRACK_MODEL.railLeft + ratio * (TRACK_MODEL.railRight - TRACK_MODEL.railLeft);
}

function makeLanePlan(horse, gateLane, rnd) {
  const style = horse.style;
  const innerBias = {
    '逃げ': 1.6,
    '先行': 2.7,
    '差し': 5.5,
    '追込': 8.0,
    '自在': 4.2
  }[style] ?? 4.8;
  const middleBias = {
    '逃げ': 2.2,
    '先行': 4.0,
    '差し': 7.3,
    '追込': 9.5,
    '自在': 6.0
  }[style] ?? 6.0;
  const finalBias = {
    '逃げ': 2.8,
    '先行': 4.8,
    '差し': 9.8,
    '追込': 12.2,
    '自在': 7.0
  }[style] ?? 7.0;

  return {
    gateLane,
    first: clamp(innerBias + (rnd() - .5) * 2.0, 1.2, 16.8),
    middle: clamp(middleBias + (rnd() - .5) * 3.2, 1.2, 17.2),
    final: clamp(finalBias + (rnd() - .5) * 4.0, 1.2, 17.6),
    phase: rnd() * Math.PI * 2,
    weave: .16 + rnd() * .20
  };
}

function laneAt(t, plan) {
  let lane = plan.gateLane;
  lane = lerp(lane, plan.first, smoothstep(0.08, 0.30, t));
  lane = lerp(lane, plan.middle, smoothstep(0.34, 0.63, t));
  lane = lerp(lane, plan.final, smoothstep(0.70, 0.91, t));
  lane += Math.sin(t * 7.2 + plan.phase) * plan.weave;
  return clamp(lane, 1.05, TRACK_MODEL.laneCount - .05);
}

function getEarlyKick(style, rnd) {
  const base = {
    '逃げ': .055,
    '先行': .031,
    '差し': -.018,
    '追込': -.042,
    '自在': .010
  }[style] ?? 0;
  return base + (rnd() - .5) * .012;
}

function getLateKick(style, rnd) {
  const base = {
    '逃げ': -.012,
    '先行': .006,
    '差し': .040,
    '追込': .065,
    '自在': .025
  }[style] ?? 0;
  return base + (rnd() - .5) * .018;
}

function resolveVisualPositions(positions) {
  const sorted = [...positions].sort((a, b) => a.y - b.y);
  const placed = [];
  for (const pos of sorted) {
    let y = pos.y;
    for (const prev of placed) {
      const nearLane = Math.abs(prev.x - pos.x) < TRACK_MODEL.collisionX;
      const nearForward = Math.abs(prev.y - y) < TRACK_MODEL.collisionY;
      if (!nearLane || !nearForward) continue;
      y = Math.min(TRACK_MODEL.startY, prev.y + TRACK_MODEL.collisionY);
    }
    placed.push({ ...pos, y });
  }
  return placed;
}

function getRacePhase(t) {
  if (t < .09) return { key: 'start', label: 'スタート' };
  if (t < .30) return { key: 'corner', label: '第1コーナー' };
  if (t < .52) return { key: 'back', label: '向正面' };
  if (t < .67) return { key: 'corner', label: '第3コーナー' };
  if (t < .82) return { key: 'corner', label: '第4コーナー' };
  if (t < .94) return { key: 'final', label: '最後の直線' };
  return { key: 'goal', label: 'ゴールシーン' };
}

function updateTrackPhase(phase) {
  if (!phase) return;
  els.track.dataset.phase = phase.key;
  const label = document.getElementById('trackPhaseLabel');
  if (label) label.textContent = phase.label;
}

function logLeaderFromPositions(positions, phaseLabel) {
  const leader = [...positions].sort((a, b) => a.y - b.y)[0]?.item?.horse;
  if (!leader) return;
  const phrases = {
    'スタート': 'スタート直後、好位にいるのは',
    '第1コーナー': '第1コーナー、内を取ったのは',
    '向正面': '向正面、ペースを作るのは',
    '第3コーナー': '第3コーナー、徐々に動いたのは',
    '第4コーナー': '第4コーナー、先頭をうかがうのは',
    '最後の直線': '最後の直線、伸びてきたのは',
    'ゴールシーン': 'ゴール前、粘っているのは'
  };
  addLog(`${phrases[phaseLabel] || phaseLabel}<strong>${leader.number}番 ${escapeHtml(leader.name)}</strong>。`);
}

function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / Math.max(.0001, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
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
  const positions = raceData.progress.map(item => ({ item, ...item.positionAt(t) }));
  logLeaderFromPositions(resolveVisualPositions(positions), phase);
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
