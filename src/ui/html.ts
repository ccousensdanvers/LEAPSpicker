
export function renderHTML(data: any) {
  const rows = (data?.results ?? [])
    .map((r: any) => {
      const m = r.metrics;
      return `<tr>
        <td>${r.symbol}</td>
        <td>${r.score}</td>
        <td>${m.price.toFixed(2)}</td>
        <td>${m.rsi14.toFixed(1)}</td>
        <td>${(m.hv60*100).toFixed(1)}%</td>
        <td>${(m.mdd1y*100).toFixed(1)}%</td>
        <td>${r.options?.ivRank ?? '—'}</td>
        <td>${r.rationale ? r.rationale : '—'}</td>
      </tr>`;
    })
    .join('\n');
  return `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <title>LEAPS Picks</title>
    <style>
      body { font-family: system-ui, sans-serif; padding: 24px; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #ddd; padding: 8px; vertical-align: top; }
      th { background: #f5f5f5; text-align: left; }
      tr:nth-child(even){ background: #fafafa; }
      .sub { color: #666; font-size: 12px; }
    </style>
  </head>
  <body>
    <h1>LEAPS Candidates</h1>
    <div class="sub">Last run: ${data?.ts ?? '—'}</div>
    <table>
      <thead>
        <tr>
          <th>Symbol</th><th>Score</th><th>Price</th><th>RSI(14)</th><th>HV60</th><th>MDD(1y)</th><th>IV Rank</th><th>Rationale</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="8">No results yet.</td></tr>'}
      </tbody>
    </table>
  </body>
  </html>`;
}
