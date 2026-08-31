/** Tiny SVG doughnut — no chart library */
export function DoughnutChart({
  slices,
  size = 132,
}: {
  slices: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const r = 42;
  const c = 2 * Math.PI * r;
  let offset = 0;

  if (total <= 0) {
    return (
      <div className="pie-wrap">
        <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden>
          <circle cx="60" cy="60" r={r} fill="none" stroke="#efeaf8" strokeWidth="14" />
          <text x="60" y="64" textAnchor="middle" fontSize="12" fill="#6b6580">
            No data
          </text>
        </svg>
        <div className="pie-legend muted">No plan mix yet.</div>
      </div>
    );
  }

  return (
    <div className="pie-wrap">
      <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden>
        <g transform="rotate(-90 60 60)">
          {slices.map((slice) => {
            if (slice.value <= 0) return null;
            const len = (slice.value / total) * c;
            const el = (
              <circle
                key={slice.label}
                cx="60"
                cy="60"
                r={r}
                fill="none"
                stroke={slice.color}
                strokeWidth="14"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
        </g>
        <text x="60" y="58" textAnchor="middle" fontSize="18" fontWeight="700" fill="#1a1625">
          {total}
        </text>
        <text x="60" y="74" textAnchor="middle" fontSize="10" fill="#6b6580">
          sellers
        </text>
      </svg>
      <div className="pie-legend">
        {slices.map((s) => (
          <div key={s.label}>
            <span className="pie-swatch" style={{ background: s.color }} />
            {s.label}: <strong>{s.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrdersBarChart({
  days,
}: {
  days: { label: string; count: number }[];
}) {
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <div className="bar-chart" role="img" aria-label="Orders last 7 days">
      {days.map((d) => (
        <div key={d.label} className="bar-col">
          <span className="bar-val">{d.count}</span>
          <div
            className="bar-fill"
            style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }}
          />
          <span className="bar-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
