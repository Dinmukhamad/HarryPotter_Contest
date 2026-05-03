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
const USE_MOCK = false;

/* ── API Base URL — укажите URL вашего бэкенда ───────────
   Локально:    'http://localhost:3000'
   На сервере:  'https://your-app.railway.app'  (и т.п.)
   -------------------------------------------------------- */
const API_BASE = window.location.origin;

const HOUSE_CRESTS = {
  gryf: 'assets/crest-gryffindor.png',
  slyth: 'assets/crest-slytherin.png',
  huff: 'assets/crest-hufflepuff.png',
  raven: 'assets/crest-ravenclaw.png',
};

/* ============================================================
   MOCK DATA
   Замените реальными вызовами через api.js когда будет готов бэкенд.

   Структура данных для одного оператора за неделю:
   [КЗЧ, QA, CSat, Эфф%, Часы%, Нарушения, Опоздания, Баллы]
   ============================================================ */
let FACULTIES = [
  {
    id: 'gryf', cls: 'gryf', icon: '🦁',
    crest: HOUSE_CRESTS.gryf,
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
      'Оператор Г8',
      'Оператор Г9',
      'Оператор Г10',
    ]
  },
  {
    id: 'slyth', cls: 'slyth', icon: '🐍',
    crest: HOUSE_CRESTS.slyth,
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
      'Оператор С8',
      'Оператор С9',
      'Оператор С10',
    ]
  },
  {
    id: 'huff', cls: 'huff', icon: '🦡',
    crest: HOUSE_CRESTS.huff,
    name: 'Пуффендуй',
    tagCls: 'tag-huff', scoreCls: 'huff-score',
    operators: [
      'Оператор П1','Оператор П2','Оператор П3',
      'Оператор П4','Оператор П5','Оператор П6','Оператор П7',
      'Оператор П8','Оператор П9','Оператор П10',
    ]
  },
  {
    id: 'raven', cls: 'raven', icon: '🦅',
    crest: HOUSE_CRESTS.raven,
    name: 'Когтевран',
    tagCls: 'tag-raven', scoreCls: 'raven-score',
    operators: [
      'Оператор К1','Оператор К2','Оператор К3',
      'Оператор К4','Оператор К5','Оператор К6','Оператор К7',
      'Оператор К8','Оператор К9','Оператор К10',
    ]
  },
];

/* Weekly data: [week][faculty][operator] → [КЗЧ,QA,CSat,Эфф%,Часы%,Нар.,Опозд.,Баллы] */
let WEEKLY_DATA = [
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
const STORAGE_KEY = 'hpContestEditableData';
const ADMIN_SESSION_KEY = 'hpContestAdminUnlocked';
const ADMIN_PASSWORD = 'hogwarts2026';
const MIN_OPERATORS_PER_FACULTY = 10;
let isAdmin = false;
let METRICS = COLS.map((label, idx) => ({
  label,
  type: idx === COLS.length - 1 ? 'score' : (idx === 5 || idx === 6 ? 'penalty' : 'metric'),
}));

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function getScoreMetricIndex() {
  const idx = METRICS.findIndex(metric => metric.type === 'score');
  return idx === -1 ? METRICS.length - 1 : idx;
}

function getPublicMetrics() {
  return METRICS
    .map((metric, index) => ({ metric, index }))
    .filter(item => item.metric.type !== 'score');
}

function resetAllOperatorScores() {
  const scoreIdx = getScoreMetricIndex();
  WEEKLY_DATA.forEach(week => {
    week.forEach(facultyRows => {
      facultyRows.forEach(row => {
        row[scoreIdx] = 0;
      });
    });
  });
}

function normalizeEditableData() {
  const metricCount = METRICS.length;

  FACULTIES.forEach(fac => {
    fac.crest = HOUSE_CRESTS[fac.id] || fac.crest;
    while (fac.operators.length < MIN_OPERATORS_PER_FACULTY) {
      fac.operators.push(`Оператор ${fac.name} ${fac.operators.length + 1}`);
    }
  });

  WEEKLY_DATA.forEach((week, wi) => {
    if (!week) WEEKLY_DATA[wi] = [];

    FACULTIES.forEach((fac, fi) => {
      if (!WEEKLY_DATA[wi][fi]) WEEKLY_DATA[wi][fi] = [];

      fac.operators.forEach((_, oi) => {
        if (!WEEKLY_DATA[wi][fi][oi]) WEEKLY_DATA[wi][fi][oi] = Array(metricCount).fill(0);

        while (WEEKLY_DATA[wi][fi][oi].length < metricCount) {
          WEEKLY_DATA[wi][fi][oi].splice(getScoreMetricIndex(), 0, 0);
        }
        if (WEEKLY_DATA[wi][fi][oi].length > metricCount) {
          WEEKLY_DATA[wi][fi][oi].length = metricCount;
        }
      });

      if (WEEKLY_DATA[wi][fi].length > fac.operators.length) {
        WEEKLY_DATA[wi][fi].length = fac.operators.length;
      }
    });
  });
}

async function loadEditableData() {
  try {
    // 1. Пробуем загрузить с сервера
    const state = await api.loadState();
    if (state && Array.isArray(state.faculties) && Array.isArray(state.weeklyData) && Array.isArray(state.metrics)) {
      FACULTIES   = state.faculties;
      WEEKLY_DATA = state.weeklyData;
      METRICS     = state.metrics;
      console.log('✅ Данные загружены с сервера');

      // Сохраняем локально как кэш на случай офлайна
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}

      if (!METRICS.some(m => m.type === 'score')) METRICS.push({ label: 'Баллы', type: 'score' });
      normalizeEditableData();
      return;
    }

    // Сервер доступен, но общих данных ещё нет. Используем чистые встроенные данные,
    // чтобы старый localStorage отдельного браузера не попал обратно на общий сервер.
    if (state === null) {
      if (!METRICS.some(m => m.type === 'score')) METRICS.push({ label: 'Баллы', type: 'score' });
      normalizeEditableData();
      resetAllOperatorScores();
      return;
    }
  } catch (err) {
    console.warn('Сервер недоступен, пробуем локальный кэш…', err.message);
  }

  // 2. Фолбэк: локальный кэш (localStorage)
  let loadedFromCache = false;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.faculties) && Array.isArray(saved.weeklyData) && Array.isArray(saved.metrics)) {
      FACULTIES   = saved.faculties;
      WEEKLY_DATA = saved.weeklyData;
      METRICS     = saved.metrics;
      loadedFromCache = true;
      console.warn('⚠️ Используются кэшированные данные (сервер недоступен)');
    }
  } catch (err) {
    console.warn('Не удалось загрузить кэш', err);
  }

  if (!METRICS.some(m => m.type === 'score')) METRICS.push({ label: 'Баллы', type: 'score' });
  normalizeEditableData();

  if (!loadedFromCache) {
    resetAllOperatorScores();
  }
}

async function saveEditableData() {
  normalizeEditableData();
  const state = { faculties: FACULTIES, weeklyData: WEEKLY_DATA, metrics: METRICS };

  // Всегда сохраняем в localStorage как кэш
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}

  // Сохраняем на сервер
  try {
    await api.saveState(state, ADMIN_PASSWORD);
    console.log('✅ Данные сохранены на сервере');
  } catch (err) {
    console.error('❌ Не удалось сохранить на сервере:', err.message);
    // Не прерываем работу — данные уже в localStorage как резерв
    alert(`⚠️ Не удалось сохранить на сервере: ${err.message}\nДанные сохранены локально.`);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatMetricValue(value, metric) {
  const number = Number(value) || 0;
  if (metric.type === 'penalty' && number > 0) return `-${fmtPts(number)}`;
  return fmtPts(number);
}

function loadAdminSession() {
  isAdmin = sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

function updateAdminGate() {
  const gateBtn = document.getElementById('admin-gate-btn');
  const loginArea = document.getElementById('admin-login-area');
  const activeArea = document.getElementById('admin-active-area');
  const error = document.getElementById('admin-error');

  if (gateBtn) {
    gateBtn.classList.toggle('unlocked', isAdmin);
    gateBtn.setAttribute('aria-label', isAdmin ? 'Режим администратора открыт' : 'Открыть режим администратора');
  }
  if (loginArea) loginArea.hidden = isAdmin;
  if (activeArea) activeArea.hidden = !isAdmin;
  if (error) error.textContent = '';
}

function openAdminModal() {
  const popover = document.getElementById('admin-popover');
  if (!popover) return;
  updateAdminGate();
  popover.hidden = false;

  if (!isAdmin) {
    const input = document.getElementById('admin-password');
    if (input) setTimeout(() => input.focus(), 0);
  }
}

function closeAdminModal() {
  const popover = document.getElementById('admin-popover');
  if (popover) popover.hidden = true;
}

function requireAdmin() {
  if (isAdmin) return true;
  openAdminModal();
  renderEditor();
  return false;
}

function loginAdmin() {
  const input = document.getElementById('admin-password');
  const error = document.getElementById('admin-error');
  const password = input ? input.value : '';

  if (password === ADMIN_PASSWORD) {
    isAdmin = true;
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    closeAdminModal();
    updateAdminGate();
    renderEditor();
    setDashboardMode(currentView);
    return;
  }

  if (error) error.textContent = 'Неверный пароль';
  if (input) input.value = '';
}

function logoutAdmin() {
  isAdmin = false;
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  closeAdminModal();
  updateAdminGate();
  renderEditor();
  setDashboardMode(currentView);
}

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
  const scoreIdx = getScoreMetricIndex();
  return FACULTIES.map((fac, fi) =>
    fac.operators.map((name, oi) => ({
      name,
      pts: weekIdx < 4
        ? (Number(WEEKLY_DATA[weekIdx][fi][oi][scoreIdx]) || 0)
        : [0,1,2,3].reduce((s, w) => s + (Number(WEEKLY_DATA[w][fi][oi][scoreIdx]) || 0), 0),
    }))
  );
}

function getFacultyTotal(facIdx, weekIdx) {
  const scoreIdx = getScoreMetricIndex();
  if (weekIdx < 4) {
    return WEEKLY_DATA[weekIdx][facIdx].reduce((s, r) => s + (Number(r[scoreIdx]) || 0), 0);
  }

  const operatorCount = Math.max(1, FACULTIES[facIdx].operators.length);
  const monthlyTotal = [0,1,2,3].reduce((sum, w) =>
    sum + WEEKLY_DATA[w][facIdx].reduce((s, r) => s + (Number(r[scoreIdx]) || 0), 0), 0
  );
  return monthlyTotal / operatorCount;
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

function getPeriodLabel(weekIdx) {
  return weekIdx < 4 ? `Неделя ${weekIdx + 1}` : 'Итоги месяца';
}

function renderCrest(fac, className = 'faculty-crest-img') {
  if (!fac.crest) return fac.icon;
  return `<img class="${className}" src="${fac.crest}" alt="${escapeHtml(fac.name)}">`;
}

/* ── Scoreboard ─────────────────────────────────────────────── */
async function renderScoreboard(weekIdx) {
  const totals = await Promise.all(
    FACULTIES.map(async (f, i) => ({ ...f, total: await fetchFacultyTotal(i, weekIdx) }))
  );
  totals.sort((a, b) => b.total - a.total);
  const [first, second] = totals;
  const leaderDiff = second ? first.total - second.total : 0;
  const isMonthTotal = weekIdx === 4;
  const scoreItems = totals.map((fac, idx) => `
    <div class="score-faculty score-faculty-card">
      <div class="score-rank">#${idx + 1}</div>
      <div class="score-faculty-name">
        ${renderCrest(fac, 'score-crest-img')}
        <span>${fac.name}</span>
      </div>
      <div class="score-points ${fac.scoreCls}">${fmtPts(fac.total)}</div>
      <div class="score-caption">${isMonthTotal ? 'средний балл' : 'баллов'}</div>
    </div>
  `).join('');

  document.getElementById('scoreboard').innerHTML = `
    <div class="scoreboard-header">
      <div>
        <div class="section-kicker">Командный зачёт</div>
        <h2 class="section-title">Общий рейтинг команд</h2>
      </div>
      <div class="score-summary">
        <span>${getPeriodLabel(weekIdx)}</span>
        <strong>Лидер: ${first.name}</strong>
        <span>${isMonthTotal ? 'Средний отрыв' : 'Отрыв от 2 места'}: +${fmtPts(leaderDiff)}</span>
      </div>
    </div>
    <div class="score-list">${scoreItems}</div>
  `;
}

/* ── Faculty Cards ──────────────────────────────────────────── */
async function renderFacultyCards(weekIdx) {
  const grid = document.getElementById('faculty-grid');
  const allTotals = await fetchScores(weekIdx);
  const publicMetrics = getPublicMetrics();

  const colHeaders = weekIdx < 4
    ? publicMetrics.map(({ metric }) => `<th class="metric-col metric-${metric.type}">${escapeHtml(metric.label)}</th>`).join('')
    : '';

  let html = '';

  for (let fi = 0; fi < FACULTIES.length; fi++) {
    const fac      = FACULTIES[fi];
    const facTotal = await fetchFacultyTotal(fi, weekIdx);
    const sorted   = allTotals[fi].slice().sort((a, b) => b.pts - a.pts);
    const allFlat  = allTotals.flat().slice().sort((a, b) => b.pts - a.pts);

    const rows = sorted.map(op => {
      const globalRank = allFlat.findIndex(r => r.name === op.name) + 1;
      let metricCells = '';
      if (weekIdx < 4) {
        const origIdx = fac.operators.indexOf(op.name);
        const row = WEEKLY_DATA[weekIdx][fi][origIdx];
        metricCells = publicMetrics.map(({ metric, index }) => {
          const value = row[index] ?? 0;
          const cls = metric.type === 'penalty' && Number(value) > 0 ? ' class="neg"' : '';
          return `<td${cls}>${formatMetricValue(value, metric)}</td>`;
        }).join('');
      }

      return `
        <tr>
          <td class="${op.name.length <= 12 ? 'short-text' : ''}">${buildRankBadge(globalRank)}${escapeHtml(op.name)}</td>
          ${metricCells}

        </tr>`;
    }).join('');

    html += `
      <div class="faculty-card ${fac.cls}">
        <div class="faculty-header">
          <div class="faculty-header-left">
            <div class="faculty-crest">${renderCrest(fac)}</div>
            <div class="faculty-name">${fac.name}</div>
          </div>
          <div>
            <div class="faculty-total">${fmtPts(facTotal)}</div>
            <div class="faculty-total-label">${weekIdx === 4 ? 'средний балл' : 'очков'}</div>
          </div>
        </div>
        <div class="faculty-table-wrap">
          <table class="operators">
            <thead>
              <tr><th>Оператор</th>${colHeaders}</tr>
            </thead>
            <tbody>
              ${rows}
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
        <div class="ranking-pos" style="color:${color}">
          <span class="ranking-mobile-label">Место</span>
          ${pos}
        </div>
        <div class="ranking-name">
          <span class="ranking-mobile-label">Оператор</span>
          ${escapeHtml(op.name)}
        </div>
        <div class="ranking-faculty-tag ${op.fac.tagCls}">
          <span class="ranking-mobile-label">Факультет</span>
          ${renderCrest(op.fac, 'ranking-crest-img')} ${escapeHtml(op.fac.name)}
        </div>

      </div>`;
  }).join('');
}

/* ── Editor ───────────────────────────────────────────────── */
async function refreshDashboard() {
  await Promise.all([
    renderScoreboard(currentWeek),
    renderFacultyCards(currentWeek),
    renderRanking(currentWeek),
  ]);
}

function renderEditor() {
  const panel = document.getElementById('editor-panel');
  if (!panel) return;

  if (!isAdmin) {
    panel.innerHTML = '';
    return;
  }

  const editWeek = currentWeek < 4 ? currentWeek : 0;
  const weekOptions = [0,1,2,3].map(idx =>
    `<option value="${idx}" ${idx === editWeek ? 'selected' : ''}>Неделя ${idx + 1}</option>`
  ).join('');

  const metricsRows = METRICS.map((metric, mi) => `
    <div class="metric-editor-row">
      <input class="editor-input" value="${escapeHtml(metric.label)}"
        oninput="updateMetricLabel(${mi}, this.value)" aria-label="Название показателя">
      <select class="editor-select" onchange="updateMetricType(${mi}, this.value)" ${metric.type === 'score' ? 'disabled' : ''}>
        <option value="metric" ${metric.type === 'metric' ? 'selected' : ''}>Показатель</option>
        <option value="penalty" ${metric.type === 'penalty' ? 'selected' : ''}>Штраф</option>
        <option value="score" ${metric.type === 'score' ? 'selected' : ''}>Баллы</option>
      </select>
      <button class="editor-icon-btn danger" onclick="removeMetric(${mi})" ${metric.type === 'score' ? 'disabled' : ''} title="Удалить показатель">×</button>
    </div>
  `).join('');

  const facultyEditors = FACULTIES.map((fac, fi) => {
    const rows = fac.operators.map((name, oi) => {
      const cells = METRICS.map((metric, mi) => `
        <td>
          <input class="metric-value-input" type="number" step="0.1"
            value="${WEEKLY_DATA[editWeek][fi][oi][mi] ?? 0}"
            oninput="updateOperatorMetric(${editWeek}, ${fi}, ${oi}, ${mi}, this.value)"
            aria-label="${escapeHtml(metric.label)}">
        </td>
      `).join('');

      return `
        <tr>
          <td>
            <input class="operator-name-input" value="${escapeHtml(name)}"
              oninput="updateOperatorName(${fi}, ${oi}, this.value)" aria-label="Имя оператора">
          </td>
          ${cells}
          <td>
            <button class="editor-icon-btn danger" onclick="removeOperator(${fi}, ${oi})" title="Удалить оператора">×</button>
          </td>
        </tr>`;
    }).join('');

    return `
      <div class="editor-faculty ${fac.cls}">
        <div class="editor-faculty-header">
          <div class="editor-faculty-name">${escapeHtml(fac.name)}</div>
          <div class="editor-add-operator">
            <input class="editor-input" id="new-operator-${fi}" placeholder="Новый оператор">
            <button class="editor-btn" onclick="addOperator(${fi})">Добавить</button>
          </div>
        </div>
        <div class="editor-table-wrap">
          <table class="editor-table">
            <thead>
              <tr>
                <th>Оператор</th>
                ${METRICS.map(metric => `<th class="metric-col metric-${metric.type}">${escapeHtml(metric.label)}</th>`).join('')}
                <th></th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;
  }).join('');

  panel.innerHTML = `
    <div class="editor-toolbar">
      <div>
        <div class="editor-title">Управление показателями</div>
        <div class="editor-subtitle">Все изменения сохраняются в этом браузере</div>
      </div>
      <label class="editor-week-label">
        Неделя
        <select class="editor-select" onchange="showWeek(Number(this.value))">${weekOptions}</select>
      </label>
      <button class="editor-btn ghost" onclick="logoutAdmin()">Выйти</button>
    </div>

    <div class="editor-metrics">
      <div class="editor-metrics-list">${metricsRows}</div>
      <div class="editor-add-metric">
        <input class="editor-input" id="new-metric-name" placeholder="Новый показатель">
        <select class="editor-select" id="new-metric-type">
          <option value="metric">Показатель</option>
          <option value="penalty">Штраф</option>
        </select>
        <button class="editor-btn" onclick="addMetric()">Добавить колонку</button>
      </div>
    </div>

    <div class="editor-faculties">${facultyEditors}</div>
  `;
}

async function updateOperatorName(facIdx, opIdx, value) {
  if (!requireAdmin()) return;
  FACULTIES[facIdx].operators[opIdx] = value.trim() || `Оператор ${opIdx + 1}`;
  await saveEditableData();
  refreshDashboard();
}

async function updateOperatorMetric(weekIdx, facIdx, opIdx, metricIdx, value) {
  if (!requireAdmin()) return;
  WEEKLY_DATA[weekIdx][facIdx][opIdx][metricIdx] = Number(value) || 0;
  await saveEditableData();
  refreshDashboard();
}

async function addOperator(facIdx) {
  if (!requireAdmin()) return;
  const input = document.getElementById(`new-operator-${facIdx}`);
  const name = input.value.trim();
  if (!name) return;

  FACULTIES[facIdx].operators.push(name);
  WEEKLY_DATA.forEach(week => {
    week[facIdx].push(Array(METRICS.length).fill(0));
  });

  await saveEditableData();
  renderEditor();
  refreshDashboard();
}

async function removeOperator(facIdx, opIdx) {
  if (!requireAdmin()) return;
  const name = FACULTIES[facIdx].operators[opIdx];
  if (!confirm(`Удалить оператора "${name}" и все его показатели за 4 недели?`)) return;

  FACULTIES[facIdx].operators.splice(opIdx, 1);
  WEEKLY_DATA.forEach(week => week[facIdx].splice(opIdx, 1));

  await saveEditableData();
  renderEditor();
  refreshDashboard();
}

async function updateMetricLabel(metricIdx, value) {
  if (!requireAdmin()) return;
  METRICS[metricIdx].label = value.trim() || `Показатель ${metricIdx + 1}`;
  await saveEditableData();
  refreshDashboard();
}

async function updateMetricType(metricIdx, value) {
  if (!requireAdmin()) return;
  if (METRICS[metricIdx].type === 'score') return;
  METRICS[metricIdx].type = value === 'penalty' ? 'penalty' : 'metric';
  await saveEditableData();
  refreshDashboard();
}

async function addMetric() {
  if (!requireAdmin()) return;
  const nameInput = document.getElementById('new-metric-name');
  const typeInput = document.getElementById('new-metric-type');
  const label = nameInput.value.trim();
  if (!label) return;

  const insertAt = getScoreMetricIndex();
  METRICS.splice(insertAt, 0, {
    label,
    type: typeInput.value === 'penalty' ? 'penalty' : 'metric',
  });

  WEEKLY_DATA.forEach(week => {
    week.forEach(facRows => {
      facRows.forEach(row => row.splice(insertAt, 0, 0));
    });
  });

  await saveEditableData();
  renderEditor();
  refreshDashboard();
}

async function removeMetric(metricIdx) {
  if (!requireAdmin()) return;
  if (METRICS[metricIdx].type === 'score') return;
  if (!confirm(`Удалить показатель "${METRICS[metricIdx].label}" из всех операторов за 4 недели?`)) return;

  METRICS.splice(metricIdx, 1);
  WEEKLY_DATA.forEach(week => {
    week.forEach(facRows => {
      facRows.forEach(row => row.splice(metricIdx, 1));
    });
  });

  await saveEditableData();
  renderEditor();
  refreshDashboard();
}

/* ============================================================
   NAVIGATION
   ============================================================ */
let currentWeek = 4;
let currentView = 'rating';

function setActiveTab(view, weekIdx = null) {
  document.querySelectorAll('.week-tab').forEach(tab => {
    const isRating = view === 'rating' && tab.dataset.view === 'rating';
    const isWeek = view === 'week' && tab.dataset.week === String(weekIdx);
    tab.classList.toggle('active', isRating || isWeek);
  });
}

function setDashboardMode(view) {
  currentView = view;
  const ratingOnly = view === 'rating';
  const sections = [
    ['editor-panel', !ratingOnly && isAdmin],
    ['scoreboard', !ratingOnly],
    ['ranking-list', true],
    ['faculty-grid', !ratingOnly],
  ];

  sections.forEach(([id, visible]) => {
    const el = document.getElementById(id);
    if (el) el.hidden = !visible;
  });

  document.querySelectorAll('.details-intro, .operator-ranking-section').forEach(el => {
    el.hidden = ratingOnly ? !el.classList.contains('operator-ranking-section') : el.classList.contains('operator-ranking-section');
  });
}

async function showRating() {
  setDashboardMode('rating');
  setActiveTab('rating');
  await renderRanking(4);
}

async function showWeek(idx) {
  currentWeek = idx;
  setDashboardMode('week');
  setActiveTab('week', idx);

  await Promise.all([
    renderScoreboard(idx),
    renderFacultyCards(idx),
  ]);
  renderEditor();
}

/* ── Init ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  await loadEditableData();   // ← ждём загрузки с сервера
  loadAdminSession();
  updateAdminGate();
  renderEditor();
  renderScoreboard(4);
  renderFacultyCards(4);
  showRating();
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeAdminModal();
});

document.addEventListener('click', event => {
  const gate = document.getElementById('admin-gate');
  const popover = document.getElementById('admin-popover');
  if (!gate || !popover || popover.hidden) return;
  if (!gate.contains(event.target)) closeAdminModal();
});


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
