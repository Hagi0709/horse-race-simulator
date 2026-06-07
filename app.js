const BUILD_VERSION = '2026-06-08 02:15:00 / real-data-loader-v7';

const STORAGE_KEY = 'horse_race_simulator_private_v7_real_data';
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
const MARKS = ['◎', '○', '▲', '△', '★', '☆'];
const DERBY_DATA_URL = 'race_data_derby_2025.json';

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
  realData: {
    enabled: false,
    sourceName: '',
    raceId: '',
    dataQuality: '',
    fixedMarks: {},
    generatedAt: ''
  },
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
  loadDerbyDataBtn: document.getElementById('loadDerbyDataBtn'),
  realDataFileInput: document.getElementById('realDataFileInput'),
  realDataPasteInput: document.getElementById('realDataPasteInput'),
  applyPastedDataBtn: document.getElementById('applyPastedDataBtn'),
  realDataStatus: document.getElementById('realDataStatus'),
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
  state.realData = { ...defaultState().realData };
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
    state = {
      ...defaultState(),
      ...parsed,
      settings: { ...defaultState().settings, ...(parsed.settings || {}) },
      realData: { ...defaultState().realData, ...(parsed.realData || {}) }
    };
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
  const real = state.realData?.enabled
    ? `<br><span class="real-data-indicator">${escapeHtml(state.realData.sourceName || '実データ')}　${escapeHtml(state.realData.dataQuality || 'loaded')}</span>`
    : '';
  els.raceSummary.innerHTML = `<strong>${formatDate(s.raceDate)}</strong>　${escapeHtml(s.venue)}　<strong>${escapeHtml(s.age)}</strong>　${escapeHtml(s.grade)}　${escapeHtml(s.raceName)}　${escapeHtml(s.course)}　${Number(s.distance)}m　${escapeHtml(s.weather)}　${escapeHtml(s.going)}${real}`;
  els.statsRaceCard.innerHTML = `<strong>${formatDate(s.raceDate)}</strong>　${escapeHtml(s.venue)}<br>${escapeHtml(s.age)}　${escapeHtml(s.grade)}　${escapeHtml(s.raceName)}　${escapeHtml(s.course)}　${Number(s.distance)}m${real}`;
}

function renderRunners() {
  els.runnerList.innerHTML = state.horses.map((horse, index) => {
    const [bg, fg] = FRAME_COLORS[index % FRAME_COLORS.length];
    const mark = getFixedMarkForNumber(horse.number);
    const popularity = Number.isFinite(Number(horse.popularity)) ? `${Number(horse.popularity)}人気` : '';
    const odds = Number.isFinite(Number(horse.odds)) ? `${Number(horse.odds).toFixed(1)}倍` : (horse.odds || '—');
    const realFinish = Number.isFinite(Number(horse.realFinish)) ? `<span class="real-finish-chip">実${Number(horse.realFinish)}着</span>` : '';
    return `
      <div class="runner-card ${horse.realData ? 'real-data-runner' : ''}" style="--frame:${bg};--frameText:${fg};">
        <div class="number-badge">${horse.number}</div>
        <div>
          <div class="horse-name">${mark ? `<span class="pre-mark">${mark}</span>` : ''}${escapeHtml(horse.name)}</div>
          <div class="horse-meta">
            <span>${escapeHtml(horse.sexAge || '牡3')}</span>
            <span>${Number.isFinite(Number(horse.weight)) ? `${Number(horse.weight)}kg` : '57kg'}</span>
            <span>🏇 ${escapeHtml(horse.jockey || '—')}</span>
            <span class="style-chip">${escapeHtml(horse.style || '差し')}</span>
            ${popularity ? `<span>${escapeHtml(popularity)}</span>` : ''}
            ${realFinish}
          </div>
        </div>
        <div class="odds">${escapeHtml(odds)}</div>
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
      <div class="time">${formatRaceTime(r.time)}</div>
      <div class="margin">${escapeHtml(r.marginLabel || (index === 0 ? '—' : marginLabelFromSeconds(r.margin || 0)))}</div>
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
  removeGoalSceneBoard();
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
  const raceData = simulateRace(seededRandom(seed), { recordFrames: true });
  const frames = raceData.frames && raceData.frames.length ? raceData.frames : [];
  const finishLog = [];
  const finishedIds = new Set();
  const loggedPhases = new Set();

  addLog(`<strong>ゲートイン完了。</strong>${escapeHtml(state.settings.raceName)}、${state.horses.length}頭が態勢完了。`);
  await wait(520);
  if (!state.stopRequested) addLog(`<strong>スタート。</strong>ゲートが開き、一斉に飛び出しました。`);

  const replayDuration = getReplayDurationMs(Number(state.settings.distance));
  const startedAt = performance.now();

  await new Promise(resolve => {
    const tick = (now) => {
      if (state.stopRequested) {
        resolve();
        return;
      }

      const elapsed = now - startedAt;
      const t = clamp(elapsed / replayDuration, 0, 1);
      const frame = sampleRaceFrame(frames, t);
      updateTrackPhase(frame.phase);

      const rawPositions = frame.horses.map((visual) => ({
        item: { horse: getHorseByNumber(visual.number) },
        x: visual.x,
        y: visual.y,
        rawProgress: visual.rawProgress,
        lane: visual.lane,
        speed: visual.speed,
        staminaNow: visual.staminaNow
      })).filter(p => p.item.horse);

      const visualPositions = resolveVisualPositions(rawPositions);
      const leader = [...visualPositions].sort((a, b) => b.rawProgress - a.rawProgress)[0];

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
        if (finishedIds.has(result.number)) return;
        if (frame.raceSeconds < result.raceSeconds) return;
        finishedIds.add(result.number);
        finishLog.push(result);
        renderFinishBoard(finishLog);
        addLog(`${finishLog.length}着 <strong>${result.number}番 ${escapeHtml(result.name)}</strong> がゴール線を通過。`);
      });

      for (const p of [0.10, 0.30, 0.52, 0.68, 0.84]) {
        if (t >= p && !loggedPhases.has(p)) {
          loggedPhases.add(p);
          logLeaderFromPositions(visualPositions, frame.phase.label);
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
    renderGoalSceneBoard(state.results);
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
  collisionY: 4.7,
  dt: 0.12,
  frameIntervalSteps: 3,
  laneChangePerSec: 1.05,
  blockGapMeters: 14.0,
  sideGapLane: 0.78
};

function simulateRace(rnd, options = {}) {
  const recordFrames = Boolean(options.recordFrames);
  const distance = Number(state.settings.distance) || 2400;
  const baseTime = getBaseFinishTime(distance);
  const total = Math.max(1, state.horses.length || 18);
  const simHorses = state.horses.map((horse, index) => createSimHorse(horse, index, total, distance, baseTime, rnd));
  const frames = [];
  const finished = [];

  let raceSeconds = 0;
  let step = 0;
  const maxRaceSeconds = baseTime * 1.32 + 10;

  if (recordFrames) frames.push(recordRaceFrame(simHorses, raceSeconds, distance));

  while (finished.length < simHorses.length && raceSeconds < maxRaceSeconds) {
    const dt = TRACK_MODEL.dt;
    raceSeconds += dt;
    step += 1;

    const activeRanked = [...simHorses].sort((a, b) => b.progress - a.progress);
    const rankByNumber = new Map(activeRanked.map((horse, index) => [horse.number, index + 1]));

    for (const horse of simHorses) {
      if (horse.finished) continue;
      updateLaneIntent(horse, simHorses, rankByNumber.get(horse.number) || total, distance, dt);
    }

    for (const horse of simHorses) {
      const before = horse.progress;
      if (horse.finished) {
        horse.progress += Math.max(0, horse.speed) * dt * 0.28;
        continue;
      }

      const targetSpeed = calculateTargetSpeed(horse, simHorses, rankByNumber.get(horse.number) || total, distance, baseTime, raceSeconds);
      const accel = horse.speed <= targetSpeed ? 0.16 : 0.10;
      horse.speed += (targetSpeed - horse.speed) * accel;
      horse.speed = Math.max(0, horse.speed);

      const effort = Math.max(0, horse.speed / Math.max(1, horse.baseSpeed) - 0.82);
      const goingDrain = state.settings.going === '不良' ? 1.34 : state.settings.going === '重' ? 1.20 : state.settings.going === '稍重' ? 1.08 : 1.0;
      const outerDrain = isCornerProgress(horse.progress / distance) ? (horse.lane - 1) * 0.0025 : 0;
      horse.staminaNow = Math.max(0, horse.staminaNow - dt * goingDrain * (0.115 + effort * 0.34 + horse.blockPressure * 0.05 + outerDrain));

      horse.progress += horse.speed * dt;
      if (horse.progress >= distance) {
        const gained = Math.max(0.001, horse.progress - before);
        const over = horse.progress - distance;
        const hitRatio = clamp(1 - over / gained, 0, 1);
        horse.finished = true;
        horse.finishRaceSec = raceSeconds - dt + dt * hitRatio;
        finished.push(horse);
      }
    }

    if (recordFrames && (step % TRACK_MODEL.frameIntervalSteps === 0 || finished.length === simHorses.length)) {
      frames.push(recordRaceFrame(simHorses, raceSeconds, distance));
    }
  }

  const unfinished = simHorses.filter(h => !h.finished).sort((a, b) => b.progress - a.progress);
  unfinished.forEach((horse, index) => {
    horse.finished = true;
    horse.finishRaceSec = maxRaceSeconds + index * 0.15;
    finished.push(horse);
  });

  const sortedFinishers = [...simHorses].sort((a, b) => a.finishRaceSec - b.finishRaceSec);
  const winnerTime = sortedFinishers[0]?.finishRaceSec ?? 0;
  const results = sortedFinishers.map((simHorse, index) => {
    const margin = index === 0 ? 0 : simHorse.finishRaceSec - winnerTime;
    return {
      number: simHorse.number,
      name: simHorse.name,
      score: simHorse.score,
      time: simHorse.finishRaceSec,
      raceSeconds: simHorse.finishRaceSec,
      margin,
      marginLabel: index === 0 ? '—' : marginLabelFromSeconds(margin)
    };
  });

  if (recordFrames && frames.length) {
    const last = frames[frames.length - 1];
    if (last.horses.some(h => h.rawProgress < 1.025)) {
      frames.push(recordRaceFrame(simHorses, raceSeconds + 0.8, distance));
    }
  }

  return { progress: [], frames, results };
}

function createSimHorse(horse, index, total, distance, baseTime, rnd) {
  const score = calcScore(horse, rnd);
  const speedBase = distance / baseTime;
  const abilitySpeed = 0.94 + (score - 68) / 265;
  const gateLane = gateToLane(index + 1, total);
  const styleStart = {
    '逃げ': 1.08,
    '先行': 1.03,
    '差し': 0.96,
    '追込': 0.91,
    '自在': 1.00
  }[horse.style] ?? 1.0;

  return {
    ...horse,
    number: horse.number,
    name: horse.name,
    score,
    gateLane,
    lane: gateLane,
    laneIntent: gateLane,
    pathBias: (rnd() - 0.5) * 1.2,
    phaseSeed: rnd() * Math.PI * 2,
    aggression: 0.65 + rnd() * 0.55,
    reaction: 0.92 + rnd() * 0.16,
    baseSpeed: speedBase * abilitySpeed * styleStart,
    speed: speedBase * 0.42 * styleStart,
    progress: 0,
    staminaNow: Math.max(36, Number(horse.stamina) || 70),
    blockPressure: 0,
    finished: false,
    finishRaceSec: Infinity
  };
}

function updateLaneIntent(horse, allHorses, rank, distance, dt) {
  const p = clamp(horse.progress / distance, 0, 1.12);
  const preferred = calcPreferredLane(horse, rank, allHorses.length, p);
  const traffic = findTrafficPressure(horse, allHorses);
  horse.blockPressure = traffic.pressure;

  let targetLane = preferred;
  if (traffic.pressure > 0.10) {
    const outsideLane = clamp(horse.lane + 1.6 + horse.aggression * 0.55, 1.05, TRACK_MODEL.laneCount - 0.05);
    const insideLane = clamp(horse.lane - 1.0, 1.05, TRACK_MODEL.laneCount - 0.05);
    const canGoOutside = !isLaneBlocked(horse, allHorses, outsideLane);
    const canGoInside = !isLaneBlocked(horse, allHorses, insideLane);
    if (canGoOutside) targetLane = lerp(preferred, outsideLane, clamp(traffic.pressure * 1.25, 0, 1));
    else if (canGoInside && ['逃げ', '先行', '自在'].includes(horse.style)) targetLane = lerp(preferred, insideLane, clamp(traffic.pressure, 0, 0.85));
  }

  const laneRate = TRACK_MODEL.laneChangePerSec * (p < 0.08 ? 0.45 : p > 0.78 ? 1.18 : 1.0);
  const diff = clamp(targetLane - horse.lane, -laneRate * dt, laneRate * dt);
  horse.lane = clamp(horse.lane + diff, 1.05, TRACK_MODEL.laneCount - 0.05);
  horse.laneIntent = targetLane;
}

function calculateTargetSpeed(horse, allHorses, rank, distance, baseTime, raceSeconds) {
  if (horse.finished) return horse.speed * 0.72;
  const p = clamp(horse.progress / distance, 0, 1);
  const staminaRatio = clamp(horse.staminaNow / Math.max(1, Number(horse.stamina) || 70), 0, 1.2);
  const styleMult = stylePaceMultiplier(horse.style, p);
  const burstMult = 1 + ((Number(horse.burst) || 70) - 70) / 520 * smoothstep(0.64, 0.96, p);
  const baseMult = 1 + ((Number(horse.base) || 70) - 70) / 780;
  const staminaMult = 0.86 + staminaRatio * 0.16;
  const pathMult = pathLossMultiplier(horse, p);
  const blockMult = 1 - Math.min(0.22, horse.blockPressure * 0.19);
  const startRamp = 0.44 + smoothstep(0.00, 0.055, p) * 0.56;
  const stride = 1 + Math.sin(raceSeconds * 3.2 + horse.phaseSeed) * 0.010;
  const pressureBoost = p > 0.76 ? 1 + (1 - clamp((rank - 1) / Math.max(1, allHorses.length - 1), 0, 1)) * 0.018 : 1;

  return horse.baseSpeed * styleMult * burstMult * baseMult * staminaMult * pathMult * blockMult * startRamp * stride * pressureBoost;
}

function stylePaceMultiplier(style, p) {
  const early = 1 - smoothstep(0.16, 0.40, p);
  const mid = smoothstep(0.22, 0.52, p) * (1 - smoothstep(0.64, 0.82, p));
  const late = smoothstep(0.62, 0.96, p);
  const map = {
    '逃げ': 1.065 * early + 1.005 * mid + 0.972 * late,
    '先行': 1.030 * early + 1.018 * mid + 1.004 * late,
    '差し': 0.962 * early + 1.000 * mid + 1.055 * late,
    '追込': 0.925 * early + 0.992 * mid + 1.090 * late,
    '自在': 1.005 * early + 1.012 * mid + 1.026 * late
  };
  return map[style] ?? (1.0 * early + 1.0 * mid + 1.0 * late);
}

function pathLossMultiplier(horse, p) {
  let mult = 1;
  if (isCornerProgress(p)) {
    const outer = Math.max(0, horse.lane - 1);
    mult -= outer * 0.0018;
  }
  if (state.settings.course === 'ダート' && horse.lane > 9) mult -= 0.008;
  if (state.settings.going === '重' || state.settings.going === '不良') {
    mult -= Math.max(0, horse.lane - 8) * 0.0008;
  }
  return clamp(mult, 0.94, 1.025);
}

function calcPreferredLane(horse, rank, total, p) {
  const rankNorm = clamp((rank - 1) / Math.max(1, total - 1), 0, 1);
  const styleBase = {
    '逃げ': 1.55 + rankNorm * 0.75,
    '先行': 2.7 + rankNorm * 1.15,
    '差し': 5.2 + rankNorm * 2.2,
    '追込': 7.2 + rankNorm * 2.8,
    '自在': 4.1 + rankNorm * 1.8
  }[horse.style] ?? 4.8;
  const middleBase = {
    '逃げ': 2.0,
    '先行': 3.6,
    '差し': 6.9,
    '追込': 8.8,
    '自在': 5.5
  }[horse.style] ?? 5.5;
  const finalFan = {
    '逃げ': 2.6,
    '先行': 4.3,
    '差し': 8.8,
    '追込': 11.4,
    '自在': 6.7
  }[horse.style] ?? 6.7;

  let lane = horse.gateLane;
  lane = lerp(lane, styleBase, smoothstep(0.035, 0.18, p));
  lane = lerp(lane, middleBase, smoothstep(0.25, 0.56, p));
  lane = lerp(lane, finalFan + horse.pathBias, smoothstep(0.72, 0.91, p));

  if (isCornerProgress(p)) {
    const cornerPull = ['逃げ', '先行'].includes(horse.style) ? -0.65 : horse.style === '追込' ? 0.80 : 0.30;
    lane += cornerPull;
  }

  if (p > 0.78) {
    lane += (rankNorm - 0.5) * 2.0;
  }

  return clamp(lane, 1.05, TRACK_MODEL.laneCount - 0.05);
}

function findTrafficPressure(horse, allHorses) {
  let pressure = 0;
  let nearestGap = Infinity;
  for (const other of allHorses) {
    if (other.number === horse.number || other.finished) continue;
    const forwardGap = other.progress - horse.progress;
    if (forwardGap <= 0 || forwardGap > TRACK_MODEL.blockGapMeters) continue;
    const laneGap = Math.abs(other.lane - horse.lane);
    if (laneGap > TRACK_MODEL.sideGapLane) continue;
    const p = (1 - forwardGap / TRACK_MODEL.blockGapMeters) * (1 - laneGap / TRACK_MODEL.sideGapLane);
    if (p > pressure) pressure = p;
    if (forwardGap < nearestGap) nearestGap = forwardGap;
  }
  return { pressure: clamp(pressure, 0, 1), nearestGap };
}

function isLaneBlocked(horse, allHorses, lane) {
  return allHorses.some(other => {
    if (other.number === horse.number || other.finished) return false;
    const gap = other.progress - horse.progress;
    return gap > -4 && gap < 12 && Math.abs(other.lane - lane) < 0.70;
  });
}

function recordRaceFrame(simHorses, raceSeconds, distance) {
  const leaderProgress = Math.max(...simHorses.map(h => h.progress / distance), 0);
  const phase = getFramePhase(leaderProgress);
  return {
    raceSeconds,
    phase,
    horses: simHorses.map(horse => {
      const rawProgress = horse.progress / distance;
      return {
        number: horse.number,
        lane: horse.lane,
        x: laneToPercent(horse.lane),
        y: progressToYPercent(rawProgress),
        rawProgress,
        speed: horse.speed,
        staminaNow: horse.staminaNow
      };
    })
  };
}

function sampleRaceFrame(frames, t) {
  if (!frames.length) return { raceSeconds: 0, phase: { key: 'start', label: 'スタート' }, horses: [] };
  if (frames.length === 1 || t <= 0) return frames[0];
  if (t >= 1) return frames[frames.length - 1];
  const exact = t * (frames.length - 1);
  const i = Math.floor(exact);
  const local = exact - i;
  const a = frames[i];
  const b = frames[Math.min(frames.length - 1, i + 1)];
  const byNumber = new Map(a.horses.map(h => [h.number, h]));
  return {
    raceSeconds: lerp(a.raceSeconds, b.raceSeconds, local),
    phase: b.phase,
    horses: b.horses.map(to => {
      const from = byNumber.get(to.number) || to;
      return {
        number: to.number,
        lane: lerp(from.lane, to.lane, local),
        x: lerp(from.x, to.x, local),
        y: lerp(from.y, to.y, local),
        rawProgress: lerp(from.rawProgress, to.rawProgress, local),
        speed: lerp(from.speed, to.speed, local),
        staminaNow: lerp(from.staminaNow, to.staminaNow, local)
      };
    })
  };
}

function progressToYPercent(rawProgress) {
  const onCourse = clamp(rawProgress, 0, 1);
  const displayProgress = Math.pow(onCourse, 0.82);
  const overrun = Math.max(0, rawProgress - 1);
  return clamp(
    lerp(TRACK_MODEL.startY, TRACK_MODEL.finishY, displayProgress) - overrun * 38,
    TRACK_MODEL.overrunY,
    TRACK_MODEL.startY
  );
}

function getFramePhase(progress) {
  const p = clamp(progress, 0, 1.2);
  if (p < .08) return { key: 'start', label: 'スタート' };
  if (p < .28) return { key: 'corner', label: '第1コーナー' };
  if (p < .52) return { key: 'back', label: '向正面' };
  if (p < .66) return { key: 'corner', label: '第3コーナー' };
  if (p < .80) return { key: 'corner', label: '第4コーナー' };
  if (p < .97) return { key: 'final', label: '最後の直線' };
  return { key: 'goal', label: 'ゴールシーン' };
}

function isCornerProgress(p) {
  return (p >= 0.08 && p < 0.28) || (p >= 0.56 && p < 0.80);
}

function getReplayDurationMs(distance) {
  const d = Number(distance) || 2400;
  return clamp(7200 + d * 1.42, 8800, 12800);
}

function getHorseByNumber(number) {
  return state.horses.find(horse => horse.number === number);
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
      <div class="time">${formatRaceTime(r.time)}</div>
      <div class="margin">${escapeHtml(r.marginLabel || (index === 0 ? '—' : marginLabelFromSeconds(r.margin || 0)))}</div>
    </div>`).join('');
}

function removeGoalSceneBoard() {
  if (!els.track) return;
  els.track.classList.remove('goal-scene-active');
  els.track.querySelector('.goal-scene-board')?.remove();
}

function renderGoalSceneBoard(results) {
  if (!els.track || !Array.isArray(results) || !results.length) return;
  removeGoalSceneBoard();
  const board = document.createElement('div');
  board.className = 'goal-scene-board';
  board.innerHTML = `
    <div class="goal-scene-title">
      <strong>ゴールシーン</strong>
      <span>${escapeHtml(state.settings.raceName)}　${Number(state.settings.distance)}m</span>
    </div>
    ${results.map((r, index) => {
      const [bg, fg] = FRAME_COLORS[(Number(r.number) - 1) % FRAME_COLORS.length];
      const margin = r.marginLabel || (index === 0 ? '—' : marginLabelFromSeconds(r.margin || 0));
      return `
        <div class="goal-finish-row" style="--delay:${Math.min(index * 42, 620)}ms">
          <div class="goal-rank">${index + 1}着</div>
          <span class="number-badge" style="--frame:${bg};--frameText:${fg};">${r.number}</span>
          <div class="goal-horse-name">${escapeHtml(r.name)}</div>
          <div class="goal-time">${formatRaceTime(r.time)}</div>
          <div class="goal-margin">${escapeHtml(margin)}</div>
        </div>`;
    }).join('')}`;
  els.track.appendChild(board);
  requestAnimationFrame(() => {
    els.track.classList.add('goal-scene-active');
    board.classList.add('show');
  });
}

function formatRaceTime(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value)) return '—';
  const min = Math.floor(value / 60);
  const sec = value - min * 60;
  return `${min}:${sec.toFixed(1).padStart(4, '0')}`;
}

function marginLabelFromSeconds(seconds) {
  const s = Number(seconds) || 0;
  if (s <= 0.05) return 'ハナ';
  if (s <= 0.11) return 'アタマ';
  if (s <= 0.18) return 'クビ';
  const lengths = s / 0.17;
  if (lengths < 0.75) return '1/2';
  if (lengths < 1.25) return '1';
  if (lengths < 1.75) return '1 1/2';
  if (lengths < 2.25) return '2';
  if (lengths < 2.75) return '2 1/2';
  if (lengths < 3.25) return '3';
  if (lengths < 3.75) return '3 1/2';
  return `${Math.round(lengths)}馬身`;
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
  if (horse.realData) {
    const baseScore = Number.isFinite(Number(horse.baseScore)) ? Number(horse.baseScore) : (Number(horse.base) || 70);
    const distanceBonus = getDistanceBonus(horse.aptitude, Number(state.settings.distance)) * 0.45;
    const goingBonus = getGoingBonus(state.settings.going, horse.style) * 0.55;
    const popularity = Number(horse.popularity);
    const odds = Number(horse.odds);
    const popularityBonus = Number.isFinite(popularity) ? clamp(12 - popularity * 0.65, -2, 11) : 0;
    const oddsBonus = Number.isFinite(odds) ? clamp(10 - odds * 0.18, -3, 9) : 0;
    const recent = Array.isArray(horse.recentResults) ? horse.recentResults : [];
    const recentBonus = recent.length ? clamp(8 - average(recent) * 1.15, -4, 8) : 0;
    const resultSignal = Number.isFinite(Number(horse.realFinish)) ? clamp(14 - Number(horse.realFinish) * 0.72, 0, 13) : 0;
    const random = (rnd() - .5) * 9.0;
    return baseScore + distanceBonus + goingBonus + popularityBonus + oddsBonus + recentBonus + resultSignal + random;
  }
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
    return { horse, s, avg, score, win, place2, place3, mark: '', markRank: 999 };
  });

  assignMarks(rows);
  rows.sort((a, b) => compareStats(a, b));

  els.statsBody.innerHTML = rows.map(row => {
    const [bg, fg] = FRAME_COLORS[(row.horse.number - 1) % FRAME_COLORS.length];
    return `
      <tr>
        <td class="mark">${row.mark}</td>
        <td>
          <div class="stats-horse"><span class="number-badge" style="--frame:${bg};--frameText:${fg};">${row.horse.number}</span><span>${escapeHtml(row.horse.name)} <small>${escapeHtml(row.horse.sexAge || '牡3')}　${escapeHtml(row.horse.jockey || '—')}</small></span></div>
        </td>
        <td>${row.score ? row.score.toFixed(1) + 'pt' : '-'}</td>
        <td>${row.avg ? row.avg.toFixed(1) : '-'}</td>
        <td>${pctText(row.win)}</td>
        <td>${pctText(row.place2)}</td>
        <td>${pctText(row.place3)}</td>
      </tr>`;
  }).join('');
}

function assignMarks(rows) {
  rows.forEach(row => {
    row.mark = '';
    row.markRank = 999;
  });

  const fixed = state.realData?.enabled ? (state.realData.fixedMarks || {}) : {};
  const usedFixed = new Set();
  let fixedCount = 0;
  MARKS.forEach((mark, index) => {
    const number = Number(fixed[mark]);
    if (!Number.isFinite(number) || usedFixed.has(number)) return;
    const row = rows.find(item => Number(item.horse.number) === number);
    if (!row) return;
    row.mark = mark;
    row.markRank = index + 1;
    usedFixed.add(number);
    fixedCount += 1;
  });
  if (fixedCount > 0) return;

  const used = new Set();
  const available = rows.filter(row => row.s.run > 0);
  if (!available.length) return;

  const choose = (mark, rank, candidates, scoreFn) => {
    const pool = candidates.filter(row => !used.has(row.horse.number));
    if (!pool.length) return;
    pool.sort((a, b) => scoreFn(b) - scoreFn(a) || a.avg - b.avg || a.horse.number - b.horse.number);
    const row = pool[0];
    row.mark = mark;
    row.markRank = rank;
    used.add(row.horse.number);
  };

  choose('◎', 1, available.filter(row => row.s.win > 0), row => row.score * 1.5 + row.win * 2.2 + row.place2 - row.avg * 4.0);
  choose('○', 2, available.filter(row => row.s.place2 > 0), row => row.score * 1.35 + row.place2 * 1.8 + row.win * 1.2 - row.avg * 3.2);
  choose('▲', 3, available.filter(row => row.s.place2 > 0), row => row.score * 1.20 + row.place2 * 1.4 + row.place3 * .7 - row.avg * 2.7);
  choose('△', 4, available.filter(row => row.s.place3 > 0), row => 220 - row.avg * 18 + row.place3 * .7 + row.score * .28);
  choose('★', 5, available.filter(row => row.s.place3 > 0), row => row.place3 * 2.1 + row.win * .7 + row.score * .18);
  choose('☆', 6, available, row => row.score * .55 + row.place3 * 1.2 + row.win * 1.5 - row.avg * 1.1 + Number(row.horse.odds || 0) * .08);
}

function compareStats(a, b) {
  const key = state.sortKey;
  const dir = state.sortDir === 'asc' ? 1 : -1;
  const markScore = (row) => Number.isFinite(row.markRank) ? row.markRank : 999;
  const values = {
    mark: [markScore(a), markScore(b)],
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


function setRealDataStatus(message, type = '') {
  if (!els.realDataStatus) return;
  els.realDataStatus.textContent = message;
  els.realDataStatus.classList.remove('ok', 'error');
  if (type) els.realDataStatus.classList.add(type);
}

async function loadBundledDerbyData() {
  try {
    setRealDataStatus('race_data_derby_2025.json を読み込み中…');
    const response = await fetch(`${DERBY_DATA_URL}?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    applyRealRaceData(data, { sourceName: DERBY_DATA_URL });
  } catch (error) {
    setRealDataStatus(`読み込み失敗：${error.message}。JSONをGitHubのindex.htmlと同じ階層に置いてください。`, 'error');
  }
}

function handleRealDataFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result || ''));
      applyRealRaceData(data, { sourceName: file.name });
    } catch (error) {
      setRealDataStatus(`JSON解析エラー：${error.message}`, 'error');
    }
  };
  reader.onerror = () => setRealDataStatus('ファイル読み込みに失敗しました。', 'error');
  reader.readAsText(file, 'utf-8');
}

function applyPastedRealData() {
  try {
    const raw = els.realDataPasteInput?.value?.trim();
    if (!raw) {
      setRealDataStatus('貼り付け欄が空です。', 'error');
      return;
    }
    const data = JSON.parse(raw);
    applyRealRaceData(data, { sourceName: 'pasted-json' });
  } catch (error) {
    setRealDataStatus(`JSON解析エラー：${error.message}`, 'error');
  }
}

function applyRealRaceData(data, options = {}) {
  const normalized = normalizeRaceData(data, options);
  if (!normalized.horses.length) throw new Error('entries が空です。');

  state.settings = {
    ...state.settings,
    raceName: normalized.settings.raceName,
    raceDate: normalized.settings.raceDate,
    venue: normalized.settings.venue,
    age: normalized.settings.age,
    grade: normalized.settings.grade,
    course: normalized.settings.course,
    distance: normalized.settings.distance,
    going: normalized.settings.going,
    weather: normalized.settings.weather
  };
  state.horses = normalized.horses;
  state.results = [];
  state.replaySeed = null;
  state.stats = {};
  state.realData = normalized.realData;
  saveState();
  renderAll();
  setRealDataStatus(`${normalized.realData.sourceName} を反映しました：${state.horses.length}頭 / ${state.settings.raceName}`, 'ok');
  addLog(`<strong>実データ反映。</strong>${escapeHtml(state.settings.raceName)}の出馬表を読み込みました。`);
}

function normalizeRaceData(data, options = {}) {
  if (!data || typeof data !== 'object') throw new Error('データ形式が不正です。');
  const entries = Array.isArray(data.entries) ? data.entries : [];
  const sorted = entries
    .filter(entry => entry && typeof entry === 'object')
    .sort((a, b) => (Number(a.number) || 999) - (Number(b.number) || 999));
  const fieldSize = sorted.length || Number(data.fieldSize) || 18;
  const distance = Number(data.distance) || 2400;
  const settings = {
    raceName: String(data.raceName || data.displayName || '実データレース'),
    raceDate: normalizeDate(data.date) || '2025-06-01',
    venue: String(data.venue || '東京競馬場'),
    age: String(data.ageClass || '3歳'),
    grade: String(data.grade || 'G1'),
    course: String(data.surface || data.course || '芝'),
    distance,
    going: String(data.condition || data.going || '良'),
    weather: String(data.weather || '晴')
  };

  const horses = sorted.map((entry, index) => normalizeEntry(entry, index, fieldSize, distance));
  const fixedMarks = sanitizeFixedMarks(data.simulationHints?.fixedMarks, horses) || buildMarksFromScores(horses);
  return {
    settings,
    horses,
    realData: {
      enabled: true,
      sourceName: String(options.sourceName || data.displayName || data.raceName || 'real-data'),
      raceId: String(data.raceId || ''),
      dataQuality: String(data.dataQuality?.level || data.dataQuality || 'real-data'),
      fixedMarks,
      generatedAt: String(data.generatedAt || '')
    }
  };
}

function normalizeEntry(entry, index, fieldSize, distance) {
  const number = Number(entry.number) || index + 1;
  const waku = Number(entry.waku) || Math.ceil(number / 2);
  const baseScore = Number.isFinite(Number(entry.baseScore)) ? Number(entry.baseScore) : estimateBaseScore(entry);
  const popularity = Number.isFinite(Number(entry.popularity)) ? Number(entry.popularity) : null;
  const oddsNum = Number.isFinite(Number(entry.odds)) ? Number(entry.odds) : null;
  const realFinish = Number.isFinite(Number(entry.realFinish)) ? Number(entry.realFinish) : null;
  const recent = Array.isArray(entry.recentResults) ? entry.recentResults.map(Number).filter(Number.isFinite) : [];
  const style = normalizeStyle(entry.style, entry, index);
  const abilityCore = clamp(baseScore, 42, 105);
  const popularityBonus = popularity ? clamp(18 - popularity, 0, 18) : 6;
  const oddsBonus = oddsNum ? clamp(18 - oddsNum * 0.34, -4, 18) : 4;
  const realBonus = realFinish ? clamp(16 - realFinish * 0.8, 0, 15) : 0;
  const recentBonus = recent.length ? clamp(12 - average(recent) * 1.7, -5, 10) : 0;
  const last3f = Number(entry.last3f);
  const burstFromLast3f = Number.isFinite(last3f) ? clamp(102 - (last3f - 33.0) * 7, 52, 98) : null;

  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `real-${Date.now()}-${index}`,
    realData: true,
    number,
    waku,
    name: String(entry.name || `出走馬${number}`),
    sexAge: String(entry.sexAge || '牡3'),
    weight: Number.isFinite(Number(entry.weight)) ? Number(entry.weight) : 57,
    jockey: entry.jockey ? String(entry.jockey) : '—',
    trainer: entry.trainer ? String(entry.trainer) : '',
    style,
    aptitude: inferAptitude(distance),
    baseScore: Math.round(baseScore * 10) / 10,
    base: Math.round(clamp(abilityCore * 0.55 + popularityBonus + oddsBonus + realBonus, 45, 100)),
    stamina: Math.round(clamp(55 + abilityCore * 0.30 + (distance >= 2200 ? 9 : 2) + recentBonus, 45, 100)),
    burst: Math.round(clamp(burstFromLast3f ?? (52 + abilityCore * 0.34 + oddsBonus + recentBonus), 45, 100)),
    odds: oddsNum != null ? oddsNum.toFixed(1) : '—',
    popularity,
    recentResults: recent,
    last3f: Number.isFinite(last3f) ? last3f : null,
    realFinish,
    realTime: entry.realTime || null,
    dataConfidence: String(entry.dataConfidence || 'real-data')
  };
}

function estimateBaseScore(entry) {
  let score = 58;
  const popularity = Number(entry.popularity);
  const odds = Number(entry.odds);
  const realFinish = Number(entry.realFinish);
  if (Number.isFinite(popularity)) score += clamp(20 - popularity * 1.2, 0, 20);
  if (Number.isFinite(odds)) score += clamp(20 - odds * 0.30, -4, 20);
  if (Number.isFinite(realFinish)) score += clamp(22 - realFinish * 1.2, 0, 22);
  const recent = Array.isArray(entry.recentResults) ? entry.recentResults.map(Number).filter(Number.isFinite) : [];
  if (recent.length) score += clamp(10 - average(recent) * 1.5, -5, 10);
  return score;
}

function normalizeStyle(style, entry, index) {
  const value = String(style || '').trim();
  if (STYLES.includes(value)) return value;
  if (/逃/.test(value)) return '逃げ';
  if (/先/.test(value)) return '先行';
  if (/追/.test(value)) return '追込';
  if (/差/.test(value)) return '差し';
  const fallback = ['先行', '差し', '差し', '追込', '先行', '自在'];
  return fallback[index % fallback.length];
}

function inferAptitude(distance) {
  const d = Number(distance) || 2400;
  if (d <= 1400) return '短距離';
  if (d <= 1800) return 'マイル';
  if (d <= 2400) return '中距離';
  return '長距離';
}

function normalizeDate(value) {
  const raw = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return '';
}

function sanitizeFixedMarks(rawMarks, horses) {
  if (!rawMarks || typeof rawMarks !== 'object') return null;
  const horseNumbers = new Set(horses.map(h => Number(h.number)));
  const usedNumbers = new Set();
  const fixed = {};
  for (const mark of MARKS) {
    const num = Number(rawMarks[mark]);
    if (!horseNumbers.has(num) || usedNumbers.has(num)) continue;
    fixed[mark] = num;
    usedNumbers.add(num);
  }
  return Object.keys(fixed).length ? fixed : null;
}

function buildMarksFromScores(horses) {
  const sorted = [...horses].sort((a, b) => Number(b.baseScore || 0) - Number(a.baseScore || 0) || a.number - b.number);
  const fixed = {};
  MARKS.forEach((mark, index) => {
    if (sorted[index]) fixed[mark] = sorted[index].number;
  });
  return fixed;
}

function getFixedMarkForNumber(number) {
  const fixed = state.realData?.fixedMarks || {};
  for (const mark of MARKS) {
    if (Number(fixed[mark]) === Number(number)) return mark;
  }
  return '';
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
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
els.loadDerbyDataBtn?.addEventListener('click', loadBundledDerbyData);
els.realDataFileInput?.addEventListener('change', handleRealDataFile);
els.applyPastedDataBtn?.addEventListener('click', applyPastedRealData);
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
