  );
  totals.sort((a, b) => b.total - a.total);
  const [first, second] = totals;
  const leaderDiff = second ? first.total - second.total : 0;
  const scoreItems = totals.map((fac, idx) => `
    <div class="score-faculty score-faculty-card">
      <div class="score-rank">#${idx + 1}</div>
      <div class="score-faculty-name">${fac.icon} ${fac.name}</div>
      <div class="score-points ${fac.scoreCls}">${fmtPts(fac.total)}</div>
    </div>
  `).join('');

  document.getElementById('scoreboard').innerHTML = `
    <div class="score-faculty">
      <div class="score-faculty-name">${first.icon} ${first.name}</div>
      <div class="score-points ${first.scoreCls}">${fmtPts(first.total)}</div>
    </div>
    <div class="score-center">
    <div class="scoreboard-header">
      <div class="score-vs">СЧЁТ ФАКУЛЬТЕТОВ</div>
      <div class="score-leader">🏆 Ведёт: ${first.name}</div>
      <div style="font-size:11px;color:rgba(201,168,76,.4);margin-top:4px;font-family:'Cinzel',serif;">
        +${fmtPts(first.total - second.total)} очков
        +${fmtPts(leaderDiff)} очков
      </div>
    </div>
    <div class="score-faculty right">
      <div class="score-faculty-name">${second.icon} ${second.name}</div>
      <div class="score-points ${second.scoreCls}">${fmtPts(second.total)}</div>
    </div>
    <div class="score-list">${scoreItems}</div>
  `;
}
