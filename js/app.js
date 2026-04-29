/* ============================================================
   Конкурс Факультетов — app.js
   ============================================================
   Архитектура рассчитана на подключение FastAPI + PostgreSQL.

   Чтобы перейти на реальный бэкенд:
     1. Создайте файл api.js (шаблон в конце этого файла)
     2. Подключите его в index.html ДО app.js
     3. Установите USE_MOCK = false
   ============================================================ */

'use strict';

/* ── Config ─────────────────────────────────────────────────
   USE_MOCK = true  → данные берутся из MOCK_DATA ниже
   USE_MOCK = false → данные запрашиваются через API (api.js)
   ---------------------------------------------------------- */
const USE_MOCK = true;

/* ── API Base URL (используется когда USE_MOCK = false) ──── */
const API_BASE = 'http://localhost:8000/api/v1';

/* ============================================================
   MOCK DATA
   Замените реальными вызовами через api.js когда будет готов бэкенд.

   Структура данных для одного оператора за неделю:
   [КЗЧ, QA, CSat, Эфф%, Часы%, Нарушения, Опоздания, Баллы]
   ============================================================ */
const FACULTIES = [
  {
    id: 'gryf', cls: 'gryf', icon: '🦁',
    name: 'Гриффиндор',
    tagCls: 'tag-gryf', scoreCls: 'gryf-score',
    operators: [
      'Айткалиев Айдын',
      'Аружан Мухтаркызы',
      'Зинелгабиден Алнур',
      'Тулегенов Ислам',
      'Шынгысбаева Акерке',
      'Онгарова Жанерке',
      'Ортай Нурсултан',
    ]
  },
  {
    id: 'slyth', cls: 'slyth', icon: '🐍',
    name: 'Слизерин',
    tagCls: 'tag-slyth', scoreCls: 'slyth-score',
    operators: [
      'Алибек Беркинович',
      'Ахауова Нурсая',
      'Багашар Аяжан',
      'Нурганат Нурдана',
      'Сергей Алихан',
      'Хамидов Санжар',
      'Шаяхмет Жаркынай',
    ]
  },
  {
    id: 'huff', cls: 'huff', icon: '🦡',
    name: 'Пуффендуй',
    tagCls: 'tag-huff', scoreCls: 'huff-score',
    operators: [
      'Оператор П1','Оператор П2','Оператор П3',
      'Оператор П4','Оператор П5','Оператор П6','Оператор П7',
    ]
  },
  {
    id: 'raven', cls: 'raven', icon: '🦅',
    name: 'Когтевран',
    tagCls: 'tag-raven', scoreCls: 'raven-score',
    operators: [
      'Оператор К1','Оператор К2','Оператор К3',
      'Оператор К4','Оператор К5','Оператор К6','Оператор К7',
    ]
  },
];

/* Weekly data: [week][faculty][operator] → [КЗЧ,QA,CSat,Эфф%,Часы%,Нар.,Опозд.,Баллы] */
const WEEKLY_DATA = [
  // ── Week 1 ─────────────────────────────────────────────────
  [
    [[15,99,5,57,25,1,22,662.5],[22,99,5,70,29,0,26,714.5],[12,82,4,53,34,3,20,535],[23,94,4,48,31,2,24,574],[16,73,5,61,32,2,26,574.5],[7,96,5,47,26,0,29,592],[15,89,4,44,27,0,29,599.5]],
    [[17,71,5,47,34,0,29,597.5],[13,81,4,66,31,0,11,663.5],[18,81,4,48,32,1,20,580.5],[10,93,5,58,32,3,23,594.5],[23,79,4,55,31,0,20,618.5],[10,87,5,61,34,0,23,677.5],[22,72,5,47,39,3,21,531]],
    [[14,80,4,55,28,1,15,590],[18,85,5,60,30,0,10,650],[11,75,4,45,25,2,20,500],[20,90,5,65,32,0,18,680],[16,78,4,50,27,1,22,560],[9,88,5,55,31,0,25,610],[19,82,4,58,29,2,19,570]],
    [[13,77,4,52,26,1,18,555],[17,83,5,62,31,0,14,635],[21,91,5,68,33,0,16,685],[8,72,4,42,24,3,25,480],[15,86,4,57,28,1,20,595],[12,79,5,48,30,0,22,580],[20,95,5,70,35,0,12,710]],
  ],
  // ── Week 2 ─────────────────────────────────────────────────
  [
    [[15,74,5,61,33,1,13,634],[7,99,5,49,34,2,14,581.5],[23,79,4,44,27,1,16,570.5],[9,71,4,50,31,3,19,480.5],[18,83,5,46,30,2,10,599.5],[16,83,4,65,28,3,19,557.5],[5,72,4,64,33,2,11,479]],
    [[15,79,5,54,30,3,20,555.5],[21,96,4,49,36,1,29,606],[8,94,5,48,26,1,20,597],[20,92,5,57,36,2,28,614],[9,88,5,51,34,1,19,618],[24,76,5,64,25,1,13,637],[22,96,5,61,31,3,26,601]],
    [[16,80,4,54,30,1,16,595],[19,86,5,63,32,0,11,648],[12,76,4,46,26,2,21,502],[21,91,5,66,33,0,17,675],[17,79,4,51,28,1,23,562],[10,89,5,56,32,0,26,614],[20,83,4,59,30,2,20,572]],
    [[14,78,4,53,27,1,19,558],[18,84,5,63,32,0,15,638],[22,92,5,69,34,0,17,688],[9,73,4,43,25,3,26,482],[16,87,4,58,29,1,21,598],[13,80,5,49,31,0,23,583],[21,96,5,71,36,0,13,713]],
  ],
  // ── Week 3 ─────────────────────────────────────────────────
  [
    [[15,73,5,61,27,3,15,561.5],[16,71,4,70,35,1,22,598.5],[6,84,4,57,27,2,30,471],[18,74,4,65,31,0,14,638],[10,86,5,63,33,0,27,670],[23,74,5,47,38,1,25,587],[5,93,5,56,26,1,25,540.5]],
    [[15,85,4,41,36,0,27,596.5],[19,78,4,57,29,3,29,510],[8,94,4,57,29,3,21,526],[9,75,5,58,37,1,11,618.5],[10,76,4,60,29,0,11,637],[10,89,5,44,31,3,23,555.5],[24,73,5,57,40,1,15,626.5]],
    [[15,81,4,55,29,1,17,596],[20,87,5,64,33,0,12,651],[13,77,4,47,27,2,22,504],[22,92,5,67,34,0,18,678],[17,80,4,52,29,1,24,565],[11,90,5,57,33,0,27,617],[21,84,4,60,31,2,21,575]],
    [[14,79,4,54,28,1,20,561],[19,85,5,64,33,0,16,641],[23,93,5,70,35,0,18,691],[10,74,4,44,26,3,27,485],[17,88,4,59,30,1,22,601],[14,81,5,50,32,0,24,586],[22,97,5,72,37,0,14,716]],
  ],
  // ── Week 4 ─────────────────────────────────────────────────
  [
    [[15,96,4,53,33,1,29,611],[23,99,5,58,36,0,24,701.5],[23,84,5,57,34,1,19,640],[10,89,4,52,40,2,19,588.5],[15,88,5,52,30,0,24,656],[13,81,5,65,26,2,11,626.5],[22,91,4,41,28,3,13,541.5]],
    [[15,84,4,41,31,0,24,595],[10,84,5,53,36,3,29,554],[19,87,4,54,29,3,18,548.5],[15,92,5,49,25,2,26,591],[11,94,5,40,31,2,17,602],[14,100,4,63,37,0,30,673],[17,86,5,43,33,1,18,618]],
    [[16,82,4,56,30,1,18,598],[21,88,5,65,34,0,13,653],[14,78,4,48,28,2,23,506],[23,93,5,68,35,0,19,681],[18,81,4,53,30,1,25,568],[12,91,5,58,34,0,28,619],[22,85,4,61,32,2,22,578]],
    [[15,80,4,55,29,1,21,564],[20,86,5,65,34,0,17,644],[24,94,5,71,36,0,19,694],[11,75,4,45,27,3,28,488],[18,89,4,60,31,1,23,604],[15,82,5,51,33,0,25,589],[23,98,5,73,38,0,15,719]],
  ],
];

const COLS = ['КЗЧ', 'QA', 'CSat', 'Эфф%', 'Часы%', 'Нар.', 'Опозд.', 'Баллы'];

/* ============================================================
   DATA LAYER
   При подключении FastAPI замените тело каждой функции на
   вызов соответствующего API-метода из api.js
   ============================================================ */

/**
 * Возвращает данные за указанную неделю (или все 4 недели).
 * @param {number} weekIdx — 0-3 конкретная неделя, 4 — итого
 * @returns {Promise<Array>} массив [{name, pts}] для каждого факультета
 *
 * API-замена (когда USE_MOCK = false):
 *   return api.getScores(weekIdx);
 *   → GET /api/v1/scores?week=<weekIdx>
 */
async function fetchScores(weekIdx) {
  if (!USE_MOCK) {
    // TODO: return await api.getScores(weekIdx);
  }
  return calcTotals(weekIdx);
}

/**
 * Возвращает итоговые очки факультета.
 * @param {number} facIdx
 * @param {number} weekIdx
 * @returns {Promise<number>}
 *
 * API-замена:
 *   return api.getFacultyTotal(facIdx, weekIdx);
 *   → GET /api/v1/faculties/<facIdx>/total?week=<weekIdx>
 */
async function fetchFacultyTotal(facIdx, weekIdx) {
  if (!USE_MOCK) {
    // TODO: return await api.getFacultyTotal(facIdx, weekIdx);
  }
  return getFacultyTotal(facIdx, weekIdx);
}

/* ============================================================
   MOCK CALCULATIONS (используются только при USE_MOCK = true)
   ============================================================ */
function calcTotals(weekIdx) {
  return FACULTIES.map((fac, fi) =>
    fac.operators.map((name, oi) => ({
      name,
      pts: weekIdx < 4
        ? WEEKLY_DATA[weekIdx][fi][oi][7]
        : [0,1,2,3].reduce((s, w) => s + WEEKLY_DATA[w][fi][oi][7], 0),
    }))
  );
}

function getFacultyTotal(facIdx, weekIdx) {
  if (weekIdx < 4) {
    return WEEKLY_DATA[weekIdx][facIdx].reduce((s, r) => s + r[7], 0);
  }
  return [0,1,2,3].reduce((sum, w) =>
    sum + WEEKLY_DATA[w][facIdx].reduce((s, r) => s + r[7], 0), 0
  );
}

/* ============================================================
   RENDER HELPERS
   ============================================================ */
function fmtPts(v) {
  return Number.isInteger(v) ? v.toString() : v.toFixed(1);
}

function buildRankBadge(globalRank) {
  const cls = globalRank <= 3 ? `rank-${globalRank}` : 'rank-other';
  return `<span class="rank-badge ${cls}">${globalRank}</span>`;
}

/* ── Scoreboard ─────────────────────────────────────────────── */
async function renderScoreboard(weekIdx) {
  const totals = await Promise.all(
    FACULTIES.map(async (f, i) => ({ ...f, total: await fetchFacultyTotal(i, weekIdx) }))
  );
  totals.sort((a, b) => b.total - a.total);
  const [first, second] = totals;

  document.getElementById('scoreboard').innerHTML = `
    <div class="score-faculty">
      <div class="score-faculty-name">${first.icon} ${first.name}</div>
      <div class="score-points ${first.scoreCls}">${fmtPts(first.total)}</div>
    </div>
    <div class="score-center">
      <div class="score-vs">СЧЁТ ФАКУЛЬТЕТОВ</div>
      <div class="score-leader">🏆 Ведёт: ${first.name}</div>
      <div style="font-size:11px;color:rgba(201,168,76,.4);margin-top:4px;font-family:'Cinzel',serif;">
        +${fmtPts(first.total - second.total)} очков
      </div>
    </div>
    <div class="score-faculty right">
      <div class="score-faculty-name">${second.icon} ${second.name}</div>
      <div class="score-points ${second.scoreCls}">${fmtPts(second.total)}</div>
    </div>
  `;
}

/* ── Faculty Cards ──────────────────────────────────────────── */
async function renderFacultyCards(weekIdx) {
  const grid = document.getElementById('faculty-grid');
  const allTotals = await fetchScores(weekIdx);
  const maxPts = Math.max(...allTotals.flat().map(o => o.pts));

  const colHeaders = weekIdx < 4
    ? COLS.slice(0, 7).map(c => `<th>${c}</th>`).join('') + '<th>Баллы</th>'
    : '<th>Баллы (итого)</th>';

  let html = '';

  for (let fi = 0; fi < FACULTIES.length; fi++) {
    const fac      = FACULTIES[fi];
    const facTotal = await fetchFacultyTotal(fi, weekIdx);
    const sorted   = allTotals[fi].slice().sort((a, b) => b.pts - a.pts);
    const allFlat  = allTotals.flat().slice().sort((a, b) => b.pts - a.pts);

    const rows = sorted.map(op => {
      const globalRank = allFlat.findIndex(r => r.name === op.name) + 1;
      const pct = Math.round((op.pts / maxPts) * 100);

      let metricCells = '';
      if (weekIdx < 4) {
        const origIdx = fac.operators.indexOf(op.name);
        const row = WEEKLY_DATA[weekIdx][fi][origIdx];
        metricCells = row.slice(0, 7).map((v, i) => {
          if (i === 5 && v > 0) return `<td class="neg">-${v}</td>`;
          if (i === 6 && v > 0) return `<td class="neg">${v}'</td>`;
          return `<td>${v}</td>`;
        }).join('');
      }

      return `
        <tr>
          <td>${buildRankBadge(globalRank)}${op.name}</td>
          ${metricCells}
          <td>
            <div class="score-bar-wrap">
              <div class="score-bar">
                <div class="score-bar-fill" style="width:${pct}%"></div>
              </div>
              <span class="pts-value">${fmtPts(op.pts)}</span>
            </div>
          </td>
        </tr>`;
    }).join('');

    const colspan = weekIdx < 4 ? 9 : 2;

    html += `
      <div class="faculty-card ${fac.cls}">
        <div class="faculty-header">
          <div class="faculty-header-left">
            <div class="faculty-crest">${fac.icon}</div>
            <div class="faculty-name">${fac.name}</div>
          </div>
          <div>
            <div class="faculty-total">${fmtPts(facTotal)}</div>
            <div class="faculty-total-label">очков</div>
          </div>
        </div>
        <div class="faculty-table-wrap">
          <table class="operators">
            <thead>
              <tr><th>Оператор</th>${colHeaders}</tr>
            </thead>
            <tbody>
              ${rows}
              <tr class="total-row">
                <td colspan="${colspan}" style="text-align:right;padding-right:12px;color:rgba(44,24,16,.6);font-size:11px">ИТОГО</td>
                <td>
                  <div class="score-bar-wrap">
                    <span class="pts-value">${fmtPts(facTotal)}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>`;
  }

  grid.innerHTML = html;
}

/* ── Overall Ranking ────────────────────────────────────────── */
async function renderRanking(weekIdx) {
  const allTotals = await fetchScores(weekIdx);

  const allOps = FACULTIES.flatMap((fac, fi) =>
    allTotals[fi].map(op => ({ ...op, fac }))
  ).sort((a, b) => b.pts - a.pts);

  const posColors = { 1: '#c9a84c', 2: '#aaa', 3: '#cd7f32' };

  document.getElementById('ranking-list').innerHTML = allOps.map((op, i) => {
    const pos   = i + 1;
    const color = posColors[pos] || 'rgba(201,168,76,.4)';
    return `
      <div class="ranking-row">
        <div class="ranking-pos" style="color:${color}">${pos}</div>
        <div class="ranking-name">${op.name}</div>
        <div class="ranking-faculty-tag ${op.fac.tagCls}">${op.fac.icon} ${op.fac.name}</div>
        <div class="ranking-pts ${op.fac.scoreCls}">${fmtPts(op.pts)}</div>
      </div>`;
  }).join('');
}

/* ============================================================
   NAVIGATION
   ============================================================ */
let currentWeek = 4;

async function showWeek(idx) {
  currentWeek = idx;
  document.querySelectorAll('.week-tab').forEach((t, i) => {
    t.classList.toggle('active', i === idx);
  });

  await Promise.all([
    renderScoreboard(idx),
    renderFacultyCards(idx),
    renderRanking(idx),
  ]);
}

/* ── Init ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => showWeek(4));


/* ============================================================
   ШАБЛОН api.js (создайте отдельный файл когда будет готов бэкенд)
   ============================================================

// api.js — подключить в index.html перед app.js
// <script src="js/api.js"></script>

const API_BASE = 'http://localhost:8000/api/v1';

const api = {
  // GET /api/v1/scores?week=<weekIdx>
  // Ответ: { faculties: [ { id, operators: [{name, pts}] } ] }
  async getScores(weekIdx) {
    const res = await fetch(`${API_BASE}/scores?week=${weekIdx}`);
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    return data.faculties.map(f => f.operators);
  },

  // GET /api/v1/faculties/<facIdx>/total?week=<weekIdx>
  // Ответ: { total: 12345.5 }
  async getFacultyTotal(facIdx, weekIdx) {
    const res = await fetch(`${API_BASE}/faculties/${facIdx}/total?week=${weekIdx}`);
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    return data.total;
  },
};

============================================================ */
