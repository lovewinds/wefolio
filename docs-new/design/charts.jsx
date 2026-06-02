/* ============================================================================
   WeFolio — SVG chart primitives + Icon helper. Exported to window.
   No external chart lib: hand-built SVG, warm-tuned, theme-aware via currentColor
   and CSS vars resolved at render. Hover tooltips inside a relative container.
   ========================================================================== */
const {
  useState: useStateC,
  useRef: useRefC,
  useLayoutEffect: useLayoutEffectC,
  useEffect: useEffectC,
} = React;

/* ---- Lucide icon helper ---- */
function Icon({ name, size = 18, color, style, className }) {
  const ref = useRefC(null);
  useLayoutEffectC(() => {
    if (ref.current) {
      ref.current.innerHTML = '<i data-lucide="' + name + '"></i>';
      if (window.lucide) window.lucide.createIcons({ attrs: { 'stroke-width': 1.75 } });
    }
  });
  return (
    <span
      ref={ref}
      className={'wf-ic ' + (className || '')}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        color,
        ...style,
      }}
    />
  );
}

/* resolve a CSS custom property to a concrete color (for SVG fills/strokes) */
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888';
}

/* ---- shared tooltip ---- */
function useTip() {
  const [tip, setTip] = useStateC(null);
  const node = tip ? (
    <div className={'tt show'} style={{ left: tip.x, top: tip.y }}>
      <div className="ttk">{tip.k}</div>
      <div className="ttv">{tip.v}</div>
    </div>
  ) : null;
  return [setTip, node];
}

/* ============================ DONUT ============================ */
function Donut({ data, size = 168, thickness = 26, center }) {
  const [setTip, tipNode] = useTip();
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2,
    cx = size / 2,
    cy = size / 2,
    circ = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--surface-sunk)"
          strokeWidth={thickness}
        />
        {data.map((d, i) => {
          const frac = d.value / total;
          const dash = frac * circ;
          const seg = (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={thickness}
              strokeDasharray={`${Math.max(dash - 2, 0)} ${circ - Math.max(dash - 2, 0)}`}
              strokeDashoffset={-acc}
              strokeLinecap="butt"
              style={{
                transition: 'stroke-dasharray .5s ease, stroke-dashoffset .5s ease',
                cursor: 'pointer',
              }}
              onMouseMove={e =>
                setTip({
                  x: e.clientX,
                  y: e.clientY,
                  k: d.key,
                  v: window.WF.wonShort(d.value) + ' · ' + window.WF.pct(frac),
                })
              }
              onMouseLeave={() => setTip(null)}
            />
          );
          acc += dash;
          return seg;
        })}
      </svg>
      {center && <div className="donut-center">{center}</div>}
      {tipNode}
    </div>
  );
}

/* ============================ LEGEND ============================ */
function Legend({ data, total, fmt }) {
  const sum = total || data.reduce((s, d) => s + d.value, 0) || 1;
  const f = fmt || window.WF.wonShort;
  return (
    <div className="legend">
      {data.map((d, i) => (
        <div className="lrow" key={i}>
          <span className="swatch" style={{ background: d.color }} />
          <span className="lk">{d.key}</span>
          <span className="lv num">{f(d.value)}</span>
          <span className="lp">{window.WF.pct(d.value / sum, 0)}</span>
        </div>
      ))}
    </div>
  );
}

/* ============================ LINE CHART (time series) ============================ */
/* series: [{ key, color, values:[..], area? }], xLabels:[..] */
function LineChart({ series, xLabels, height = 240, fmt }) {
  const [setTip, tipNode] = useTip();
  const [w, setW] = useStateC(680);
  const wrapRef = useRefC(null);
  useLayoutEffectC(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  const f = fmt || window.WF.wonShort;
  const padL = 8,
    padR = 8,
    padT = 14,
    padB = 8;
  const innerW = Math.max(w - padL - padR, 10),
    innerH = height - padT - padB;
  const all = series.flatMap(s => s.values);
  const maxV = Math.max(...all) * 1.08,
    minV = Math.min(...all, 0) * 0.98;
  const n = xLabels.length;
  const x = i => padL + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = v => padT + innerH - ((v - minV) / (maxV - minV || 1)) * innerH;
  const [hi, setHi] = useStateC(null);
  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <svg width={w} height={height} style={{ display: 'block', overflow: 'visible' }}>
        {/* gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((g, i) => (
          <line
            key={i}
            x1={padL}
            x2={w - padR}
            y1={padT + g * innerH}
            y2={padT + g * innerH}
            stroke="var(--hairline-soft)"
            strokeWidth={1}
          />
        ))}
        {series.map((s, si) => {
          const pts = s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
          const areaPath =
            `M ${x(0)},${y(s.values[0])} ` +
            s.values.map((v, i) => `L ${x(i)},${y(v)}`).join(' ') +
            ` L ${x(n - 1)},${padT + innerH} L ${x(0)},${padT + innerH} Z`;
          return (
            <g key={si}>
              {s.area && <path d={areaPath} fill={s.color} opacity={0.1} />}
              <polyline
                points={pts}
                fill="none"
                stroke={s.color}
                strokeWidth={s.width || 2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray={s.dash || 'none'}
              />
              {s.values.map((v, i) => (
                <circle
                  key={i}
                  cx={x(i)}
                  cy={y(v)}
                  r={hi === i ? 5 : 3.2}
                  fill="var(--surface)"
                  stroke={s.color}
                  strokeWidth={2}
                  style={{ transition: 'r .12s' }}
                />
              ))}
            </g>
          );
        })}
        {/* hover columns */}
        {xLabels.map((lb, i) => (
          <rect
            key={i}
            x={x(i) - innerW / (2 * n)}
            y={0}
            width={innerW / n}
            height={height}
            fill="transparent"
            onMouseEnter={e => {
              setHi(i);
              setTip({
                x: e.clientX,
                y: e.clientY,
                k: lb,
                v: series.map(s => s.key + ' ' + f(s.values[i])).join(' · '),
              });
            }}
            onMouseMove={e =>
              setTip({
                x: e.clientX,
                y: e.clientY,
                k: lb,
                v: series.map(s => s.key + ' ' + f(s.values[i])).join(' · '),
              })
            }
            onMouseLeave={() => {
              setHi(null);
              setTip(null);
            }}
          />
        ))}
      </svg>
      <div className="axis-x">
        {xLabels.map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
      {tipNode}
    </div>
  );
}

/* ============================ WATERFALL ============================ */
/* steps: [{ key, type:'total'|'pos'|'neg', value, base, color }] base = running start for floating bars */
function Waterfall({ start, savings, market, end, height = 300, labels }) {
  const [setTip, tipNode] = useTip();
  const [w, setW] = useStateC(620);
  const wrapRef = useRefC(null);
  useLayoutEffectC(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  const accC = cssVar('--acc') || cssVar('--accent');
  const gain = cssVar('--gain');
  const inkSoft = cssVar('--surface-sunk');
  const L = labels || {
    start: '시작 총자산',
    savings: '+ 저축·납입',
    market: '+ 투자수익',
    end: '끝 총자산',
  };
  // build bars
  const afterSave = start + savings;
  const bars = [
    { key: L.start, lo: 0, hi: start, color: 'var(--ink-subtle)', kind: 'total', val: start },
    savings >= 0
      ? { key: L.savings, lo: start, hi: afterSave, color: gain, kind: 'flow', val: savings }
      : {
          key: L.savings,
          lo: afterSave,
          hi: start,
          color: 'var(--loss)',
          kind: 'flow',
          val: savings,
        },
    market >= 0
      ? {
          key: L.market,
          lo: afterSave,
          hi: afterSave + market,
          color: accC,
          kind: 'flow',
          val: market,
        }
      : {
          key: L.market,
          lo: afterSave + market,
          hi: afterSave,
          color: 'var(--loss)',
          kind: 'flow',
          val: market,
        },
    { key: L.end, lo: 0, hi: end, color: 'var(--ink)', kind: 'total', val: end },
  ];
  const padT = 30,
    padB = 44,
    padL = 8,
    padR = 8;
  const innerH = height - padT - padB,
    innerW = Math.max(w - padL - padR, 10);
  // zoomed (broken-axis) baseline so small period deltas stay legible vs the large base
  const allVals = [start, end, afterSave, afterSave + market, 0];
  const hiV = Math.max(...allVals),
    loV = Math.min(...allVals.filter(v => v > 0));
  const spanRef = Math.max(Math.abs(savings) + Math.abs(market), hiV - loV, 1);
  const base = Math.max(0, loV - spanRef * 1.1);
  const maxV = hiV + spanRef * 0.35;
  const yv = v => padT + innerH - ((Math.max(v, base) - base) / (maxV - base)) * innerH;
  const broken = base > 0;
  const slot = innerW / bars.length,
    bw = Math.min(slot * 0.58, 110);
  const axisY = padT + innerH;
  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <svg width={w} height={height} style={{ display: 'block', overflow: 'visible' }}>
        <line
          x1={padL}
          x2={w - padR}
          y1={axisY}
          y2={axisY}
          stroke="var(--hairline)"
          strokeWidth={1}
        />
        {broken && (
          <text
            x={padL}
            y={12}
            fontSize="10"
            fontFamily="var(--font-mono)"
            fill="var(--ink-subtle)"
          >
            ⁓ y축 {window.WF.wonShort(base)}부터 · 구간 확대
          </text>
        )}
        {bars.map((b, i) => {
          const cx = padL + slot * i + slot / 2;
          const top = yv(b.hi),
            bot = yv(b.lo);
          const h = Math.max(bot - top, 2);
          return (
            <g key={i}>
              {/* connector */}
              {i > 0 && i < bars.length && (
                <line
                  x1={padL + slot * (i - 1) + slot / 2 + bw / 2}
                  x2={cx - bw / 2}
                  y1={yv(bars[i - 1].kind === 'total' ? bars[i - 1].hi : bars[i - 1].hi)}
                  y2={yv(bars[i - 1].kind === 'total' ? bars[i - 1].hi : bars[i - 1].hi)}
                  stroke="var(--hairline-strong)"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                />
              )}
              <rect
                x={cx - bw / 2}
                y={top}
                width={bw}
                height={h}
                rx={6}
                fill={b.color}
                style={{ cursor: 'pointer' }}
                onMouseMove={e =>
                  setTip({
                    x: e.clientX,
                    y: e.clientY,
                    k: b.key,
                    v: b.kind === 'flow' ? window.WF.signedShort(b.val) : window.WF.wonShort(b.val),
                  })
                }
                onMouseLeave={() => setTip(null)}
              />
              <text
                x={cx}
                y={top - 8}
                textAnchor="middle"
                fontSize="12.5"
                fontWeight="600"
                fontFamily="var(--font-display)"
                fill="var(--ink)"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {b.kind === 'flow' ? window.WF.signedShort(b.val) : window.WF.wonShort(b.val)}
              </text>
              <text
                x={cx}
                y={height - 22}
                textAnchor="middle"
                fontSize="11.5"
                fill="var(--ink-muted)"
                fontWeight="500"
              >
                {b.key}
              </text>
            </g>
          );
        })}
      </svg>
      {tipNode}
    </div>
  );
}

/* ============================ STACKED CONTRIBUTION BARS (monthly) ============================ */
/* rows: [{ label, savings, market }] */
function StackedBars({ rows, height = 260 }) {
  const [setTip, tipNode] = useTip();
  const [w, setW] = useStateC(620);
  const wrapRef = useRefC(null);
  useLayoutEffectC(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  const accC = cssVar('--acc') || cssVar('--accent');
  const gain = cssVar('--gain'),
    loss = cssVar('--loss');
  const padT = 18,
    padB = 30,
    padL = 8,
    padR = 8;
  const innerH = height - padT - padB,
    innerW = Math.max(w - padL - padR, 10);
  const tops = rows.map(r => Math.max(r.savings, 0) + Math.max(r.market, 0));
  const bots = rows.map(r => Math.min(r.savings, 0) + Math.min(r.market, 0));
  const maxV = Math.max(...tops, 1) * 1.1,
    minV = Math.min(...bots, 0) * 1.1;
  const yv = v => padT + innerH - ((v - minV) / (maxV - minV || 1)) * innerH;
  const slot = innerW / rows.length,
    bw = Math.min(slot * 0.5, 46);
  const seg = (k, cx, lo, hi, color, key, val) => {
    const top = yv(hi),
      bot = yv(lo);
    return (
      <rect
        key={k}
        x={cx - bw / 2}
        y={top}
        width={bw}
        height={Math.max(bot - top, 0)}
        fill={color}
        style={{ cursor: 'pointer' }}
        onMouseMove={e =>
          setTip({ x: e.clientX, y: e.clientY, k: key, v: window.WF.signedShort(val) })
        }
        onMouseLeave={() => setTip(null)}
      />
    );
  };
  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <svg width={w} height={height} style={{ display: 'block', overflow: 'visible' }}>
        <line
          x1={padL}
          x2={w - padR}
          y1={yv(0)}
          y2={yv(0)}
          stroke="var(--hairline)"
          strokeWidth={1}
        />
        {rows.map((r, i) => {
          const cx = padL + slot * i + slot / 2;
          const sv = r.savings,
            mk = r.market;
          let posAcc = 0,
            negAcc = 0;
          const parts = [];
          // savings
          if (sv >= 0) {
            parts.push(seg('s', cx, posAcc, posAcc + sv, sv >= 0 ? gain : loss, '저축·납입', sv));
            posAcc += sv;
          } else {
            parts.push(seg('s', cx, negAcc - Math.abs(sv), negAcc, loss, '저축·납입', sv));
            negAcc -= Math.abs(sv);
          }
          // market
          if (mk >= 0) {
            parts.push(seg('m', cx, posAcc, posAcc + mk, accC, '투자수익', mk));
            posAcc += mk;
          } else {
            parts.push(seg('m', cx, negAcc - Math.abs(mk), negAcc, loss, '투자수익', mk));
            negAcc -= Math.abs(mk);
          }
          return (
            <g key={i}>
              {parts}
              <text
                x={cx}
                y={height - 10}
                textAnchor="middle"
                fontSize="10.5"
                fontFamily="var(--font-mono)"
                fill="var(--ink-subtle)"
              >
                {r.label}
              </text>
            </g>
          );
        })}
      </svg>
      {tipNode}
    </div>
  );
}

/* ============================ HORIZONTAL BARS (composition) ============================ */
function HBars({ data, fmt }) {
  const [setTip, tipNode] = useTip();
  const f = fmt || window.WF.wonShort;
  const max = Math.max(...data.map(d => d.value), 1);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              width: 92,
              fontSize: 13.5,
              fontWeight: 600,
              flex: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span className="dot" style={{ background: d.color }} />
            {d.key}
          </span>
          <span
            style={{
              flex: 1,
              height: 22,
              background: 'var(--surface-sunk)',
              borderRadius: 'var(--r-pill)',
              overflow: 'hidden',
            }}
          >
            <i
              style={{
                display: 'block',
                height: '100%',
                width: (d.value / max) * 100 + '%',
                background: d.color,
                borderRadius: 'var(--r-pill)',
                transition: 'width .5s ease',
              }}
              onMouseMove={e =>
                setTip({
                  x: e.clientX,
                  y: e.clientY,
                  k: d.key,
                  v: f(d.value) + ' · ' + window.WF.pct(d.value / total),
                })
              }
              onMouseLeave={() => setTip(null)}
            />
          </span>
          <span
            className="num"
            style={{ width: 96, textAlign: 'right', fontSize: 13, fontWeight: 600 }}
          >
            {f(d.value)}
          </span>
          <span
            className="mono"
            style={{ width: 44, textAlign: 'right', fontSize: 11.5, color: 'var(--ink-subtle)' }}
          >
            {window.WF.pct(d.value / total, 0)}
          </span>
        </div>
      ))}
      {tipNode}
    </div>
  );
}

Object.assign(window, { Icon, cssVar, Donut, Legend, LineChart, Waterfall, StackedBars, HBars });
