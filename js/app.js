
   Структура данных для одного оператора за неделю:
   [КЗЧ, QA, CSat, Эфф%, Часы%, Нарушения, Опоздания, Баллы]
   ============================================================ */
const FACULTIES = [
let FACULTIES = [
  {
    id: 'gryf', cls: 'gryf', icon: '🦁',
    name: 'Гриффиндор',
];

/* Weekly data: [week][faculty][operator] → [КЗЧ,QA,CSat,Эфф%,Часы%,Нар.,Опозд.,Баллы] */
const WEEKLY_DATA = [
let WEEKLY_DATA = [
  // ── Week 1 ─────────────────────────────────────────────────
  [
    [[15,99,5,57,25,1,22,662.5],[22,99,5,70,29,0,26,714.5],[12,82,4,53,34,3,20,535],[23,94,4,48,31,2,24,574],[16,73,5,61,32,2,26,574.5],[7,96,5,47,26,0,29,592],[15,89,4,44,27,0,29,599.5]],
];

const COLS = ['КЗЧ', 'QA', 'CSat', 'Эфф%', 'Часы%', 'Нар.', 'Опозд.', 'Баллы'];
const STORAGE_KEY = 'hpContestEditableData';
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

function normalizeEditableData() {
  const metricCount = METRICS.length;

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

function loadEditableData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.faculties) && Array.isArray(saved.weeklyData) && Array.isArray(saved.metrics)) {
      FACULTIES = saved.faculties;
      WEEKLY_DATA = saved.weeklyData;
      METRICS = saved.metrics;
    }
  } catch (err) {
    console.warn('Не удалось загрузить сохраненные данные', err);
  }

  if (!METRICS.some(metric => metric.type === 'score')) {
    METRICS.push({ label: 'Баллы', type: 'score' });
  }
  normalizeEditableData();
}

function saveEditableData() {
  normalizeEditableData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    faculties: FACULTIES,
    weeklyData: WEEKLY_DATA,
    metrics: METRICS,
  }));
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

/* ============================================================
   DATA LAYER
   При подключении FastAPI замените тело каждой функции на
   MOCK CALCULATIONS (используются только при USE_MOCK = true)
   ============================================================ */
function calcTotals(weekIdx) {
  const scoreIdx = getScoreMetricIndex();
  return FACULTIES.map((fac, fi) =>
    fac.operators.map((name, oi) => ({
      name,
      pts: weekIdx < 4
        ? WEEKLY_DATA[weekIdx][fi][oi][7]
        : [0,1,2,3].reduce((s, w) => s + WEEKLY_DATA[w][fi][oi][7], 0),
        ? (Number(WEEKLY_DATA[weekIdx][fi][oi][scoreIdx]) || 0)
        : [0,1,2,3].reduce((s, w) => s + (Number(WEEKLY_DATA[w][fi][oi][scoreIdx]) || 0), 0),
    }))
  );
}

function getFacultyTotal(facIdx, weekIdx) {
  const scoreIdx = getScoreMetricIndex();
  if (weekIdx < 4) {
    return WEEKLY_DATA[weekIdx][facIdx].reduce((s, r) => s + r[7], 0);
    return WEEKLY_DATA[weekIdx][facIdx].reduce((s, r) => s + (Number(r[scoreIdx]) || 0), 0);
  }
  return [0,1,2,3].reduce((sum, w) =>
    sum + WEEKLY_DATA[w][facIdx].reduce((s, r) => s + r[7], 0), 0
    sum + WEEKLY_DATA[w][facIdx].reduce((s, r) => s + (Number(r[scoreIdx]) || 0), 0), 0
  );
}

async function renderFacultyCards(weekIdx) {
  const grid = document.getElementById('faculty-grid');
  const allTotals = await fetchScores(weekIdx);
  const maxPts = Math.max(...allTotals.flat().map(o => o.pts));
  const maxPts = Math.max(1, ...allTotals.flat().map(o => o.pts));

  const colHeaders = weekIdx < 4
    ? COLS.slice(0, 7).map(c => `<th>${c}</th>`).join('') + '<th>Баллы</th>'
    ? METRICS.map(metric => `<th>${escapeHtml(metric.label)}</th>`).join('')
    : '<th>Баллы (итого)</th>';

  let html = '';
      if (weekIdx < 4) {
        const origIdx = fac.operators.indexOf(op.name);
        const row = WEEKLY_DATA[weekIdx][fi][origIdx];
        metricCells = row.slice(0, 7).map((v, i) => {
          if (i === 5 && v > 0) return `<td class="neg">-${v}</td>`;
          if (i === 6 && v > 0) return `<td class="neg">${v}'</td>`;
          return `<td>${v}</td>`;
        metricCells = METRICS.map((metric, i) => {
          const value = row[i] ?? 0;
          if (metric.type === 'score') {
            return `
              <td>
                <div class="score-bar-wrap">
                  <div class="score-bar">
                    <div class="score-bar-fill" style="width:${pct}%"></div>
                  </div>
                  <span class="pts-value">${fmtPts(op.pts)}</span>
                </div>
              </td>`;
          }

          const cls = metric.type === 'penalty' && Number(value) > 0 ? ' class="neg"' : '';
          return `<td${cls}>${formatMetricValue(value, metric)}</td>`;
        }).join('');
      }

      return `
        <tr>
          <td>${buildRankBadge(globalRank)}${op.name}</td>
          <td>${buildRankBadge(globalRank)}${escapeHtml(op.name)}</td>
          ${metricCells}
          <td>
          ${weekIdx < 4 ? '' : `<td>
            <div class="score-bar-wrap">
              <div class="score-bar">
                <div class="score-bar-fill" style="width:${pct}%"></div>
              </div>
              <span class="pts-value">${fmtPts(op.pts)}</span>
            </div>
          </td>
          </td>`}
        </tr>`;
    }).join('');

    const colspan = weekIdx < 4 ? 9 : 2;
    const colspan = weekIdx < 4 ? METRICS.length : 1;

    html += `
      <div class="faculty-card ${fac.cls}">
    return `
      <div class="ranking-row">
        <div class="ranking-pos" style="color:${color}">${pos}</div>
        <div class="ranking-name">${op.name}</div>
        <div class="ranking-faculty-tag ${op.fac.tagCls}">${op.fac.icon} ${op.fac.name}</div>
        <div class="ranking-name">${escapeHtml(op.name)}</div>
        <div class="ranking-faculty-tag ${op.fac.tagCls}">${op.fac.icon} ${escapeHtml(op.fac.name)}</div>
        <div class="ranking-pts ${op.fac.scoreCls}">${fmtPts(op.pts)}</div>
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
          <div class="editor-faculty-name">${fac.icon} ${escapeHtml(fac.name)}</div>
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
                ${METRICS.map(metric => `<th>${escapeHtml(metric.label)}</th>`).join('')}
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

function updateOperatorName(facIdx, opIdx, value) {
  FACULTIES[facIdx].operators[opIdx] = value.trim() || `Оператор ${opIdx + 1}`;
  saveEditableData();
  refreshDashboard();
}

function updateOperatorMetric(weekIdx, facIdx, opIdx, metricIdx, value) {
  WEEKLY_DATA[weekIdx][facIdx][opIdx][metricIdx] = Number(value) || 0;
  saveEditableData();
  refreshDashboard();
}

function addOperator(facIdx) {
  const input = document.getElementById(`new-operator-${facIdx}`);
  const name = input.value.trim();
  if (!name) return;

  FACULTIES[facIdx].operators.push(name);
  WEEKLY_DATA.forEach(week => {
    week[facIdx].push(Array(METRICS.length).fill(0));
  });

  saveEditableData();
  renderEditor();
  refreshDashboard();
}

function removeOperator(facIdx, opIdx) {
  const name = FACULTIES[facIdx].operators[opIdx];
  if (!confirm(`Удалить оператора "${name}" и все его показатели за 4 недели?`)) return;

  FACULTIES[facIdx].operators.splice(opIdx, 1);
  WEEKLY_DATA.forEach(week => week[facIdx].splice(opIdx, 1));

  saveEditableData();
  renderEditor();
  refreshDashboard();
}

function updateMetricLabel(metricIdx, value) {
  METRICS[metricIdx].label = value.trim() || `Показатель ${metricIdx + 1}`;
  saveEditableData();
  refreshDashboard();
}

function updateMetricType(metricIdx, value) {
  if (METRICS[metricIdx].type === 'score') return;
  METRICS[metricIdx].type = value === 'penalty' ? 'penalty' : 'metric';
  saveEditableData();
  refreshDashboard();
}

function addMetric() {
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

  saveEditableData();
  renderEditor();
  refreshDashboard();
}

function removeMetric(metricIdx) {
  if (METRICS[metricIdx].type === 'score') return;
  if (!confirm(`Удалить показатель "${METRICS[metricIdx].label}" из всех операторов за 4 недели?`)) return;

  METRICS.splice(metricIdx, 1);
  WEEKLY_DATA.forEach(week => {
    week.forEach(facRows => {
      facRows.forEach(row => row.splice(metricIdx, 1));
    });
  });

  saveEditableData();
  renderEditor();
  refreshDashboard();
}

/* ============================================================
   NAVIGATION
   ============================================================ */
    renderFacultyCards(idx),
    renderRanking(idx),
  ]);
  renderEditor();
}

/* ── Init ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => showWeek(4));
document.addEventListener('DOMContentLoaded', () => {
  loadEditableData();
  showWeek(4);
});


/* ============================================================
