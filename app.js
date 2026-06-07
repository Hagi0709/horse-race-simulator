(() => {
  'use strict';

  window.RACE_SIM_APP_LOADED = 'V8-20260608-0100';

  const BUILD_VERSION = '2026-06-08 01:00:00 V8';
  const MARK_ORDER = ['◎', '○', '▲', '△', '★', '☆'];
  const STYLE_LIST = ['逃げ', '先行', '差し', '追込', '自在'];
  const WAKU_COLORS = {
    1: '#ffffff', 2: '#171717', 3: '#e33434', 4: '#2368d9',
    5: '#f3d327', 6: '#22a33c', 7: '#f08a24', 8: '#ed72b8',
  };
  const WAKU_TEXT = { 1: '#111', 2: '#fff', 3: '#fff', 4: '#fff', 5: '#111', 6: '#fff', 7: '#111', 8: '#111' };
  const BASE_TIME_BY_DISTANCE = new Map([
    [1000, 58.0], [1200, 70.0], [1400, 82.4], [1600, 94.0],
    [1800, 107.5], [2000, 120.0], [2200, 132.8], [2400, 144.2],
    [2500, 152.0], [3000, 185.0], [3200, 199.0], [3600, 229.0],
  ]);

  const DEFAULT_RACE_DATA = {
    schemaVersion: 'race-data-v8',
    raceId: 'v8-sample',
    raceName: 'V8 サンプルレース',
    displayName: 'V8 サンプルレース',
    date: '',
    venue: '東京競馬場',
    surface: '芝',
    distance: 2400,
    condition: '良',
    weather: '晴',
    fixedMarks: { '◎': 6, '○': 11, '▲': 14, '△': 3, '★': 17, '☆': 2 },
    entries: [
      ['リュウセイノワルツ', '先行', 1, 1, '横山武史', 57, 3.6, 2, 88],
      ['サイレントグレイス', '追込', 2, 1, '田辺裕信', 57, 28.4, 11, 70],
      ['ブルームキャッスル', '差し', 3, 2, '戸崎圭太', 57, 9.8, 5, 81],
      ['ヴェルデキング', '逃げ', 4, 2, '松山弘平', 57, 18.1, 8, 74],
      ['アークライト', '自在', 5, 3, '岩田望来', 57, 12.5, 6, 79],
      ['ノースクロス', '先行', 6, 3, '北村友一', 57, 2.4, 1, 93],
      ['エアロフォース', '差し', 7, 4, '武豊', 57, 15.0, 7, 76],
      ['ミストラルパレス', '追込', 8, 4, '坂井瑠星', 57, 33.2, 13, 68],
      ['セントラルロード', '先行', 9, 5, '川田将雅', 57, 7.9, 4, 84],
      ['レッドスティール', '逃げ', 10, 5, '三浦皇成', 57, 42.7, 15, 63],
      ['ゴールドハーバー', '差し', 11, 6, 'C.ルメール', 57, 5.2, 3, 87],
      ['カームテンペスト', '自在', 12, 6, '菅原明良', 57, 46.8, 16, 62],
      ['ディープオーロラ', '追込', 13, 7, '池添謙一', 57, 23.4, 10, 71],
      ['マジェスティロード', '先行', 14, 7, '佐々木大輔', 57, 10.8, 5, 82],
      ['ハヤテノホシ', '逃げ', 15, 7, '丹内祐次', 57, 55.0, 18, 59],
      ['ミッドナイトベル', '差し', 16, 8, '浜中俊', 57, 30.5, 12, 69],
      ['ラストインパクト', '追込', 17, 8, '西村淳也', 57, 20.2, 9, 73],
      ['エターナルコード', '自在', 18, 8, '鮫島克駿', 57, 38.0, 14, 66],
    ].map(([name, style, number, waku, jockey, weight, odds, popularity, baseScore]) => ({
      number, gate: number, waku, name, jockey, weight, odds, popularity, style, baseScore,
      sexAge: '牡3', recentResults: [], last3f: null,
    })),
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const safeNum = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
  const nowSeed = () => Math.floor((Date.now() % 2147483647) + Math.random() * 1000000);

  function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < String(str).length; i++) {
      h ^= String(str).charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function createRng(seedInput) {
    let a = (typeof seedInput === 'number' ? seedInput : hashString(seedInput)) >>> 0;
    return function rng() {
      a += 0x6D2B79F5;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function formatSeconds(sec) {
    if (!Number.isFinite(sec)) return '-';
    const m = Math.floor(sec / 60);
    const s = sec - m * 60;
    return `${m}:${s.toFixed(1).padStart(4, '0')}`;
  }

  function formatPercent(v) {
    if (!Number.isFinite(v)) return '-';
    return `${(v * 100).toFixed(1)}%`;
  }

  function marginLabelFromSeconds(diff) {
    if (!Number.isFinite(diff) || diff <= 0.015) return '-';
    if (diff < 0.04) return 'ハナ';
    if (diff < 0.08) return 'アタマ';
    if (diff < 0.14) return 'クビ';
    if (diff < 0.25) return '1/2';
    if (diff < 0.42) return '1';
    if (diff < 0.62) return '1 1/2';
    if (diff < 0.85) return '2';
    if (diff < 1.20) return '3';
    return `${Math.max(4, Math.round(diff * 4.2))}`;
  }

  function getPhaseForRatio(ratio) {
    if (ratio < 0.035) return { id: 'start', label: 'スタート', corner: false, final: false };
    if (ratio < 0.16) return { id: 'home', label: 'スタート〜1コーナー手前', corner: false, final: false };
    if (ratio < 0.31) return { id: 'corner1', label: '第1コーナー〜第2コーナー', corner: true, final: false };
    if (ratio < 0.56) return { id: 'back', label: '向正面', corner: false, final: false };
    if (ratio < 0.72) return { id: 'corner3', label: '第3コーナー', corner: true, final: false };
    if (ratio < 0.84) return { id: 'corner4', label: '第4コーナー', corner: true, final: false };
    if (ratio < 0.985) return { id: 'final', label: '最後の直線', corner: false, final: true };
    return { id: 'goal', label: 'ゴールシーン', corner: false, final: true };
  }

  function baseTimeForDistance(distance) {
    const d = Number(distance) || 2400;
    if (BASE_TIME_BY_DISTANCE.has(d)) return BASE_TIME_BY_DISTANCE.get(d);
    const sorted = [...BASE_TIME_BY_DISTANCE.keys()].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i], b = sorted[i + 1];
      if (d >= a && d <= b) {
        const t = (d - a) / (b - a);
        return lerp(BASE_TIME_BY_DISTANCE.get(a), BASE_TIME_BY_DISTANCE.get(b), t);
      }
    }
    return d / 16.4;
  }

  function calcEntryScore(entry, raceConfig) {
    let score = safeNum(entry.baseScore, NaN);
    if (!Number.isFinite(score)) score = 68;

    const odds = safeNum(entry.odds, NaN);
    const pop = safeNum(entry.popularity, NaN);
    if (Number.isFinite(pop) && pop > 0) score += clamp(16 - pop * 0.85, -3, 15);
    if (Number.isFinite(odds) && odds > 0) score += clamp(14 - Math.log2(odds) * 3.2, -6, 13);

    if (Array.isArray(entry.recentResults) && entry.recentResults.length) {
      const recent = entry.recentResults.slice(0, 4).map(v => safeNum(v, 9));
      const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
      score += clamp(10 - avg * 1.25, -8, 9);
    }

    const distance = safeNum(raceConfig.distance, 2400);
    if (distance >= 2200) {
      if (entry.style === '差し' || entry.style === '追込') score += 1.4;
      if (entry.style === '逃げ') score -= 0.8;
    }
    if (raceConfig.condition === '重' || raceConfig.condition === '不良') {
      if (entry.style === '先行' || entry.style === '逃げ') score += 1.0;
      if (entry.style === '追込') score -= 0.8;
    }

    return clamp(score, 40, 105);
  }

  function normalizeRaceData(rawData) {
    const raw = rawData && typeof rawData === 'object' ? rawData : DEFAULT_RACE_DATA;
    const raceConfig = {
      raceId: raw.raceId || raw.id || 'race-v8',
      raceName: raw.raceName || raw.displayName || raw.name || '名称未設定レース',
      displayName: raw.displayName || raw.raceName || raw.name || '名称未設定レース',
      date: raw.date || '',
      venue: raw.venue || raw.track || '東京競馬場',
      raceNumber: raw.raceNumber || raw.raceNo || '',
      grade: raw.grade || '',
      surface: raw.surface || raw.trackType || '芝',
      distance: safeNum(raw.distance || raw.distanceMeters, 2400),
      condition: raw.condition || raw.going || '良',
      weather: raw.weather || '',
      fixedMarks: raw.fixedMarks || raw.simulationHints?.fixedMarks || {},
      sourceNote: raw.dataQuality?.note || raw.note || '',
    };

    const entriesRaw = Array.isArray(raw.entries) && raw.entries.length ? raw.entries : DEFAULT_RACE_DATA.entries;
    const entries = entriesRaw.slice(0, 18).map((entry, index) => {
      const number = safeNum(entry.number ?? entry.horseNumber ?? entry.gate ?? index + 1, index + 1);
      const waku = safeNum(entry.waku ?? entry.frame ?? Math.ceil(number / 2.25), Math.ceil(number / 2.25));
      const style = STYLE_LIST.includes(entry.style) ? entry.style : inferStyle(entry, index);
      const normalized = {
        id: `${number}-${entry.name || entry.horseName || `Horse ${number}`}`,
        number,
        gate: safeNum(entry.gate ?? number, number),
        waku: clamp(Math.round(waku), 1, 8),
        name: String(entry.name || entry.horseName || `Horse ${number}`),
        sexAge: entry.sexAge || '',
        weight: entry.weight ?? entry.carriedWeight ?? '',
        jockey: entry.jockey || entry.jockeyName || '',
        trainer: entry.trainer || '',
        odds: entry.odds != null ? safeNum(entry.odds, null) : null,
        popularity: entry.popularity != null ? safeNum(entry.popularity, null) : null,
        style,
        recentResults: Array.isArray(entry.recentResults) ? entry.recentResults : [],
        last3f: entry.last3f ?? null,
        realFinish: entry.realFinish ?? entry.finish ?? null,
        realTime: entry.realTime || null,
        dataConfidence: entry.dataConfidence || '',
        baseScore: entry.baseScore != null ? safeNum(entry.baseScore, NaN) : NaN,
        mark: '',
      };
      normalized.score = calcEntryScore(normalized, raceConfig);
      normalized.stamina = clamp(55 + normalized.score * 0.42 + styleStaminaBias(style), 52, 98);
      normalized.burst = clamp(48 + normalized.score * 0.45 + styleBurstBias(style), 45, 99);
      normalized.start = clamp(48 + normalized.score * 0.32 + styleStartBias(style), 42, 96);
      return normalized;
    });

    assignMarks(entries, raceConfig.fixedMarks);
    return { raceConfig, entries };
  }

  function inferStyle(entry, index) {
    const text = `${entry.name || ''} ${entry.memo || ''} ${entry.comment || ''}`;
    if (text.includes('逃')) return '逃げ';
    if (text.includes('追')) return '追込';
    if (text.includes('差')) return '差し';
    if (text.includes('先')) return '先行';
    return STYLE_LIST[index % STYLE_LIST.length];
  }

  function styleStaminaBias(style) {
    return { '逃げ': -2, '先行': 2, '差し': 5, '追込': 4, '自在': 3 }[style] ?? 0;
  }
  function styleBurstBias(style) {
    return { '逃げ': -1, '先行': 2, '差し': 8, '追込': 11, '自在': 5 }[style] ?? 0;
  }
  function styleStartBias(style) {
    return { '逃げ': 12, '先行': 8, '差し': 0, '追込': -7, '自在': 4 }[style] ?? 0;
  }

  function assignMarks(entries, fixedMarks = {}) {
    entries.forEach(e => { e.mark = ''; });
    const byNumber = new Map(entries.map(e => [Number(e.number), e]));
    const usedHorseIds = new Set();
    const usedMarks = new Set();

    for (const mark of MARK_ORDER) {
      const target = fixedMarks?.[mark];
      const num = Number(target);
      if (!Number.isFinite(num)) continue;
      const entry = byNumber.get(num);
      if (!entry || usedHorseIds.has(entry.id) || usedMarks.has(mark)) continue;
      entry.mark = mark;
      usedHorseIds.add(entry.id);
      usedMarks.add(mark);
    }

    const byScore = [...entries].sort((a, b) => b.score - a.score || a.number - b.number);
    const stable = [...entries].sort((a, b) => (
      (b.score + safeNum(b.stamina, 70) * 0.18 - Math.abs((safeNum(b.odds, 16) || 16) - 6) * 0.2) -
      (a.score + safeNum(a.stamina, 70) * 0.18 - Math.abs((safeNum(a.odds, 16) || 16) - 6) * 0.2)
    ));
    const hole = [...entries].sort((a, b) => (
      (b.score + Math.log2(safeNum(b.odds, 8) + 1) * 4 - safeNum(b.popularity, 9) * 0.15) -
      (a.score + Math.log2(safeNum(a.odds, 8) + 1) * 4 - safeNum(a.popularity, 9) * 0.15)
    ));
    const pools = { '◎': byScore, '○': byScore, '▲': byScore, '△': byScore, '★': stable, '☆': hole };

    for (const mark of MARK_ORDER) {
      if (usedMarks.has(mark)) continue;
      const pool = pools[mark] || byScore;
      const entry = pool.find(e => !usedHorseIds.has(e.id));
      if (!entry) continue;
      entry.mark = mark;
      usedMarks.add(mark);
      usedHorseIds.add(entry.id);
    }
  }

  class RaceRenderer {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.goalMode = Boolean(options.goalMode);
      this.W = 1;
      this.H = 1;
      this.dpr = 1;
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      this.W = Math.max(1, Math.floor(rect.width || this.canvas.parentElement?.clientWidth || 600));
      this.H = Math.max(1, Math.floor(rect.height || this.canvas.parentElement?.clientHeight || 650));
      this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      this.canvas.width = Math.round(this.W * this.dpr);
      this.canvas.height = Math.round(this.H * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.railMargin = Math.max(24, this.W * 0.065);
      this.trackW = Math.max(1, this.W - this.railMargin * 2);
      this.laneCount = 18;
      this.laneW = this.trackW / this.laneCount;
      this.horseW = clamp(this.laneW * 0.64, 9, 24);
      this.horseH = this.horseW * 2.3;
    }

    laneToX(lane) {
      // Lane 1 is treated as the inner rail on the right, matching the source-like vertical board layout.
      return this.W - this.railMargin - (clamp(lane, 1, this.laneCount) - 0.5) * this.laneW;
    }

    progressToY(progress) {
      const top = this.goalMode ? this.H * 0.105 : 24;
      const bottom = this.goalMode ? this.H - 34 : this.H - 35;
      return bottom - clamp(progress, -0.08, 1.12) * (bottom - top);
    }

    draw(payload) {
      const ctx = this.ctx;
      const phase = payload.phase || { label: 'スタート前' };
      const horses = payload.horses || [];
      const raceConfig = payload.raceConfig || {};
      ctx.clearRect(0, 0, this.W, this.H);
      this.drawBackground(raceConfig);
      this.drawLanes(phase);
      this.drawRails();
      if (this.goalMode) {
        this.drawGoalLine();
      } else {
        this.drawStartGate(payload.gateOpen ?? 0, payload.gateVisible ?? false, horses.length || 18);
      }
      this.drawPhaseLabel(phase.label || '');
      this.drawHorses(horses, payload);
      if (!this.goalMode) this.drawDistanceMarker(payload.leaderMeters || 0, raceConfig.distance || 2400);
    }

    drawBackground(raceConfig) {
      const ctx = this.ctx;
      const isDirt = raceConfig.surface === 'ダート';
      const condition = raceConfig.condition || '良';
      const wet = condition === '重' ? 0.12 : condition === '不良' ? 0.20 : condition === '稍重' ? 0.06 : 0;
      const grad = ctx.createLinearGradient(0, this.H, 0, 0);
      if (isDirt) {
        grad.addColorStop(0, `rgb(${58 - wet * 35}, ${43 - wet * 20}, ${27 - wet * 10})`);
        grad.addColorStop(1, `rgb(${88 - wet * 40}, ${63 - wet * 20}, ${38 - wet * 10})`);
      } else {
        grad.addColorStop(0, `rgb(${9 - wet * 10}, ${62 - wet * 25}, ${24 - wet * 8})`);
        grad.addColorStop(1, `rgb(${17 - wet * 8}, ${96 - wet * 32}, ${35 - wet * 10})`);
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.W, this.H);

      ctx.save();
      ctx.globalAlpha = isDirt ? 0.12 : 0.09;
      for (let y = -40; y < this.H + 40; y += 38) {
        ctx.fillStyle = y % 76 === 0 ? 'rgba(255,255,255,.13)' : 'rgba(0,0,0,.16)';
        ctx.fillRect(this.railMargin, y, this.trackW, 16);
      }
      ctx.restore();
    }

    drawLanes(phase) {
      const ctx = this.ctx;
      for (let lane = 1; lane <= this.laneCount; lane++) {
        const x = this.laneToX(lane) - this.laneW / 2;
        if (phase.corner && lane >= 12) {
          ctx.fillStyle = `rgba(245,200,76,${0.018 * (lane - 11)})`;
          ctx.fillRect(x, 0, this.laneW, this.H);
        }
        if (lane < this.laneCount) {
          const boundaryX = x;
          ctx.strokeStyle = 'rgba(255,255,255,0.10)';
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 8]);
          ctx.beginPath();
          ctx.moveTo(boundaryX, 0);
          ctx.lineTo(boundaryX, this.H);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }

    drawRails() {
      const ctx = this.ctx;
      const railXs = [this.railMargin - 2, this.W - this.railMargin + 2];
      for (const x of railXs) {
        ctx.strokeStyle = 'rgba(255,255,255,0.82)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.H);
        ctx.stroke();

        const sign = x < this.W / 2 ? -1 : 1;
        for (let y = 8; y < this.H; y += 46) {
          ctx.fillStyle = 'rgba(9, 33, 15, .95)';
          ctx.fillRect(x + sign * 8 - 2.5, y, 5, 13);
        }
      }
    }

    drawGoalLine() {
      const ctx = this.ctx;
      const y = this.progressToY(1);
      ctx.save();
      ctx.strokeStyle = 'rgba(80, 170, 255, .98)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(this.railMargin, y);
      ctx.lineTo(this.W - this.railMargin, y);
      ctx.stroke();
      ctx.fillStyle = 'rgba(80,170,255,.20)';
      ctx.fillRect(this.railMargin, y - 4, this.trackW, 8);
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.font = '900 12px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GOAL', this.W / 2, y - 10);
      ctx.restore();
    }

    drawStartGate(open, visible, horseCount) {
      if (!visible) return;
      const ctx = this.ctx;
      const total = Math.max(1, Math.min(18, horseCount || 18));
      const gateH = Math.max(36, this.H * 0.075);
      const gateY = this.H - 1 + clamp(open, 0, 1) * gateH * 1.25;
      const cellW = Math.max(this.laneW * 0.70, 16);
      ctx.save();
      ctx.globalAlpha = 1 - clamp(open, 0, 1) * 0.72;
      for (let i = 1; i <= total; i++) {
        const lane = this.gateToLane(i, total);
        const cx = this.laneToX(lane);
        const x = cx - cellW / 2;
        const y = gateY - gateH;
        ctx.fillStyle = '#8798a4';
        ctx.fillRect(x, y, cellW, gateH);
        ctx.strokeStyle = 'rgba(8,15,18,.65)';
        ctx.strokeRect(x, y, cellW, gateH);
        ctx.fillStyle = `rgba(35, 58, 68, ${0.42 * (1 - open)})`;
        ctx.fillRect(x + cellW * .12, y + 5, cellW * .76, gateH * .60);
        ctx.fillStyle = '#d2ac44';
        this.roundRect(ctx, x + cellW * .22, y - 15, cellW * .56, 12, 3);
        ctx.fill();
        ctx.fillStyle = '#1c252b';
        ctx.font = `900 ${Math.max(8, cellW * .22)}px ui-monospace, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i), cx, y - 9);
      }
      ctx.restore();
    }

    gateToLane(gate, total) {
      if (total <= 1) return 1;
      const minLane = 1.2;
      const maxLane = 17.2;
      const t = (gate - 1) / (total - 1);
      return minLane + t * (maxLane - minLane);
    }

    drawPhaseLabel(text) {
      if (!text) return;
      const ctx = this.ctx;
      const fontPx = clamp(this.W * 0.072, 28, 60);
      ctx.save();
      ctx.font = `900 ${fontPx}px "Courier New", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,.30)';
      ctx.lineWidth = Math.max(3, fontPx * 0.08);
      ctx.globalAlpha = 0.82;
      ctx.strokeText(text, this.W / 2, this.H / 2);
      ctx.fillStyle = 'rgba(255,255,255,.50)';
      ctx.fillText(text, this.W / 2, this.H / 2);
      ctx.restore();
    }

    drawDistanceMarker(leaderMeters, distance) {
      const ctx = this.ctx;
      const remain = Math.max(0, distance - leaderMeters);
      if (remain > 1000 || remain <= 0) return;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,.34)';
      this.roundRect(ctx, this.W / 2 - 54, 14, 108, 28, 14);
      ctx.fill();
      ctx.fillStyle = remain <= 300 ? '#ffe083' : '#dfffe7';
      ctx.font = '900 13px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`残り${Math.round(remain)}m`, this.W / 2, 28);
      ctx.restore();
    }

    drawHorses(horses, payload) {
      const visual = horses.map(h => {
        const progress = this.goalMode
          ? safeNum(h.goalProgress, 0)
          : clamp(safeNum(h.meters, 0) / Math.max(1, safeNum(payload.raceConfig?.distance, 2400)), -0.02, 1.02);
        return {
          horse: h,
          x: this.laneToX(safeNum(h.lane, h.gate || h.number || 1)),
          y: this.progressToY(progress),
          lane: safeNum(h.lane, 1),
          progress,
        };
      }).sort((a, b) => b.progress - a.progress || a.horse.number - b.horse.number);

      const placed = [];
      for (const item of visual) {
        let y = item.y;
        for (const prev of placed) {
          if (Math.abs(prev.lane - item.lane) < 0.72 && Math.abs(prev.y - y) < this.horseH * 0.78) {
            y = prev.y + this.horseH * 0.82;
          }
        }
        item.y = y;
        placed.push(item);
      }

      const drawOrder = placed.sort((a, b) => a.y - b.y);
      for (const item of drawOrder) this.drawHorse(item.horse, item.x, item.y);
    }

    drawHorse(horse, cx, cy) {
      if (!Number.isFinite(cx) || !Number.isFinite(cy)) return;
      const ctx = this.ctx;
      const cw = this.horseW;
      const ch = this.horseH;
      const color = WAKU_COLORS[horse.waku] || '#ddd';
      const textColor = WAKU_TEXT[horse.waku] || '#111';
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.42)';
      ctx.shadowBlur = 5;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(cx, cy + ch * 0.05, cw * 0.47, ch * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx, cy - ch * 0.36, cw * 0.30, ch * 0.11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(0,0,0,.42)';
      ctx.lineWidth = Math.max(1, cw * .09);
      ctx.beginPath();
      ctx.moveTo(cx - cw * .22, cy - ch * .10); ctx.lineTo(cx - cw * .35, cy + ch * .22);
      ctx.moveTo(cx + cw * .22, cy - ch * .10); ctx.lineTo(cx + cw * .35, cy + ch * .22);
      ctx.moveTo(cx - cw * .18, cy + ch * .17); ctx.lineTo(cx - cw * .29, cy + ch * .43);
      ctx.moveTo(cx + cw * .18, cy + ch * .17); ctx.lineTo(cx + cw * .29, cy + ch * .43);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.44)';
      ctx.lineWidth = Math.max(1, cw * .07);
      ctx.beginPath();
      ctx.ellipse(cx, cy + ch * 0.05, cw * 0.47, ch * 0.36, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = textColor;
      ctx.font = `900 ${Math.max(8, cw * .58)}px ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(horse.number), cx, cy + ch * 0.03);
      if (horse.mark) {
        ctx.fillStyle = '#ffe083';
        ctx.font = `900 ${Math.max(10, cw * .72)}px serif`;
        ctx.fillText(horse.mark, cx, cy - ch * .64);
      }
      ctx.restore();
    }

    roundRect(ctx, x, y, w, h, r) {
      const rr = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
    }
  }

  class RaceSimulation {
    constructor(entries, raceConfig, settings = {}, seed = nowSeed()) {
      this.entries = entries.map(e => ({ ...e }));
      this.raceConfig = { ...raceConfig };
      this.settings = { timeScale: 10.5, chaos: 0.38, block: 0.62, goalStartMeters: 300, startDelayMs: 1850, ...settings };
      this.seed = seed;
      this.rng = createRng(seed);
      this.distance = safeNum(this.raceConfig.distance, 2400);
      this.baseTime = baseTimeForDistance(this.distance);
      this.baseMps = this.distance / this.baseTime;
      this.elapsedMs = 0;
      this.finished = false;
      this.goalSceneStarted = false;
      this.finishOrder = [];
      this.eventLogQueue = [];
      this.lastPhaseId = 'before';
      this.lastLeaderMilestone = 0;
      this.horses = this.entries.map((entry, i) => this.createHorseState(entry, i));
    }

    createHorseState(entry, index) {
      const rng = createRng(`${this.seed}:${entry.number}:${entry.name}`);
      const gateLane = this.gateToLane(entry.gate || entry.number || index + 1, this.entries.length);
      const ability = clamp((safeNum(entry.score, 70) - 45) / 55, 0, 1.15);
      return {
        ...entry,
        index,
        lane: gateLane,
        targetLane: gateLane,
        meters: -index * 0.08,
        speed: 0,
        staminaLeft: clamp(safeNum(entry.stamina, 75) / 100, 0.52, 1.0),
        ability,
        formNoise: (rng() - 0.5) * (0.045 + this.settings.chaos * 0.035),
        rhythm: rng() * Math.PI * 2,
        laneCooldown: 0,
        blockLevel: 0,
        finished: false,
        finishMs: null,
        finalSeconds: null,
        goalProgress: 0,
      };
    }

    gateToLane(gate, total) {
      if (total <= 1) return 1;
      const minLane = 1.2, maxLane = 17.2;
      return minLane + ((gate - 1) / (total - 1)) * (maxLane - minLane);
    }

    tick(realDtMs) {
      if (this.finished) return this.snapshot();
      const dtMs = clamp(realDtMs, 10, 120);
      this.elapsedMs += dtMs;
      const gameDt = (dtMs / 1000) * this.settings.timeScale;
      const leader = this.getLeader();
      const leaderRatio = clamp((leader?.meters || 0) / this.distance, 0, 1);
      const phase = getPhaseForRatio(leaderRatio);
      this.handlePhaseLog(phase, leaderRatio);

      const sortedByPosition = [...this.horses].sort((a, b) => b.meters - a.meters);
      for (const horse of sortedByPosition) {
        if (horse.finished) continue;
        this.updateHorse(horse, gameDt, phase, sortedByPosition);
      }

      this.resolveFinishes();
      const newLeader = this.getLeader();
      if (!this.goalSceneStarted && newLeader && newLeader.meters >= this.distance - this.settings.goalStartMeters) {
        this.goalSceneStarted = true;
        this.eventLogQueue.push({ type: 'scene', text: 'ゴールシーンへ移行。最後の直線に入ります。' });
      }
      if (this.finishOrder.length >= this.horses.length) {
        this.finished = true;
        this.eventLogQueue.push({ type: 'scene', text: '全馬入線。レースが確定しました。' });
      }
      return this.snapshot();
    }

    updateHorse(horse, gameDt, phase, allHorses) {
      const ratio = clamp(horse.meters / this.distance, 0, 1);
      horse.laneCooldown = Math.max(0, horse.laneCooldown - gameDt);
      const blockInfo = this.detectBlock(horse, allHorses, phase);
      horse.blockLevel = lerp(horse.blockLevel || 0, blockInfo.level, 0.28);
      const targetLane = this.decideTargetLane(horse, phase, blockInfo);
      horse.targetLane = targetLane;

      const laneChangeRate = phase.final ? 1.15 : phase.corner ? 0.48 : 0.74;
      horse.lane = lerp(horse.lane, horse.targetLane, clamp(gameDt * laneChangeRate / 10, 0.015, 0.18));

      const startDelayMs = safeNum(this.settings.startDelayMs, 1850);
      if (this.elapsedMs < startDelayMs) {
        horse.speed = 0;
        horse.goalProgress = -0.03;
        return;
      }
      const startEase = clamp((this.elapsedMs - startDelayMs) / 2200, 0, 1);
      const abilityMult = 0.925 + horse.ability * 0.155;
      const styleMult = this.stylePhaseMultiplier(horse.style, ratio, horse.staminaLeft);
      const staminaMult = horse.staminaLeft > 0.36 ? 1 : clamp(0.73 + horse.staminaLeft * 0.72, 0.72, 1);
      const blockMult = 1 - horse.blockLevel * (0.12 + this.settings.block * 0.16);
      const laneLoss = 1 - Math.max(0, horse.lane - 12) * 0.0035 - (phase.corner ? Math.max(0, horse.lane - 9) * 0.006 : 0);
      const pulse = Math.sin(this.elapsedMs / 520 + horse.rhythm) * (0.006 + this.settings.chaos * 0.006);
      const speedTarget = this.baseMps * abilityMult * styleMult * staminaMult * blockMult * laneLoss * (1 + horse.formNoise + pulse) * lerp(0.06, 1, easeInOut(startEase));

      horse.speed = lerp(horse.speed || speedTarget * 0.7, speedTarget, clamp(gameDt / 8, 0.04, 0.38));
      horse.meters += Math.max(0.5, horse.speed) * gameDt;

      const effort = clamp((horse.speed / this.baseMps - 0.82), 0, 0.45);
      const frontCost = horse.style === '逃げ' && this.rankOfHorse(horse) <= 3 ? 0.00036 : 0;
      const outsideCost = Math.max(0, horse.lane - 10) * 0.000045;
      const fieldCost = phase.corner ? 0.00018 : phase.final ? 0.00026 : 0.00013;
      horse.staminaLeft = clamp(horse.staminaLeft - gameDt * (fieldCost + effort * 0.00035 + outsideCost + frontCost), 0.02, 1);

      const goalStart = this.distance - this.settings.goalStartMeters;
      horse.goalProgress = clamp((horse.meters - goalStart) / (this.settings.goalStartMeters + 42), -0.03, 1.16);
    }

    stylePhaseMultiplier(style, ratio, staminaLeft) {
      const finalKick = ratio >= 0.82 ? clamp((ratio - 0.82) / 0.18, 0, 1) : 0;
      const mid = ratio >= 0.35 && ratio < 0.76 ? 1 : 0;
      const early = ratio < 0.22 ? 1 : 0;
      const tired = staminaLeft < 0.28 ? (0.28 - staminaLeft) * 0.45 : 0;
      switch (style) {
        case '逃げ': return 1 + early * 0.075 + mid * 0.022 - finalKick * (0.035 + tired);
        case '先行': return 1 + early * 0.045 + mid * 0.020 + finalKick * 0.014 - tired * 0.45;
        case '差し': return 1 - early * 0.045 + mid * 0.002 + finalKick * 0.090 - tired * 0.30;
        case '追込': return 1 - early * 0.082 - mid * 0.008 + finalKick * 0.132 - tired * 0.26;
        case '自在': return 1 + early * 0.015 + mid * 0.010 + finalKick * 0.052 - tired * 0.34;
        default: return 1;
      }
    }

    detectBlock(horse, allHorses, phase) {
      let level = 0;
      let side = 0;
      for (const other of allHorses) {
        if (other.id === horse.id || other.finished) continue;
        const ahead = other.meters - horse.meters;
        if (ahead <= 0 || ahead > (phase.final ? 13.5 : 10.5)) continue;
        const laneGap = Math.abs(other.lane - horse.lane);
        if (laneGap > 0.72) continue;
        const proximity = (1 - ahead / (phase.final ? 13.5 : 10.5)) * (1 - laneGap / 0.72);
        if (proximity > level) {
          level = proximity;
          side = other.lane <= horse.lane ? 1 : -1;
        }
      }
      return { level: clamp(level, 0, 1), side };
    }

    decideTargetLane(horse, phase, blockInfo) {
      const ratio = clamp(horse.meters / this.distance, 0, 1);
      const gateLane = this.gateToLane(horse.gate || horse.number, this.entries.length);
      let target = gateLane;
      const inner = 2.2;
      const middle = 8.4;
      const outer = 13.4;
      const rank = this.rankOfHorse(horse);

      if (phase.id === 'start' || ratio < 0.045) {
        target = gateLane;
      } else if (phase.corner) {
        if (horse.style === '逃げ') target = clamp(1.8 + rank * 0.28, 1.4, 5.0);
        else if (horse.style === '先行') target = clamp(3.5 + rank * 0.25, 2.5, 8.0);
        else if (horse.style === '差し') target = clamp(7.0 + rank * 0.22, 5.0, 12.5);
        else if (horse.style === '追込') target = clamp(10.0 + rank * 0.18, 8.0, 15.8);
        else target = clamp(middle + (rank - 9) * 0.12, 4, 13);
      } else if (phase.final) {
        if (horse.style === '逃げ') target = clamp(inner + rank * 0.18, 1.5, 7.5);
        else if (horse.style === '先行') target = clamp(5.0 + rank * 0.22, 3.0, 11.0);
        else if (horse.style === '差し') target = clamp(outer + (rank - 9) * 0.10, 8.5, 16.5);
        else if (horse.style === '追込') target = clamp(14.0 + (rank - 12) * 0.10, 10.5, 17.3);
        else target = clamp(9.0 + (rank - 9) * 0.16, 4.5, 16.2);
      } else {
        if (horse.style === '逃げ') target = clamp(2.2 + rank * 0.30, 1.8, 6.5);
        else if (horse.style === '先行') target = clamp(4.4 + rank * 0.25, 3.0, 9.0);
        else if (horse.style === '差し') target = clamp(8.2 + rank * 0.18, 6.0, 13.8);
        else if (horse.style === '追込') target = clamp(11.2 + rank * 0.16, 8.5, 16.8);
        else target = clamp(middle + (rank - 9) * 0.10, 4, 15);
      }

      if (blockInfo.level > 0.22 && horse.laneCooldown <= 0) {
        const outward = blockInfo.side >= 0 ? 1 : -1;
        const strength = phase.final ? 2.0 : 1.15;
        target = clamp(target + outward * strength * (0.7 + blockInfo.level), 1.2, 17.5);
        horse.laneCooldown = phase.final ? 1.0 : 1.6;
        if (phase.final && blockInfo.level > 0.68 && Math.random() < 0.02) {
          this.eventLogQueue.push({ type: 'hot', text: `${horse.name}、前が詰まり外へ持ち出す。` });
        }
      }
      return target;
    }

    rankOfHorse(horse) {
      const sorted = [...this.horses].sort((a, b) => b.meters - a.meters || b.speed - a.speed);
      return sorted.findIndex(h => h.id === horse.id) + 1;
    }

    resolveFinishes() {
      const justFinished = this.horses
        .filter(h => !h.finished && h.meters >= this.distance)
        .sort((a, b) => b.meters - a.meters || b.speed - a.speed);
      for (const horse of justFinished) {
        horse.finished = true;
        horse.finishMs = this.elapsedMs;
        const rawSec = this.baseTime + (horse.finishMs / 1000 - this.baseTime / this.settings.timeScale) * 0.08;
        const leaderSec = this.finishOrder[0]?.finalSeconds;
        horse.finalSeconds = this.finishOrder.length === 0
          ? this.baseTime + (this.rng() - 0.5) * 0.25
          : Math.max((leaderSec || this.baseTime) + this.finishOrder.length * 0.08 + this.rng() * 0.08, rawSec);
        this.finishOrder.push(horse);
        this.eventLogQueue.push({ type: 'finish', text: `${this.finishOrder.length}着 ${horse.number}番 ${horse.name} 入線。` });
      }
    }

    handlePhaseLog(phase, leaderRatio) {
      if (phase.id !== this.lastPhaseId) {
        this.lastPhaseId = phase.id;
        this.eventLogQueue.push({ type: 'scene', text: `【${phase.label}】` });
      }
      const milestone = Math.floor(leaderRatio * 10);
      if (milestone > this.lastLeaderMilestone && milestone >= 2 && milestone <= 8) {
        this.lastLeaderMilestone = milestone;
        const leader = this.getLeader();
        const leaderName = leader ? `${leader.number}番 ${leader.name}` : '先頭馬';
        this.eventLogQueue.push({ type: 'hot', text: `${leaderName}が先頭。隊列が少しずつ動き始めました。` });
      }
    }

    getLeader() {
      return [...this.horses].sort((a, b) => b.meters - a.meters || b.speed - a.speed)[0] || null;
    }

    snapshot() {
      const leader = this.getLeader();
      const leaderRatio = clamp((leader?.meters || 0) / this.distance, 0, 1);
      const phase = this.goalSceneStarted ? { ...getPhaseForRatio(leaderRatio), label: 'ゴールシーン' } : getPhaseForRatio(leaderRatio);
      const events = this.eventLogQueue.splice(0);
      return {
        elapsedMs: this.elapsedMs,
        raceConfig: this.raceConfig,
        horses: this.horses.map(h => ({ ...h })),
        finishOrder: this.finishOrder.map(h => ({ ...h })),
        leaderMeters: Math.max(0, leader?.meters || 0),
        phase,
        events,
        finished: this.finished,
        goalSceneStarted: this.goalSceneStarted,
        gateOpen: clamp((this.elapsedMs - safeNum(this.settings.startDelayMs, 1850)) / 1350, 0, 1),
        gateVisible: this.elapsedMs < safeNum(this.settings.startDelayMs, 1850) + 3000,
      };
    }
  }

  class RaceApp {
    constructor() {
      this.dom = {
        raceCanvas: $('#raceCanvas'), goalCanvas: $('#goalCanvas'), goalScene: $('#goalScene'),
        entryTableBody: $('#entryTableBody'), resultTableBody: $('#resultTableBody'), statsTableBody: $('#statsTableBody'),
        raceNameLabel: $('#raceNameLabel'), raceConditionLabel: $('#raceConditionLabel'), raceSubTitle: $('#raceSubTitle'),
        engineStatusLabel: $('#engineStatusLabel'), buildBadge: $('#buildBadge'), entryCountLabel: $('#entryCountLabel'), finishCountLabel: $('#finishCountLabel'),
        phaseChip: $('#phaseChip'), progressText: $('#progressText'), raceLog: $('#raceLog'), goalMiniList: $('#goalMiniList'), goalScenePhase: $('#goalScenePhase'),
        startRaceBtn: $('#startRaceBtn'), pauseRaceBtn: $('#pauseRaceBtn'), resetRaceBtn: $('#resetRaceBtn'), clearLogBtn: $('#clearLogBtn'),
        speedSelect: $('#speedSelect'), chaosRange: $('#chaosRange'), chaosLabel: $('#chaosLabel'), blockRange: $('#blockRange'), blockLabel: $('#blockLabel'), goalStartSelect: $('#goalStartSelect'),
        raceNameInput: $('#raceNameInput'), venueInput: $('#venueInput'), distanceInput: $('#distanceInput'), surfaceInput: $('#surfaceInput'), conditionInput: $('#conditionInput'), applyRaceMetaBtn: $('#applyRaceMetaBtn'),
        loadDerbyBtn: $('#loadDerbyBtn'), jsonFileInput: $('#jsonFileInput'), jsonPasteArea: $('#jsonPasteArea'), applyJsonBtn: $('#applyJsonBtn'),
        sim100Btn: $('#sim100Btn'), sim1000Btn: $('#sim1000Btn'), statsStatus: $('#statsStatus'), countdownOverlay: $('#countdownOverlay'),
      };
      this.renderer = new RaceRenderer(this.dom.raceCanvas);
      this.goalRenderer = new RaceRenderer(this.dom.goalCanvas, { goalMode: true });
      const normalized = normalizeRaceData(DEFAULT_RACE_DATA);
      this.raceConfig = normalized.raceConfig;
      this.entries = normalized.entries;
      this.settings = this.readSettings();
      this.sim = null;
      this.lastSnapshot = null;
      this.running = false;
      this.paused = false;
      this.rafId = null;
      this.lastTs = null;
      this.stats = null;
      this.init();
    }

    init() {
      this.dom.buildBadge.textContent = `BUILD ${BUILD_VERSION}`;
      this.bindEvents();
      this.syncFormFromConfig();
      this.renderAll();
      this.appendLog('scene', 'V8エンジンを初期化しました。レース開始を押してください。');
    }

    bindEvents() {
      this.dom.startRaceBtn.addEventListener('click', () => this.startRace());
      this.dom.pauseRaceBtn.addEventListener('click', () => this.togglePause());
      this.dom.resetRaceBtn.addEventListener('click', () => this.resetRace());
      this.dom.clearLogBtn.addEventListener('click', () => { this.dom.raceLog.innerHTML = ''; });
      this.dom.speedSelect.addEventListener('change', () => { this.settings = this.readSettings(); });
      this.dom.chaosRange.addEventListener('input', () => { this.dom.chaosLabel.textContent = this.dom.chaosRange.value; this.settings = this.readSettings(); });
      this.dom.blockRange.addEventListener('input', () => { this.dom.blockLabel.textContent = this.dom.blockRange.value; this.settings = this.readSettings(); });
      this.dom.goalStartSelect.addEventListener('change', () => { this.settings = this.readSettings(); });
      this.dom.applyRaceMetaBtn.addEventListener('click', () => this.applyRaceMeta());
      this.dom.loadDerbyBtn.addEventListener('click', () => this.loadDerbyJson());
      this.dom.applyJsonBtn.addEventListener('click', () => this.applyPastedJson());
      this.dom.jsonFileInput.addEventListener('change', (e) => this.loadFileJson(e));
      this.dom.sim100Btn.addEventListener('click', () => this.runStats(100));
      this.dom.sim1000Btn.addEventListener('click', () => this.runStats(1000));
      $$('.tab-button').forEach(btn => btn.addEventListener('click', () => this.openPanel(btn.dataset.panel)));
      $$('.close-panel-btn').forEach(btn => btn.addEventListener('click', () => this.closePanels()));
      $$('.drawer-panel').forEach(panel => panel.addEventListener('click', (e) => { if (e.target === panel) this.closePanels(); }));
      window.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.closePanels(); });
    }

    readSettings() {
      return {
        timeScale: safeNum(this.dom.speedSelect?.value, 10.5),
        chaos: safeNum(this.dom.chaosRange?.value, 38) / 100,
        block: safeNum(this.dom.blockRange?.value, 62) / 100,
        goalStartMeters: safeNum(this.dom.goalStartSelect?.value, 300),
      };
    }

    openPanel(id) {
      this.closePanels();
      const panel = document.getElementById(id);
      if (panel) panel.hidden = false;
    }

    closePanels() {
      $$('.drawer-panel').forEach(panel => { panel.hidden = true; });
    }

    syncFormFromConfig() {
      this.dom.raceNameInput.value = this.raceConfig.raceName || '';
      this.dom.venueInput.value = this.raceConfig.venue || '';
      this.dom.distanceInput.value = this.raceConfig.distance || 2400;
      this.dom.surfaceInput.value = this.raceConfig.surface || '芝';
      this.dom.conditionInput.value = this.raceConfig.condition || '良';
    }

    applyRaceMeta() {
      this.raceConfig = {
        ...this.raceConfig,
        raceName: this.dom.raceNameInput.value.trim() || '名称未設定レース',
        displayName: this.dom.raceNameInput.value.trim() || '名称未設定レース',
        venue: this.dom.venueInput.value.trim() || '東京競馬場',
        distance: safeNum(this.dom.distanceInput.value, 2400),
        surface: this.dom.surfaceInput.value || '芝',
        condition: this.dom.conditionInput.value || '良',
      };
      this.entries.forEach(e => { e.score = calcEntryScore(e, this.raceConfig); });
      assignMarks(this.entries, this.raceConfig.fixedMarks || {});
      this.resetRace(false);
      this.renderAll();
      this.appendLog('scene', '基本設定を反映しました。');
    }

    async loadDerbyJson() {
      const candidates = ['race_data_derby_2025_v8.json', 'race_data_derby_2025.json'];
      for (const url of candidates) {
        try {
          const res = await fetch(`${url}?v=${Date.now()}`, { cache: 'no-store' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          this.applyRaceData(data, `${url} を読み込みました。`);
          return;
        } catch (err) {
          // Try next candidate.
        }
      }
      this.appendLog('hot', '日本ダービーJSONが見つかりません。race_data_derby_2025_v8.json または race_data_derby_2025.json を同じ階層に置いてください。');
    }

    loadFileJson(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(String(reader.result || ''));
          this.applyRaceData(data, `${file.name} を読み込みました。`);
        } catch (err) {
          this.appendLog('hot', `JSON読み込み失敗: ${err.message}`);
        }
      };
      reader.readAsText(file, 'utf-8');
    }

    applyPastedJson() {
      try {
        const text = this.dom.jsonPasteArea.value.trim();
        if (!text) throw new Error('JSONが空です');
        const data = JSON.parse(text);
        this.applyRaceData(data, '貼り付けJSONを反映しました。');
      } catch (err) {
        this.appendLog('hot', `JSON反映失敗: ${err.message}`);
      }
    }

    applyRaceData(data, message) {
      const normalized = normalizeRaceData(data);
      this.raceConfig = normalized.raceConfig;
      this.entries = normalized.entries;
      this.syncFormFromConfig();
      this.resetRace(false);
      this.renderAll();
      this.closePanels();
      this.appendLog('scene', message || '実データを反映しました。');
      if (this.raceConfig.sourceNote) this.appendLog('hot', this.raceConfig.sourceNote);
    }

    startRace() {
      if (this.running && this.paused) {
        this.togglePause(false);
        return;
      }
      if (this.running) return;
      this.settings = this.readSettings();
      this.sim = new RaceSimulation(this.entries, this.raceConfig, this.settings, nowSeed());
      this.running = true;
      this.paused = false;
      this.lastTs = null;
      this.lastSnapshot = this.sim.snapshot();
      this.dom.goalScene.classList.remove('is-active');
      this.dom.goalMiniList.innerHTML = '';
      this.dom.resultTableBody.innerHTML = '';
      this.dom.finishCountLabel.textContent = `0/${this.entries.length}`;
      this.dom.startRaceBtn.disabled = true;
      this.dom.pauseRaceBtn.disabled = false;
      this.dom.pauseRaceBtn.textContent = '一時停止';
      this.dom.engineStatusLabel.textContent = 'レース中';
      this.dom.raceLog.innerHTML = '';
      this.appendLog('scene', '各馬ゲートイン。スタートを待ちます。');
      this.showCountdown();
      this.rafId = requestAnimationFrame(ts => this.loop(ts));
    }

    showCountdown() {
      const el = this.dom.countdownOverlay;
      if (!el) return;
      const items = ['3', '2', '1', 'START'];
      el.hidden = false;
      let idx = 0;
      const step = () => {
        if (!this.running || idx >= items.length) {
          el.hidden = true;
          return;
        }
        el.textContent = items[idx++];
        setTimeout(step, idx === items.length ? 600 : 520);
      };
      step();
    }

    loop(ts) {
      if (!this.running) return;
      if (this.paused) {
        this.lastTs = ts;
        this.rafId = requestAnimationFrame(t => this.loop(t));
        return;
      }
      if (!this.lastTs) this.lastTs = ts;
      const dt = ts - this.lastTs;
      this.lastTs = ts;
      const snap = this.sim.tick(dt);
      this.lastSnapshot = snap;
      this.renderRaceSnapshot(snap);
      if (snap.finished) {
        this.running = false;
        this.dom.startRaceBtn.disabled = false;
        this.dom.pauseRaceBtn.disabled = true;
        this.dom.engineStatusLabel.textContent = '確定';
        this.appendLog('finish', 'レース終了。着順が確定しました。');
        this.renderStatsFromLastRace(snap.finishOrder);
        return;
      }
      this.rafId = requestAnimationFrame(t => this.loop(t));
    }

    togglePause(forceState = null) {
      if (!this.running) return;
      this.paused = forceState == null ? !this.paused : !forceState;
      if (forceState === false) this.paused = false;
      this.dom.pauseRaceBtn.textContent = this.paused ? '再開' : '一時停止';
      this.dom.engineStatusLabel.textContent = this.paused ? '一時停止' : 'レース中';
    }

    resetRace(clearLog = true) {
      this.running = false;
      this.paused = false;
      if (this.rafId) cancelAnimationFrame(this.rafId);
      this.rafId = null;
      this.sim = null;
      this.lastSnapshot = null;
      this.dom.goalScene.classList.remove('is-active');
      this.dom.goalMiniList.innerHTML = '';
      this.dom.resultTableBody.innerHTML = '';
      this.dom.finishCountLabel.textContent = `0/${this.entries.length}`;
      this.dom.startRaceBtn.disabled = false;
      this.dom.pauseRaceBtn.disabled = true;
      this.dom.pauseRaceBtn.textContent = '一時停止';
      this.dom.engineStatusLabel.textContent = '待機中';
      if (clearLog) {
        this.dom.raceLog.innerHTML = '';
        this.appendLog('scene', 'リセットしました。');
      }
      this.renderAll();
    }

    renderRaceSnapshot(snap) {
      this.renderer.resize();
      this.goalRenderer.resize();
      this.renderer.draw(snap);
      this.dom.phaseChip.textContent = snap.phase.label;
      this.dom.progressText.textContent = `${Math.round(Math.min(snap.leaderMeters, this.raceConfig.distance))}m / ${this.raceConfig.distance}m`;
      this.dom.engineStatusLabel.textContent = snap.goalSceneStarted ? 'ゴールシーン' : 'レース中';
      if (snap.goalSceneStarted) {
        this.dom.goalScene.classList.add('is-active');
        this.dom.goalScenePhase.textContent = snap.phase.label;
        this.goalRenderer.draw({ ...snap, horses: snap.horses, phase: { ...snap.phase, label: 'ゴールシーン' } });
      }
      for (const ev of snap.events) this.appendLog(ev.type, ev.text);
      this.renderResultTable(snap.finishOrder);
      this.renderGoalMiniList(snap.finishOrder);
    }

    renderAll() {
      this.renderRaceMeta();
      this.renderEntryTable();
      this.renderIdleCanvas();
      this.renderResultTable([]);
      this.renderStatsPlaceholder();
    }

    renderRaceMeta() {
      this.dom.raceNameLabel.textContent = this.raceConfig.displayName || this.raceConfig.raceName;
      const grade = this.raceConfig.grade ? ` ${this.raceConfig.grade}` : '';
      this.dom.raceConditionLabel.textContent = `${this.raceConfig.venue}${grade} / ${this.raceConfig.surface}${this.raceConfig.distance}m / ${this.raceConfig.condition}`;
      this.dom.raceSubTitle.textContent = `${this.raceConfig.date || '日付未設定'} ${this.raceConfig.venue} ${this.raceConfig.raceNumber ? this.raceConfig.raceNumber + 'R' : ''}`.trim();
      this.dom.entryCountLabel.textContent = `${this.entries.length}頭`;
    }

    renderEntryTable() {
      this.dom.entryTableBody.innerHTML = this.entries
        .sort((a, b) => a.number - b.number)
        .map(e => `
          <tr>
            <td class="mark-cell">${e.mark || ''}</td>
            <td><span class="waku-chip waku-${e.waku}">${e.number}</span></td>
            <td class="entry-name-cell" title="${escapeHtml(e.name)}"><strong>${escapeHtml(e.name)}</strong><br><small>${escapeHtml(e.style)} / ${e.weight || '-'}kg</small></td>
            <td>${escapeHtml(e.jockey || '-')}</td>
            <td>${e.popularity ? `${e.popularity}人気` : '-'}<br><small>${e.odds ? `${e.odds}倍` : ''}</small></td>
            <td>${Math.round(e.score)}</td>
          </tr>
        `).join('');
    }

    renderIdleCanvas() {
      const horses = this.entries.map((entry, index) => ({
        ...entry,
        lane: this.renderer.gateToLane(entry.gate || entry.number, this.entries.length),
        meters: 0,
        goalProgress: 0,
      }));
      this.renderer.resize();
      this.renderer.draw({
        raceConfig: this.raceConfig,
        horses,
        phase: { label: 'スタート前', corner: false, final: false },
        leaderMeters: 0,
        gateOpen: 0,
        gateVisible: true,
      });
      this.dom.phaseChip.textContent = 'スタート前';
      this.dom.progressText.textContent = `0m / ${this.raceConfig.distance}m`;
    }

    renderResultTable(order) {
      const rows = (order || []).map((h, i) => {
        const prev = i === 0 ? null : order[i - 1];
        const diff = prev ? h.finalSeconds - prev.finalSeconds : 0;
        return `
          <tr>
            <td><strong>${i + 1}</strong></td>
            <td>${h.number}</td>
            <td>${escapeHtml(h.name)}</td>
            <td>${formatSeconds(h.finalSeconds)}</td>
            <td>${i === 0 ? '-' : marginLabelFromSeconds(diff)}</td>
          </tr>
        `;
      }).join('');
      this.dom.resultTableBody.innerHTML = rows || '<tr><td colspan="5" style="color:#9db4a6; text-align:center; padding:18px;">レース開始後に表示</td></tr>';
      this.dom.finishCountLabel.textContent = `${order?.length || 0}/${this.entries.length}`;
    }

    renderGoalMiniList(order) {
      this.dom.goalMiniList.innerHTML = (order || []).slice(0, 8).map(h => `<li>${h.number}番 ${escapeHtml(h.name)}</li>`).join('');
    }

    appendLog(type, text) {
      if (!text) return;
      const div = document.createElement('div');
      div.className = `log-entry ${type || ''}`;
      div.textContent = text;
      this.dom.raceLog.appendChild(div);
      this.dom.raceLog.scrollTop = this.dom.raceLog.scrollHeight;
    }

    renderStatsPlaceholder() {
      this.dom.statsTableBody.innerHTML = this.entries
        .sort((a, b) => b.score - a.score)
        .map(e => `
          <tr>
            <td class="mark-cell">${e.mark || ''}</td>
            <td>${e.number}</td>
            <td>${escapeHtml(e.name)}</td>
            <td>-</td><td>-</td><td>-</td><td>-</td>
            <td>${Math.round(e.score)}</td>
          </tr>
        `).join('');
    }

    runStats(count) {
      this.dom.statsStatus.textContent = `${count}回集計中...`;
      setTimeout(() => {
        const stats = new Map(this.entries.map(e => [e.id, { entry: e, starts: 0, win: 0, top2: 0, top3: 0, rankSum: 0 }]));
        for (let i = 0; i < count; i++) {
          const order = this.runFastRace(900000 + i * 97 + hashString(this.raceConfig.raceName));
          order.forEach((h, idx) => {
            const rec = stats.get(h.id);
            if (!rec) return;
            rec.starts += 1;
            rec.rankSum += idx + 1;
            if (idx === 0) rec.win += 1;
            if (idx <= 1) rec.top2 += 1;
            if (idx <= 2) rec.top3 += 1;
          });
        }
        this.renderStats([...stats.values()].sort((a, b) => b.win - a.win || b.top3 - a.top3 || a.rankSum - b.rankSum));
        this.dom.statsStatus.textContent = `${count}回集計完了`;
      }, 20);
    }

    runFastRace(seed) {
      const sim = new RaceSimulation(this.entries, this.raceConfig, { ...this.settings, timeScale: 14, chaos: this.settings.chaos }, seed);
      let guard = 0;
      while (!sim.finished && guard < 1400) {
        sim.tick(80);
        guard += 1;
      }
      return sim.finishOrder.length ? sim.finishOrder : [...sim.horses].sort((a, b) => b.meters - a.meters);
    }

    renderStats(records) {
      this.dom.statsTableBody.innerHTML = records.map(rec => {
        const e = rec.entry;
        const starts = Math.max(1, rec.starts);
        return `
          <tr>
            <td class="mark-cell">${e.mark || ''}</td>
            <td>${e.number}</td>
            <td>${escapeHtml(e.name)}</td>
            <td>${formatPercent(rec.win / starts)}</td>
            <td>${formatPercent(rec.top2 / starts)}</td>
            <td>${formatPercent(rec.top3 / starts)}</td>
            <td>${(rec.rankSum / starts).toFixed(2)}</td>
            <td>${Math.round(e.score)}</td>
          </tr>
        `;
      }).join('');
    }

    renderStatsFromLastRace(order) {
      if (!order?.length) return;
      // Keep the aggregate table useful even without running bulk stats.
      this.dom.statsTableBody.innerHTML = order.map((h, i) => `
        <tr>
          <td class="mark-cell">${h.mark || ''}</td>
          <td>${h.number}</td>
          <td>${escapeHtml(h.name)}</td>
          <td>${i === 0 ? '100.0%' : '0.0%'}</td>
          <td>${i <= 1 ? '100.0%' : '0.0%'}</td>
          <td>${i <= 2 ? '100.0%' : '0.0%'}</td>
          <td>${i + 1}</td>
          <td>${Math.round(h.score)}</td>
        </tr>
      `).join('');
    }
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
    }[ch]));
  }

  document.addEventListener('DOMContentLoaded', () => {
    try {
      window.__raceAppV8 = new RaceApp();
    } catch (err) {
      console.error(err);
      const body = document.body;
      const pre = document.createElement('pre');
      pre.style.cssText = 'white-space:pre-wrap;background:#250b0b;color:#fff;padding:16px;margin:16px;border-radius:12px;';
      pre.textContent = `初期化エラー: ${err.message}\n${err.stack || ''}`;
      body.prepend(pre);
    }
  });
})();
