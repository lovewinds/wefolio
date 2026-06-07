/* ============================================================================
   WeFolio — Insight views (개요 / 투자 수익 현황 / 자산 추이 / 구성별 분해).
   Reads window.WF (data engine) + chart primitives from window.
   ========================================================================== */
const { useState: useStateV, useMemo: useMemoV } = React;
const WF = window.WF;

/* small helpers */
function KPI({ k, icon, v, d, dColor, dIcon }) {
  return (
    <div className="kpi">
      <div className="k">
        {icon && <window.Icon name={icon} size={14} />}
        {k}
      </div>
      <div className="v">{v}</div>
      {d != null && (
        <div className="d" style={{ color: dColor }}>
          {dIcon && <window.Icon name={dIcon} size={13} color={dColor} />}
          {d}
        </div>
      )}
    </div>
  );
}
function deltaParts(cur, prev) {
  const diff = cur - prev;
  return {
    diff,
    color: diff >= 0 ? 'var(--gain)' : 'var(--loss)',
    icon: diff >= 0 ? 'trending-up' : 'trending-down',
  };
}

/* ============================ 개요 / OVERVIEW ============================ */
function OverviewView({ mi }) {
  const S = useMemoV(() => WF.series(), []);
  const cur = S[mi],
    prev = mi > 0 ? S[mi - 1] : null;
  const dec = WF.decompose(mi);
  const maxN = Math.max(...S.map(s => s.N));

  const dN = prev ? deltaParts(cur.N, prev.N) : null;
  const dV = prev ? deltaParts(cur.V, prev.V) : null;
  const dC = prev ? deltaParts(cur.C, prev.C) : null;

  return (
    <div className="view-enter grid" style={{ gap: 20 }}>
      {/* hero + decomposition */}
      <div className="grid g-hero">
        <div className="hero">
          <div className="eb">우리 집 순자산 · {cur.label}</div>
          <div className="big">{WF.wonShort(cur.N)}</div>
          {dN && (
            <div className="chg" style={{ color: dN.color }}>
              <window.Icon name={dN.icon} size={16} color={dN.color} />
              지난달보다 {WF.signedShort(dN.diff)} {dN.diff >= 0 ? '늘었어요' : '줄었어요'}
            </div>
          )}
          <div className="hero-spark">
            {S.map((s, i) => (
              <div className={'col' + (i === mi ? ' on' : '')} key={i} title={s.label}>
                <i className="v-stk" style={{ height: (s.V / maxN) * 64 + 'px' }} />
                <i className="c-stk" style={{ height: (s.C / maxN) * 64 + 'px' }} />
              </div>
            ))}
          </div>
          <div className="hero-legend">
            <span>
              <i style={{ background: 'var(--acc)' }} />
              투자 평가액
            </span>
            <span>
              <i style={{ background: 'color-mix(in srgb, var(--acc) 30%, transparent)' }} />
              현금
            </span>
          </div>
        </div>

        {/* ★ decomposition summary */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-hd">
            <div>
              <h3>이번 달 증가 분해</h3>
              <div className="sub">{prev ? prev.label + ' → ' + cur.label : '기준월'}</div>
            </div>
            <span className="tag adj" style={{ alignSelf: 'flex-start', whiteSpace: 'nowrap' }}>
              ★ 핵심
            </span>
          </div>
          {dec ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
              <div className="drivers">
                <div className="driver save">
                  <div className="di" style={{ background: 'var(--gain)' }}>
                    <window.Icon name="piggy-bank" size={20} color="#fff" />
                  </div>
                  <div className="dl">순수 원금 증가 (저축·납입)</div>
                  <div className="dv num">{WF.signedShort(dec.savings)}</div>
                </div>
                <div className="driver market">
                  <div className="di" style={{ background: 'var(--acc)' }}>
                    <window.Icon name="line-chart" size={20} color="#fff" />
                  </div>
                  <div className="dl">투자 수익 (시장)</div>
                  <div
                    className="dv num"
                    style={{ color: dec.market >= 0 ? 'var(--ink)' : 'var(--loss)' }}
                  >
                    {WF.signedShort(dec.market)}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 'auto' }}>
                <div className="flex between" style={{ fontSize: 13, marginBottom: 8 }}>
                  <span className="muted">총자산 증가 {WF.signedShort(dec.dN)}</span>
                  <span className="mono muted">
                    저축 {WF.pct(dec.savings / (dec.dN || 1), 0)} · 시장{' '}
                    {WF.pct(dec.market / (dec.dN || 1), 0)}
                  </span>
                </div>
                <GaugeShare savings={dec.savings} market={dec.market} />
              </div>
            </div>
          ) : (
            <div className="muted" style={{ fontSize: 14 }}>
              기준월에는 직전 비교 데이터가 없어요.
            </div>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid g-3">
        <KPI
          k="투자 평가액"
          icon="trending-up"
          v={WF.wonShort(cur.V)}
          d={dV && WF.signedShort(dV.diff)}
          dColor={dV && dV.color}
          dIcon={dV && dV.icon}
        />
        <KPI
          k="현금 잔고"
          icon="wallet"
          v={WF.wonShort(cur.C)}
          d={dC && WF.signedShort(dC.diff)}
          dColor={dC && dC.color}
          dIcon={dC && dC.icon}
        />
        <KPI
          k="평가손익 (미실현)"
          icon="sparkles"
          v={WF.signedShort(cur.G)}
          d={'원금 ' + WF.wonShort(cur.P)}
          dColor={'var(--ink-subtle)'}
        />
      </div>

      {/* account snapshot quick list */}
      <div className="card flush">
        <div style={{ padding: '20px 22px 0' }} className="card-hd">
          <div>
            <h3>계좌 현황</h3>
            <div className="sub">
              {cur.label} 스냅샷 · 현금 {cur.cashRows.length}개 · 투자계좌{' '}
              {new Set(cur.holdings.map(h => h.account.id)).size}개
            </div>
          </div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>계좌</th>
              <th>구성원</th>
              <th>유형</th>
              <th>평가액</th>
            </tr>
          </thead>
          <tbody>
            {cur.cashRows.map((r, i) => (
              <tr key={'c' + i}>
                <td>
                  <div className="asset-cell">
                    <span
                      className="dot"
                      style={{
                        background: r.account.memberId === 'm-jiwan' ? '#E07856' : '#3E9C6B',
                      }}
                    />
                    <div>
                      <div className="nm">{r.account.name}</div>
                      <div className="meta">{WF.instById[r.account.institutionId].name}</div>
                    </div>
                  </div>
                </td>
                <td>{WF.memberById[r.account.memberId].name}</td>
                <td>
                  <span className="tag">현금 · {r.account.accountType}</span>
                </td>
                <td className="num" style={{ fontWeight: 600 }}>
                  {WF.won(r.balance)}
                </td>
              </tr>
            ))}
            {aggregateAccounts(cur).map((a, i) => (
              <tr key={'h' + i}>
                <td>
                  <div className="asset-cell">
                    <span className="dot" style={{ background: a.member.color }} />
                    <div>
                      <div className="nm">{a.account.name}</div>
                      <div className="meta">
                        {a.institution.name} · {a.holdings}종목
                      </div>
                    </div>
                  </div>
                </td>
                <td>{a.member.name}</td>
                <td>
                  <span className="tag">투자 · {a.account.accountType}</span>
                </td>
                <td className="num" style={{ fontWeight: 600 }}>
                  {WF.won(a.value)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>총자산</td>
              <td></td>
              <td></td>
              <td className="num">{WF.won(cur.N)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function aggregateAccounts(snap) {
  const map = {};
  snap.holdings.forEach(h => {
    const id = h.account.id;
    map[id] = map[id] || {
      account: h.account,
      member: h.member,
      institution: h.institution,
      value: 0,
      holdings: 0,
    };
    map[id].value += h.value;
    map[id].holdings += 1;
  });
  return Object.values(map).sort((a, b) => b.value - a.value);
}

function GaugeShare({ savings, market }) {
  const sPos = Math.max(savings, 0),
    mPos = Math.max(market, 0);
  const tot = sPos + mPos || 1;
  const sPct = (sPos / tot) * 100,
    mPct = (mPos / tot) * 100;
  return (
    <div className="gauge-share">
      <i style={{ width: sPct + '%', background: 'var(--gain)' }}>{sPct > 14 ? '저축' : ''}</i>
      <i style={{ width: mPct + '%', background: 'var(--acc)' }}>{mPct > 14 ? '시장' : ''}</i>
    </div>
  );
}

/* ============================ 투자 수익 현황 / PROFIT (FR-C1) ============================ */
function ProfitView({ mi }) {
  const cur = useMemoV(() => WF.compute(mi), [mi]);
  const [member, setMember] = useStateV('전체');
  const [showValue, setShowValue] = useStateV(false);

  let rows = cur.holdings.slice();
  if (!showValue) rows = rows.filter(h => !h.valueType);
  if (member !== '전체') rows = rows.filter(h => h.member.name === member);
  rows.sort((a, b) => b.value - a.value);

  const P = rows.reduce((s, h) => s + h.principal, 0);
  const V = rows.reduce((s, h) => s + h.value, 0);
  const G = V - P,
    R = P > 0 ? G / P : null;

  return (
    <div className="view-enter grid" style={{ gap: 20 }}>
      <div className="grid g-3" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <KPI k="투자 원금" icon="coins" v={WF.wonShort(P)} />
        <KPI k="평가액" icon="trending-up" v={WF.wonShort(V)} />
        <KPI
          k="평가손익"
          icon="sparkles"
          v={WF.signedShort(G)}
          d={null}
          dColor={G >= 0 ? 'var(--gain)' : 'var(--loss)'}
        />
        <div className="kpi">
          <div className="k">
            <window.Icon name="percent" size={14} />
            수익률
          </div>
          <div
            className="v"
            style={{ color: R == null ? 'var(--ink)' : R >= 0 ? 'var(--gain)' : 'var(--loss)' }}
          >
            {R == null ? '—' : (R >= 0 ? '+' : '') + WF.pct(R)}
          </div>
        </div>
      </div>

      <div className="card flush">
        <div style={{ padding: '20px 22px' }} className="flex between center wrap">
          <div>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 17 }}>
              종목별 투자 성과
            </h3>
            <div
              className="sub"
              style={{ fontSize: 12.5, color: 'var(--ink-subtle)', marginTop: 3 }}
            >
              {cur.label} 스냅샷 기준 · 원금/평가액/수익은 모두 파생값
            </div>
          </div>
          <div className="flex gap-sm center wrap">
            <div className="toggle">
              {['전체', '지완', '지아'].map(m => (
                <button key={m} className={member === m ? 'on' : ''} onClick={() => setMember(m)}>
                  {m}
                </button>
              ))}
            </div>
            <button
              className={'chip' + (showValue ? ' on' : '')}
              onClick={() => setShowValue(v => !v)}
            >
              현금형 포함
            </button>
          </div>
        </div>
        <div className="tbl-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>종목</th>
                <th>구성원 · 계좌</th>
                <th>수량</th>
                <th>평균단가</th>
                <th>현재가</th>
                <th>원금</th>
                <th>평가액</th>
                <th>수익</th>
                <th>수익률</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((h, i) => (
                <tr key={i}>
                  <td>
                    <div className="asset-cell">
                      <span
                        className="dot"
                        style={{ background: WF.CLASS_COLOR[h.asset.assetClass] }}
                      />
                      <div>
                        <div className="nm">
                          {h.asset.name}
                          {h.adjusted && (
                            <span className="tag adj" style={{ marginLeft: 8 }}>
                              단가 보정
                            </span>
                          )}
                        </div>
                        <div className="meta">
                          {h.asset.assetClass}
                          {h.asset.subClass ? ' · ' + h.asset.subClass : ''} ·{' '}
                          <span className={h.asset.riskLevel === '위험자산' ? 'loss' : 'gain'}>
                            {h.asset.riskLevel}
                          </span>
                          {h.asset.currency === 'USD' ? ' · USD' : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {h.member.name} · {h.account.name}
                  </td>
                  <td className="mono">{h.valueType ? '—' : h.q.toLocaleString('ko-KR')}</td>
                  <td className="mono">{h.valueType ? '—' : h.avg.toLocaleString('ko-KR')}</td>
                  <td className="mono">
                    {h.valueType ? '—' : h.cur.toLocaleString('ko-KR')}
                    {h.fx ? (
                      <span className="muted" style={{ fontSize: 10 }}>
                        {' '}
                        @{h.fx}
                      </span>
                    ) : (
                      ''
                    )}
                  </td>
                  <td className="num">{WF.wonShort(h.principal)}</td>
                  <td className="num" style={{ fontWeight: 600 }}>
                    {WF.wonShort(h.value)}
                  </td>
                  <td
                    className="num"
                    style={{
                      color: h.valueType
                        ? 'var(--ink-subtle)'
                        : h.gain >= 0
                          ? 'var(--gain)'
                          : 'var(--loss)',
                      fontWeight: 600,
                    }}
                  >
                    {h.valueType ? '—' : WF.signedShort(h.gain)}
                  </td>
                  <td
                    className="num mono"
                    style={{
                      color:
                        h.ret == null
                          ? 'var(--ink-subtle)'
                          : h.ret >= 0
                            ? 'var(--gain)'
                            : 'var(--loss)',
                      fontWeight: 600,
                    }}
                  >
                    {h.ret == null || h.valueType ? '—' : (h.ret >= 0 ? '+' : '') + WF.pct(h.ret)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>합계</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td className="num">{WF.wonShort(P)}</td>
                <td className="num">{WF.wonShort(V)}</td>
                <td className="num" style={{ color: G >= 0 ? 'var(--gain)' : 'var(--loss)' }}>
                  {WF.signedShort(G)}
                </td>
                <td className="num mono" style={{ color: R >= 0 ? 'var(--gain)' : 'var(--loss)' }}>
                  {R == null ? '—' : (R >= 0 ? '+' : '') + WF.pct(R)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      <div className="note">
        <window.Icon name="info" size={18} />
        <span>
          현금형 종목(예금·청약 등 value형)은 원금=평가액으로 수익이 0이라 기본 성과표에서
          제외됩니다. <b>현금형 포함</b>으로 함께 볼 수 있어요.
        </span>
      </div>
    </div>
  );
}

/* ============================ 자산 추이 / TREND (FR-C3) ============================ */
function TrendView({ mi }) {
  const S = useMemoV(() => WF.series(), []);
  const [range, setRange] = useStateV(7);
  const [showGap, setShowGap] = useStateV(false);
  const start = Math.max(0, S.length - range);
  const slice = S.slice(start);
  const labels = slice.map(s => s.label.slice(2));
  const accC = window.cssVar('--acc') || window.cssVar('--accent');

  const series = showGap
    ? [
        { key: '평가액', color: accC, values: slice.map(s => s.V), area: true, width: 2.5 },
        {
          key: '원금',
          color: window.cssVar('--ink-subtle'),
          values: slice.map(s => s.P),
          dash: '5 4',
          width: 2,
        },
      ]
    : [
        { key: '총자산', color: window.cssVar('--ink'), values: slice.map(s => s.N), width: 3 },
        { key: '투자평가액', color: accC, values: slice.map(s => s.V), area: true, width: 2.5 },
        { key: '현금', color: window.cssVar('--gain'), values: slice.map(s => s.C), width: 2 },
      ];

  const first = slice[0],
    last = slice[slice.length - 1];
  const growth = last.N - first.N;

  return (
    <div className="view-enter grid" style={{ gap: 20 }}>
      <div className="grid g-3">
        <KPI
          k="기간 총자산 증가"
          icon="trending-up"
          v={WF.signedShort(growth)}
          dColor="var(--gain)"
        />
        <KPI k="누적 평가손익" icon="sparkles" v={WF.signedShort(last.G)} />
        <KPI
          k="현금 비중"
          icon="wallet"
          v={WF.pct(last.C / last.N)}
          d={'투자 ' + WF.pct(last.V / last.N)}
          dColor="var(--ink-subtle)"
        />
      </div>
      <div className="card">
        <div className="card-hd">
          <div>
            <h3>{showGap ? '원금 vs 평가액 (수익 갭)' : '월별 자산 추이'}</h3>
            <div className="sub">
              {first.label} – {last.label} · 월별 스냅샷 시계열
            </div>
          </div>
          <div className="flex gap-sm wrap">
            <button className={'chip' + (showGap ? ' on' : '')} onClick={() => setShowGap(v => !v)}>
              수익 갭 보기
            </button>
            <div className="toggle">
              {[3, 6, 7].map(r => (
                <button key={r} className={range === r ? 'on' : ''} onClick={() => setRange(r)}>
                  {r === 7 ? '전체' : r + '개월'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <LineChart series={series} xLabels={labels} height={280} />
        <div className="wf-legend mt">
          {series.map((s, i) => (
            <span key={i}>
              <i style={{ background: s.color, opacity: s.dash ? 0.6 : 1 }} />
              {s.key}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================ 구성별 분해 / COMPOSITION (FR-C2 + FR-C4) ============================ */
function CompositionView({ mi, chartStyle }) {
  const cur = useMemoV(() => WF.compute(mi), [mi]);
  const [dim, setDim] = useStateV('assetClass');
  const asBar = chartStyle === 'bar';
  const accC = window.cssVar('--acc') || window.cssVar('--accent');

  const cashVsInvest = [
    { key: '투자', value: cur.V, color: accC },
    { key: '현금', value: cur.C, color: window.cssVar('--gain') },
  ];
  const risk = WF.riskSplit(cur);
  const grp = WF.groupBy(cur, dim).map(g => ({
    ...g,
    color:
      g.color ||
      (dim === 'assetClass'
        ? WF.CLASS_COLOR[g.key]
        : dim === 'institution'
          ? WF.INST_COLOR[g.key] || '#8C8377'
          : '#8C8377'),
  }));
  // assign palette for member-by-class fallback
  const palette = ['#E07856', '#3E9C6B', '#E8B04B', '#A78BFA', '#5B7BD4', '#C9963F', '#7C8B5A'];
  grp.forEach((g, i) => {
    if (!g.color) g.color = palette[i % palette.length];
  });

  return (
    <div className="view-enter grid" style={{ gap: 20 }}>
      <div className="grid g-2">
        {/* cash vs invest donut */}
        <div className="card">
          <div className="card-hd">
            <div>
              <h3>현금 vs 투자 비중</h3>
              <div className="sub">
                {cur.label} · 총자산 {WF.wonShort(cur.N)}
              </div>
            </div>
          </div>
          {asBar ? (
            <div style={{ marginTop: 6 }}>
              <HBars data={cashVsInvest} />
            </div>
          ) : (
            <div className="donut-wrap">
              <Donut
                data={cashVsInvest}
                size={172}
                thickness={28}
                center={
                  <React.Fragment>
                    <div className="dc-k">투자 비중</div>
                    <div className="dc-v num">{WF.pct(cur.V / cur.N, 0)}</div>
                  </React.Fragment>
                }
              />
              <Legend data={cashVsInvest} total={cur.N} />
            </div>
          )}
        </div>
        {/* risk / safe */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-hd">
            <div>
              <h3>위험 vs 안전 자산</h3>
              <div className="sub">현금은 안전자산으로 집계</div>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              justifyContent: 'center',
              flex: 1,
            }}
          >
            <div className="riskbar">
              <i
                style={{ width: (risk.safe / risk.total) * 100 + '%', background: 'var(--gain)' }}
              />
              <i
                style={{ width: (risk.risk / risk.total) * 100 + '%', background: 'var(--acc)' }}
              />
            </div>
            <div className="flex between">
              <div>
                <div className="eb">안전자산</div>
                <div
                  className="num"
                  style={{
                    fontSize: 22,
                    fontWeight: 600,
                    fontFamily: 'var(--font-display)',
                    color: 'var(--gain)',
                  }}
                >
                  {WF.pct(risk.safe / risk.total, 0)}
                </div>
                <div className="mono muted" style={{ fontSize: 12 }}>
                  {WF.wonShort(risk.safe)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="eb">위험자산</div>
                <div
                  className="num"
                  style={{
                    fontSize: 22,
                    fontWeight: 600,
                    fontFamily: 'var(--font-display)',
                    color: 'var(--acc)',
                  }}
                >
                  {WF.pct(risk.risk / risk.total, 0)}
                </div>
                <div className="mono muted" style={{ fontSize: 12 }}>
                  {WF.wonShort(risk.risk)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* composition breakdown */}
      <div className="card">
        <div className="card-hd">
          <div>
            <h3>구성별 분해</h3>
            <div className="sub">
              {cur.label} 투자 평가액{dim === 'member' ? ' + 현금' : ''}을 기준으로
            </div>
          </div>
          <div className="toggle">
            {[
              ['assetClass', '자산군'],
              ['member', '구성원'],
              ['institution', '기관'],
            ].map(([k, l]) => (
              <button key={k} className={dim === k ? 'on' : ''} onClick={() => setDim(k)}>
                {l}
              </button>
            ))}
          </div>
        </div>
        {asBar ? (
          <HBars data={grp} />
        ) : (
          <div className="donut-wrap" style={{ alignItems: 'flex-start' }}>
            <Donut
              data={grp}
              size={172}
              thickness={28}
              center={
                <React.Fragment>
                  <div className="dc-k">{dim === 'member' ? '총자산' : '투자합'}</div>
                  <div className="dc-v num">
                    {WF.wonShort(grp.reduce((s, g) => s + g.value, 0)).replace('원', '')}
                  </div>
                </React.Fragment>
              }
            />
            <div style={{ flex: 1 }}>
              <HBars data={grp} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { OverviewView, ProfitView, TrendView, CompositionView, KPI });
