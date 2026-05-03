/**
 * excel-import.js
 * Парсит Excel-файл прямо в браузере (SheetJS) и заполняет
 * WEEKLY_DATA + FACULTIES для выбранной недели.
 *
 * Ожидаемые колонки в файле (порядок не важен, распознаются по заголовку):
 *   Факультет | Оператор | КВЗ (или КЗЧ) | QA | CSAT (или CSat) |
 *   Эффективность (или Эфф%) | Часы (или Часы%) | Опоздания (или Опозд.) |
 *   Просмотр посторонних сайтов (или Нар.) | Баллы (опционально)
 *
 * Если колонка «Баллы» отсутствует — баллы вычисляются по формуле сайта.
 */

'use strict';

/* ── Сопоставление заголовков Excel → индекс метрики ──────
   Порядок метрик в METRICS / WEEKLY_DATA:
   0:КЗЧ  1:QA  2:CSat  3:Эфф%  4:Часы%  5:Нар.  6:Опозд.  7:Баллы
   ---------------------------------------------------------- */
const EXCEL_COL_MAP = {
  // Различные варианты написания → индекс в массиве метрик
  'квз':                            0,
  'кзч':                            0,
  'кво':                            0,
  'qa':                             1,
  'csat':                           2,
  'ccat':                           2,
  'csат':                           2,
  'эффективность':                  3,
  'эфф%':                           3,
  'эфф':                            3,
  'часы':                           4,
  'часы%':                          4,
  'опоздания':                      6,
  'опозд.':                         6,
  'опозд':                          6,
  'просмотр посторонних сайтов':    5,
  'нар.':                           5,
  'нар':                            5,
  'нарушения':                      5,
  'баллы':                          7,  // необязательный
};

/* Сопоставление названий факультетов в Excel → id в FACULTIES */
const FACULTY_NAME_MAP = {
  'гриффиндор': 'gryf',
  'griffindor': 'gryf',
  'gryffindor': 'gryf',
  'слизерин':   'slyth',
  'slytherin':  'slyth',
  'пуффендуй':  'huff',
  'hufflepuff': 'huff',
  'когтевран':  'raven',
  'ravenclaw':  'raven',
};

/* ── Утилиты ─────────────────────────────────────────────── */
function norm(str) {
  return String(str || '').trim().toLowerCase();
}

function toNum(v) {
  if (v === null || v === undefined || v === '') return 0;
  const n = parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

/* Показывает сообщение внутри модала импорта */
function setImportStatus(msg, type = 'info') {
  const el = document.getElementById('import-status');
  if (!el) return;
  if (!msg) {
    el.textContent = '';
    el.style.display = 'none';
    return;
  }
  el.textContent = msg;
  el.className = `import-status import-status--${type}`;
  el.style.display = 'block';
  el.removeAttribute('hidden');
}

/* ── Основная функция парсинга ───────────────────────────── */
function parseExcelAndApply(file, weekIndex) {
  setImportStatus('Читаю файл…');

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      /* Берём первый лист */
      const sheetName = workbook.SheetNames[0];
      const sheet     = workbook.Sheets[sheetName];
      const rows      = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

      if (rows.length < 2) {
        setImportStatus('Файл пустой или содержит только заголовок.', 'error');
        return;
      }

      /* ── Разбираем заголовок ─────────────────────────── */
      const headerRow = rows[0].map(h => norm(h));

      const colFaculty  = headerRow.indexOf('факультет');
      const colOperator = headerRow.findIndex(h => ['оператор', 'фио', 'имя'].includes(h));

      if (colFaculty === -1 || colOperator === -1) {
        setImportStatus('Не найдены колонки «Факультет» и/или «Оператор».', 'error');
        return;
      }

      /* Метрические колонки: заголовок → индекс метрики */
      const metricColIndexes = {}; // колонка в Excel → индекс в METRICS
      headerRow.forEach((h, colIdx) => {
        if (colIdx === colFaculty || colIdx === colOperator) return;
        const metricIdx = EXCEL_COL_MAP[h];
        if (metricIdx !== undefined) {
          metricColIndexes[colIdx] = metricIdx;
        }
      });

      if (Object.keys(metricColIndexes).length === 0) {
        setImportStatus('Не найдено ни одной метрической колонки.', 'error');
        return;
      }

      /* ── Разбираем строки данных ──────────────────────── */
      const metricCount = METRICS.length; // из app.js (глобальная)
      const scoreIdx    = getScoreMetricIndex(); // из app.js

      let imported = 0;
      let skipped  = 0;
      const warnings = [];

      rows.slice(1).forEach((row, rowNum) => {
        const facRaw  = norm(row[colFaculty]);
        const opRaw   = String(row[colOperator] || '').trim();

        if (!facRaw || !opRaw) { skipped++; return; }

        /* Найти факультет по имени */
        const facId  = FACULTY_NAME_MAP[facRaw];
        if (!facId) {
          warnings.push(`Строка ${rowNum + 2}: неизвестный факультет «${row[colFaculty]}»`);
          skipped++;
          return;
        }

        const facIdx = FACULTIES.findIndex(f => f.id === facId);
        if (facIdx === -1) { skipped++; return; }

        /* Найти оператора в списке факультета */
        const opIdx = FACULTIES[facIdx].operators.findIndex(
          op => norm(op) === norm(opRaw)
        );

        if (opIdx === -1) {
          /* Оператора нет — добавляем в список факультета */
          FACULTIES[facIdx].operators.push(opRaw);
          /* normalizeEditableData расширит WEEKLY_DATA */
          normalizeEditableData();
          const newIdx = FACULTIES[facIdx].operators.length - 1;
          fillOperatorRow(newIdx, facIdx, weekIndex, row, metricColIndexes, metricCount, scoreIdx);
          warnings.push(`Оператор «${opRaw}» добавлен в ${FACULTIES[facIdx].name}`);
          imported++;
          return;
        }

        fillOperatorRow(opIdx, facIdx, weekIndex, row, metricColIndexes, metricCount, scoreIdx);
        imported++;
      });

      /* ── Сохранение ──────────────────────────────────── */
      saveEditableData().then(() => {
        /* Перерендер текущего экрана */
        renderScoreboard(currentWeek);
        renderFacultyCards(currentWeek);
        showRating();

        let msg = `✅ Импорт завершён: ${imported} строк загружено`;
        if (skipped)        msg += `, ${skipped} пропущено`;
        if (warnings.length) msg += `\n⚠ ${warnings.slice(0, 3).join('\n')}`;
        if (warnings.length > 3) msg += `\n… и ещё ${warnings.length - 3} предупреждений`;
        setImportStatus(msg, warnings.length ? 'warn' : 'success');
      });

    } catch (err) {
      console.error('[excel-import]', err);
      setImportStatus(`Ошибка при разборе файла: ${err.message}`, 'error');
    }
  };

  reader.onerror = () => setImportStatus('Не удалось прочитать файл.', 'error');
  reader.readAsArrayBuffer(file);
}

/* Заполняет одну строку оператора данными из Excel-строки */
function fillOperatorRow(opIdx, facIdx, weekIndex, excelRow, metricColIndexes, metricCount, scoreIdx) {
  /* Убедимся что массив существует */
  if (!WEEKLY_DATA[weekIndex])          WEEKLY_DATA[weekIndex] = [];
  if (!WEEKLY_DATA[weekIndex][facIdx])  WEEKLY_DATA[weekIndex][facIdx] = [];
  if (!WEEKLY_DATA[weekIndex][facIdx][opIdx]) {
    WEEKLY_DATA[weekIndex][facIdx][opIdx] = Array(metricCount).fill(0);
  }

  const arr = WEEKLY_DATA[weekIndex][facIdx][opIdx];

  /* Заполняем метрики */
  let hasExplicitScore = false;
  Object.entries(metricColIndexes).forEach(([colIdx, metricIdx]) => {
    const val = toNum(excelRow[+colIdx]);
    if (metricIdx < arr.length) {
      arr[metricIdx] = val;
      if (metricIdx === scoreIdx) hasExplicitScore = true;
    }
  });

  /* Если баллы не заданы явно — не трогаем (пусть останутся 0 или старое значение) */
  /* Если нужна автоформула — раскомментируйте блок ниже:
  if (!hasExplicitScore) {
    arr[scoreIdx] = 0; // здесь можно вставить вашу формулу
  }
  */
}

/* ── UI: инициализация кнопки и обработчика ─────────────── */
function initExcelImport() {
  const fileInput  = document.getElementById('excel-file-input');
  const weekSelect = document.getElementById('import-week-select');
  const importBtn  = document.getElementById('excel-import-btn');

  if (!fileInput || !weekSelect || !importBtn) return;

  importBtn.addEventListener('click', () => {
    const file = fileInput.files[0];
    if (!file) {
      setImportStatus('Выберите файл Excel (.xlsx или .xls)', 'error');
      return;
    }
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'ods'].includes(ext)) {
      setImportStatus('Поддерживаются только .xlsx, .xls и .ods', 'error');
      return;
    }
    const weekIdx = parseInt(weekSelect.value, 10);
    setImportStatus('');
    parseExcelAndApply(file, weekIdx);
  });

  /* Обновляем имя файла и сбрасываем статус при смене */
  fileInput.addEventListener('change', () => {
    const nameEl = document.getElementById('excel-file-name');
    if (nameEl) nameEl.textContent = fileInput.files[0]?.name || 'Выберите файл…';
    setImportStatus('');
  });
}

document.addEventListener('DOMContentLoaded', initExcelImport);
