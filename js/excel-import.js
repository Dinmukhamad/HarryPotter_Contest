/**
 * excel-import.js
 *
 * Парсит Excel-файл формата «Таблица_для_конкурса.xlsx» и заполняет
 * выбранную неделю на сайте. Формула расчёта баллов на сайте НЕ
 * используется — итоговый балл берётся напрямую из Excel (колонка
 * «ИТОГО БАЛЛОВ»).
 *
 * Ожидаемая структура файла:
 *   Строка 1: «ОТЧЁТ ПО ПОКАЗАТЕЛЯМ ОПЕРАТОРОВ …» (любой заголовок)
 *   Строка 2: основная шапка (категории)
 *   Строка 3: подзаголовки (Значение / Баллы / Минуты и т.п.)
 *   Строка 4..N: данные операторов
 *
 * Колонки данных (1-индексированные как в Excel):
 *   B = имя оператора
 *   C = КАЧЕСТВО (значение)
 *   E = ОЦЕНКА КЛИЕНТА (значение)
 *   G = ВЫРАБОТКА % (значение)
 *   I = ЭФФЕКТИВНОСТЬ % (значение)
 *   K = ОПОЗДАНИЯ (минуты)
 *   M = ПОСТОРОННИЕ САЙТЫ (факты)
 *   N = ИТОГО БАЛЛОВ
 *
 * Привязка имени к факультету:
 *   - Имя из Excel ищется в operators всех факультетов в data.json
 *   - Если найдено → пишем значения в эту строку выбранной недели
 *   - Если не найдено → строка пропускается с предупреждением
 *     (новый оператор должен сначала быть добавлен через админ-панель
 *     с привязкой к нужному факультету)
 */

'use strict';

/* ── Структура колонок Excel (0-индексированно) ─────────────
   Соответствует фиксированному формату «Таблица_для_конкурса.xlsx».
   Изменение порядка/количества колонок в Excel потребует правки этих
   констант. */
const EXCEL_LAYOUT = {
  nameCol:    1,   // B — ФИО оператора
  metricCols: [
    { excelCol: 2,  metricIdx: 0 },  // C → Качество
    { excelCol: 4,  metricIdx: 1 },  // E → Оценка
    { excelCol: 6,  metricIdx: 2 },  // G → Выработка %
    { excelCol: 8,  metricIdx: 3 },  // I → Эфф. %
    { excelCol: 10, metricIdx: 4 },  // K → Опозд. (мин)
    { excelCol: 12, metricIdx: 5 },  // M → Сайты
  ],
  scoreCol:   13,  // N — ИТОГО БАЛЛОВ
  /* Заголовочные строки, которые пропускаются при парсинге.
     Парсер ищет первую строку, где колонка B содержит непустое имя
     и колонка A (№) — число. */
  firstDataRowMin: 3, // данные начинаются не раньше 4-й строки Excel (индекс 3)
};

/* ── Утилиты ─────────────────────────────────────────────── */
function norm(str) {
  return String(str || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function toNum(v) {
  if (v === null || v === undefined || v === '') return 0;
  const n = parseFloat(String(v).replace(/\s/g, '').replace('%', '').replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

/* Ищет оператора во всех факультетах по нормализованному имени.
   Возвращает { facIdx, opIdx } или null. */
function findOperator(rawName) {
  const target = norm(rawName);
  for (let fi = 0; fi < FACULTIES.length; fi++) {
    const ops = FACULTIES[fi].operators || [];
    for (let oi = 0; oi < ops.length; oi++) {
      if (norm(ops[oi]) === target) {
        return { facIdx: fi, opIdx: oi };
      }
    }
  }
  return null;
}

/* Показывает сообщение внутри импорт-модала */
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
  if (typeof XLSX === 'undefined') {
    setImportStatus('Библиотека Excel не загрузилась. Обновите страницу и попробуйте ещё раз.', 'error');
    return;
  }

  setImportStatus('Читаю файл…');

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      if (workbook.SheetNames.length === 0) {
        setImportStatus('В файле нет ни одного листа.', 'error');
        return;
      }

      const noticeMultiSheet = workbook.SheetNames.length > 1
        ? `Файл содержит ${workbook.SheetNames.length} листов. Импортирую первый: «${workbook.SheetNames[0]}».`
        : '';

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows  = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true });

      if (rows.length < EXCEL_LAYOUT.firstDataRowMin + 1) {
        setImportStatus('Файл слишком короткий — нет строк с данными.', 'error');
        return;
      }

      const metricCount = METRICS.length;
      const scoreIdx    = getScoreMetricIndex();

      let imported = 0;
      let skipped  = 0;
      const warnings = [];
      const missingOperators = [];

      /* Идём со строки 4 (индекс 3), но если первая строка с числом в A
         встречается позже — стартуем оттуда. */
      let startRow = EXCEL_LAYOUT.firstDataRowMin;
      for (let r = EXCEL_LAYOUT.firstDataRowMin; r < rows.length; r++) {
        const numCell  = rows[r] && rows[r][0];
        const nameCell = rows[r] && rows[r][EXCEL_LAYOUT.nameCol];
        if (numCell !== null && numCell !== undefined && !isNaN(parseFloat(numCell))
            && nameCell && String(nameCell).trim()) {
          startRow = r;
          break;
        }
      }

      for (let r = startRow; r < rows.length; r++) {
        const row = rows[r];
        if (!row) { continue; }

        const rawName = row[EXCEL_LAYOUT.nameCol];
        if (!rawName || !String(rawName).trim()) {
          // Пустая строка — конец данных, прекращаем
          break;
        }

        const op = findOperator(rawName);
        if (!op) {
          missingOperators.push(String(rawName).trim());
          skipped++;
          continue;
        }

        /* Гарантируем существование строки */
        if (!WEEKLY_DATA[weekIndex])              WEEKLY_DATA[weekIndex] = [];
        if (!WEEKLY_DATA[weekIndex][op.facIdx])   WEEKLY_DATA[weekIndex][op.facIdx] = [];
        if (!WEEKLY_DATA[weekIndex][op.facIdx][op.opIdx]) {
          WEEKLY_DATA[weekIndex][op.facIdx][op.opIdx] = Array(metricCount).fill(0);
        }

        const arr = WEEKLY_DATA[weekIndex][op.facIdx][op.opIdx];

        /* Заполняем 6 метрик */
        EXCEL_LAYOUT.metricCols.forEach(({ excelCol, metricIdx }) => {
          if (metricIdx < arr.length) {
            arr[metricIdx] = toNum(row[excelCol]);
          }
        });

        /* Итоговый балл — напрямую из Excel, никаких пересчётов */
        const scoreFromExcel = toNum(row[EXCEL_LAYOUT.scoreCol]);
        arr[scoreIdx] = Math.round(scoreFromExcel * 10) / 10;

        imported++;
      }

      if (imported === 0) {
        let msg = 'Ни одна строка не была импортирована.';
        if (missingOperators.length) {
          msg += ` Ни одно имя из файла не совпало со списком операторов на сайте.`;
        }
        setImportStatus(msg, 'error');
        return;
      }

      /* ── Сохранение ──────────────────────────────────── */
      saveEditableData().then(() => {
        renderScoreboard(currentWeek);
        renderFacultyCards(currentWeek);
        renderEditor();

        let msg = `✅ Импорт завершён: ${imported} операторов загружено в «${getPeriodLabel(weekIndex)}»`;
        if (skipped) msg += `, ${skipped} пропущено`;
        if (noticeMultiSheet) msg += `\n${noticeMultiSheet}`;
        if (missingOperators.length) {
          const sample = missingOperators.slice(0, 5).join(', ');
          msg += `\n⚠ Не найдены в системе: ${sample}`;
          if (missingOperators.length > 5) msg += ` … и ещё ${missingOperators.length - 5}`;
          msg += `\n(Добавьте этих операторов через админ-панель в нужный факультет)`;
        }
        setImportStatus(msg, missingOperators.length ? 'warn' : 'success');
      }).catch(err => {
        setImportStatus(`Импорт прошёл, но не удалось сохранить: ${err.message}`, 'error');
      });

    } catch (err) {
      console.error('[excel-import]', err);
      setImportStatus(`Ошибка при разборе файла: ${err.message}`, 'error');
    }
  };

  reader.onerror = () => setImportStatus('Не удалось прочитать файл.', 'error');
  reader.readAsArrayBuffer(file);
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
