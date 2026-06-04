/* ============================================================================
   WeFolio — Management views.
   • DecompositionView (★ FR-C5)  — 2~3 변형: 워터폴 / 월별 스택 / 동인 카드
   • SnapshotInputView (FR-B)     — 전월 복사 → 수정 → 저장
   • BaseDataView (FR-A)          — 구성원·기관·계좌·종목 CRUD
   ========================================================================== */
const { useState: useStateM, useMemo: useMemoM } = React;
const WFm = window.WF;
const KPI = window.KPI; // defined in views-insight.jsx (loaded first)

/* ============================ ★ 자산 증가 분해 / DECOMPOSITION (FR-C5) ============================ */
function DecompositionView({ mi, variant, setVariant }) {
  const dec = useMemoM(() => WFm.decompose(mi), [mi]);
  const S = useMemoM(() => WFm.series(), []);

  if (!dec) {
    return (
      <div className="view-enter card">
        <div className="muted" style={{ fontSize: 14 }}>
          기준월(첫 달)에는 직전월 비교 데이터가 없어요. 상단에서 다른 달을 선택해 주세요.
        </div>
      </div>
    );
  }

  const savingsPct = dec.dN !== 0 ? dec.savings / dec.dN : 0;
  const marketPct = dec.dN !== 0 ? dec.market / dec.dN : 0;

  return (
    <div className="view-enter grid" style={{ gap: 20 }}>
      {/* headline summary */}
      <div className="grid g-3">
        <div
          className="kpi"
          style={{ background: 'var(--block-cream)', border: '1px solid transparent' }}
        >
          <div className="k">총자산 증가 (ΔN)</div>
          <div className="v num">{WFm.signedShort(dec.dN)}</div>
          <div className="d muted">
            {dec.from.label} → {dec.to.label}
          </div>
        </div>
        <div className="kpi">
          <div className="k">
            <window.Icon name="piggy-bank" size={14} color="var(--gain)" />
            순수 원금 증가 · 저축
          </div>
          <div className="v num" style={{ color: 'var(--gain)' }}>
            {WFm.signedShort(dec.savings)}
          </div>
          <div className="d mono muted">
            ΔC {WFm.signedShort(dec.dC)} · ΔP {WFm.signedShort(dec.dP)}
          </div>
        </div>
        <div className="kpi">
          <div className="k">
            <window.Icon name="line-chart" size={14} color="var(--acc)" />
            투자 수익 · 시장 (ΔG)
          </div>
          <div className="v num" style={{ color: dec.market >= 0 ? 'var(--acc)' : 'var(--loss)' }}>
            {WFm.signedShort(dec.market)}
          </div>
          <div className="d mono muted">미실현 손익의 변화</div>
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <div>
            <h3>{dec.to.label} 자산 증가, 무엇 때문일까요?</h3>
            <div className="sub">
              “자산이 는 게 저축 때문인가, 투자가 잘돼서인가”를 구분합니다 · ΔN = ΔC + ΔP + ΔG
            </div>
          </div>
          <div className="toggle">
            {[
              ['waterfall', '워터폴'],
              ['monthly', '월별 동인'],
              ['cards', '동인 카드'],
            ].map(([k, l]) => (
              <button key={k} className={variant === k ? 'on' : ''} onClick={() => setVariant(k)}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {variant === 'waterfall' && (
          <React.Fragment>
            <Waterfall
              start={dec.from.N}
              savings={dec.savings}
              market={dec.market}
              end={dec.to.N}
              height={320}
            />
            <div className="wf-legend mt" style={{ justifyContent: 'center' }}>
              <span>
                <i style={{ background: 'var(--ink-subtle)' }} />
                시작 총자산
              </span>
              <span>
                <i style={{ background: 'var(--gain)' }} />
                저축·납입
              </span>
              <span>
                <i style={{ background: 'var(--acc)' }} />
                투자수익
              </span>
              <span>
                <i style={{ background: 'var(--ink)' }} />끝 총자산
              </span>
            </div>
          </React.Fragment>
        )}

        {variant === 'monthly' && (
          <React.Fragment>
            <StackedBars
              rows={S.slice(1).map((s, i) => {
                const d = WFm.decompose(i + 1);
                return { label: s.label.slice(2), savings: d.savings, market: d.market };
              })}
              height={290}
            />
            <div className="wf-legend mt" style={{ justifyContent: 'center' }}>
              <span>
                <i style={{ background: 'var(--gain)' }} />
                저축·납입
              </span>
              <span>
                <i style={{ background: 'var(--acc)' }} />
                투자수익
              </span>
              <span>
                <i style={{ background: 'var(--loss)' }} />
                감소
              </span>
            </div>
            <div
              className="note mt"
              style={{ background: 'var(--surface-soft)', border: '1px solid var(--hairline)' }}
            >
              <window.Icon name="info" size={18} />
              <span>
                매월 총자산 증가를 두 동인으로 누적했습니다. 막대가 길수록 그달의 자산 증가가
                컸어요. 현재 선택월은 <b>{dec.to.label}</b>입니다.
              </span>
            </div>
          </React.Fragment>
        )}

        {variant === 'cards' && (
          <div className="grid" style={{ gap: 18 }}>
            <div className="drivers">
              <div className="driver save">
                <div className="di" style={{ background: 'var(--gain)' }}>
                  <window.Icon name="piggy-bank" size={20} color="#fff" />
                </div>
                <div className="dl">순수 원금 증가 — 내가 새로 모은 돈</div>
                <div className="dv num">{WFm.signedShort(dec.savings)}</div>
                <div className="dp">
                  현금 변화 ΔC {WFm.signedShort(dec.dC)} · 투자원금 변화 ΔP{' '}
                  {WFm.signedShort(dec.dP)}
                </div>
              </div>
              <div className="driver market">
                <div className="di" style={{ background: 'var(--acc)' }}>
                  <window.Icon name="line-chart" size={20} color="#fff" />
                </div>
                <div className="dl">투자 수익 — 시장이 벌어준 돈</div>
                <div
                  className="dv num"
                  style={{ color: dec.market >= 0 ? 'var(--ink)' : 'var(--loss)' }}
                >
                  {WFm.signedShort(dec.market)}
                </div>
                <div className="dp">평가손익 변화 ΔG · 미실현 기준</div>
              </div>
            </div>
            <div>
              <div className="flex between mt-sm" style={{ fontSize: 13, marginBottom: 8 }}>
                <span className="muted">총자산 {WFm.signedShort(dec.dN)} 증가에서</span>
                <span className="mono muted">
                  저축 {WFm.pct(savingsPct, 0)} · 시장 {WFm.pct(marketPct, 0)}
                </span>
              </div>
              <div className="gauge-share" style={{ height: 28 }}>
                <i
                  style={{ width: Math.max(savingsPct * 100, 0) + '%', background: 'var(--gain)' }}
                >
                  {savingsPct > 0.12 ? '저축 ' + WFm.pct(savingsPct, 0) : ''}
                </i>
                <i style={{ width: Math.max(marketPct * 100, 0) + '%', background: 'var(--acc)' }}>
                  {marketPct > 0.12 ? '시장 ' + WFm.pct(marketPct, 0) : ''}
                </i>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 해석 주의 (insight.md) */}
      <div className="note warn">
        <window.Icon name="alert-triangle" size={18} />
        <div>
          <b>해석 주의 ·</b> 현금↔투자 내부 이동은 순증이 아닙니다. 현금으로 주식을 사면 ΔC&lt;0,
          ΔP&gt;0이라 “저축”으로 잡히지 않아요(의도된 동작).
          {dec.adjustedMonth && (
            <div style={{ marginTop: 6 }}>
              이 달에는 <b>평균단가 보정</b>이 있어 ΔP·ΔG 분해의 신뢰도가 낮을 수 있습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================ 월별 스냅샷 입력 / SNAPSHOT INPUT (FR-B) ============================ */
// NOTE(2026-06): 입력 화면의 단일 기준 구조는 asset-management.md "입력 화면 구조: 소유자 ▸ 기관 스텝"이다.
// 실제 구현(monthly-asset-input-panel.tsx)은 소유자 ▸ 기관 묶음 스텝(은행류='예금' 한 묶음,
// 증권류=기관별 묶음에 예수금+종목)을 한 번에 한 묶음씩 펼치는 방식이다.
// 아래 2분할(현금/종목) 테이블 프로토타입은 그 구조 확정 이전 시안으로, 데이터 모델 참고용으로만 남겨 둔다.
function SnapshotInputView({ mi, onToast }) {
  const cur = useMemoM(() => WFm.compute(mi), [mi]);
  const prev = useMemoM(() => (mi > 0 ? WFm.compute(mi - 1) : null), [mi]);

  // seed editable state from current snapshot
  const [cash, setCash] = useStateM(() =>
    cur.cashRows.map(r => ({
      id: r.account.id,
      name: r.account.name,
      inst: WFm.instById[r.account.institutionId].name,
      member: WFm.memberById[r.account.memberId].name,
      mc: WFm.memberById[r.account.memberId].color,
      bal: r.balance,
      prev: r.balance,
    }))
  );
  const [holds, setHolds] = useStateM(() =>
    cur.holdings.map(h => ({
      id: h.def.id,
      name: h.asset.name,
      sub: h.member.name + ' · ' + h.account.name,
      cls: h.asset.assetClass,
      valueType: h.valueType,
      q: h.q,
      avg: h.avg,
      cur: h.cur,
      pq: h.q,
      pavg: h.avg,
      pcur: h.cur,
      fx: h.fx,
    }))
  );

  // re-seed when month changes
  React.useEffect(() => {
    setCash(
      cur.cashRows.map(r => ({
        id: r.account.id,
        name: r.account.name,
        inst: WFm.instById[r.account.institutionId].name,
        member: WFm.memberById[r.account.memberId].name,
        mc: WFm.memberById[r.account.memberId].color,
        bal: r.balance,
        prev: r.balance,
      }))
    );
    setHolds(
      cur.holdings.map(h => ({
        id: h.def.id,
        name: h.asset.name,
        sub: h.member.name + ' · ' + h.account.name,
        cls: h.asset.assetClass,
        valueType: h.valueType,
        q: h.q,
        avg: h.avg,
        cur: h.cur,
        pq: h.q,
        pavg: h.avg,
        pcur: h.cur,
        fx: h.fx,
      }))
    );
  }, [mi]);

  const totalCash = cash.reduce((s, c) => s + (+c.bal || 0), 0);
  const totalP = holds.reduce(
    (s, h) => s + (h.valueType ? +h.cur || 0 : (+h.q || 0) * (+h.avg || 0)),
    0
  );
  const totalV = holds.reduce(
    (s, h) => s + (h.valueType ? +h.cur || 0 : (+h.q || 0) * (+h.cur || 0)),
    0
  );
  const N = totalCash + totalV;

  const num = v => (v === '' ? '' : (+v).toLocaleString('ko-KR'));
  const parse = s => s.replace(/[^0-9.]/g, '');

  return (
    <div className="view-enter grid" style={{ gap: 20 }}>
      <div className="copybanner">
        <window.Icon name="copy-check" size={18} />
        <div>
          {prev ? (
            <span>
              <b>{prev.label}</b> 스냅샷을 복사해 <b>{cur.label}</b> 입력 폼을 채웠어요.
            </span>
          ) : (
            <span>
              <b>{cur.label}</b> 기준월입니다.
            </span>
          )}{' '}
          바뀐 값만 수정하면 됩니다 — 보통 현재가만 바뀌어요.
        </div>
      </div>

      <div className="grid g-3">
        <KPI k="현금 합계" icon="wallet" v={WFm.wonShort(totalCash)} />
        <KPI
          k="투자 평가액"
          icon="trending-up"
          v={WFm.wonShort(totalV)}
          d={'원금 ' + WFm.wonShort(totalP)}
          dColor="var(--ink-subtle)"
        />
        <KPI
          k="이 달 총자산"
          icon="layers"
          v={WFm.wonShort(N)}
          d={prev ? WFm.signedShort(N - prev.N) + ' vs 전월' : null}
          dColor={prev && N - prev.N >= 0 ? 'var(--gain)' : 'var(--loss)'}
        />
      </div>

      {/* cash */}
      <div className="card">
        <div className="card-hd">
          <div>
            <h3>계좌 현금 잔고</h3>
            <div className="sub">계좌별 월말 현금(원화) 한 줄 입력</div>
          </div>
        </div>
        <div className="inrow head cash">
          <span>계좌</span>
          <span>현금 잔고 (원)</span>
        </div>
        {cash.map((c, i) => {
          const changed = +c.bal !== +c.prev;
          return (
            <div className="inrow cash" key={c.id}>
              <div className="in-nm">
                <span className="dot" style={{ background: c.mc }} />
                <div>
                  <div className="nm">{c.name}</div>
                  <div className="sb">
                    {c.member} · {c.inst}
                  </div>
                </div>
              </div>
              <div className={'in-field' + (changed ? ' changed' : '')}>
                <input
                  value={num(c.bal)}
                  onChange={e => {
                    const v = parse(e.target.value);
                    setCash(cs => cs.map((x, j) => (j === i ? { ...x, bal: v } : x)));
                  }}
                />
                <span className="u">원</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* holdings */}
      <div className="card">
        <div className="card-hd">
          <div>
            <h3>보유 종목</h3>
            <div className="sub">
              quantity형은 수량·평균단가·현재가, value형(현금성)은 평가액 한 값
            </div>
          </div>
        </div>
        <div className="inrow head hold">
          <span>종목</span>
          <span>수량</span>
          <span>평균단가</span>
          <span>현재가 / 평가액</span>
          <span>원금 / 평가</span>
        </div>
        {holds.map((h, i) => {
          const changedCur = +h.cur !== +h.pcur,
            changedQ = +h.q !== +h.pq,
            changedAvg = +h.avg !== +h.pavg;
          const principal = h.valueType ? +h.cur || 0 : (+h.q || 0) * (+h.avg || 0);
          const value = h.valueType ? +h.cur || 0 : (+h.q || 0) * (+h.cur || 0);
          return (
            <div className="inrow hold" key={h.id}>
              <div className="in-nm">
                <span className="dot" style={{ background: WFm.CLASS_COLOR[h.cls] }} />
                <div>
                  <div className="nm">
                    {h.name}
                    {h.valueType && (
                      <span className="tag" style={{ marginLeft: 7 }}>
                        value형
                      </span>
                    )}
                  </div>
                  <div className="sb">{h.sub}</div>
                </div>
              </div>
              {h.valueType ? (
                <React.Fragment>
                  <div className="in-derived muted" style={{ alignSelf: 'center' }}>
                    —
                  </div>
                  <div className="in-derived muted" style={{ alignSelf: 'center' }}>
                    —
                  </div>
                  <div className={'in-field' + (changedCur ? ' changed' : '')}>
                    <input
                      value={num(h.cur)}
                      onChange={e => {
                        const v = parse(e.target.value);
                        setHolds(hs => hs.map((x, j) => (j === i ? { ...x, cur: v } : x)));
                      }}
                    />
                    <span className="u">원</span>
                  </div>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <div className={'in-field' + (changedQ ? ' changed' : '')}>
                    <input
                      value={h.q}
                      onChange={e => {
                        const v = parse(e.target.value);
                        setHolds(hs => hs.map((x, j) => (j === i ? { ...x, q: v } : x)));
                      }}
                    />
                  </div>
                  <div className={'in-field' + (changedAvg ? ' changed' : '')}>
                    <input
                      value={num(h.avg)}
                      onChange={e => {
                        const v = parse(e.target.value);
                        setHolds(hs => hs.map((x, j) => (j === i ? { ...x, avg: v } : x)));
                      }}
                    />
                  </div>
                  <div className={'in-field' + (changedCur ? ' changed' : '')}>
                    <input
                      value={num(h.cur)}
                      onChange={e => {
                        const v = parse(e.target.value);
                        setHolds(hs => hs.map((x, j) => (j === i ? { ...x, cur: v } : x)));
                      }}
                    />
                  </div>
                </React.Fragment>
              )}
              <div className="in-derived" style={{ alignSelf: 'center' }}>
                <div className="num" style={{ fontWeight: 600 }}>
                  {WFm.won(value)}
                </div>
                <div className="pl">원금 {WFm.won(principal)}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex between center wrap" style={{ gap: 12 }}>
        <div className="muted" style={{ fontSize: 13 }}>
          저장하는 값은 입력값(수량·단가·현재가·현금)뿐 — 원금·평가액·수익은 조회 시 계산됩니다.
        </div>
        <div className="flex gap-sm">
          <button
            className="btn btn-ghost"
            onClick={() => onToast && onToast('초기화했어요 (전월 복사 상태)')}
          >
            되돌리기
          </button>
          <button
            className="btn btn-accent"
            onClick={() => onToast && onToast(cur.label + ' 스냅샷을 저장했어요')}
          >
            <window.Icon name="check" size={16} color="currentColor" />
            {cur.label} 스냅샷 저장
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================ 기준 데이터 / BASE DATA (FR-A) ============================ */
function BaseDataView({ onToast }) {
  const [tab, setTab] = useStateM('member');
  const [members, setMembers] = useStateM(WFm.members);
  const [insts] = useStateM(WFm.institutions);
  const [accts] = useStateM(WFm.accounts);
  const [assets] = useStateM(WFm.assets);

  const tabs = [
    ['member', '구성원', members.length],
    ['institution', '기관', insts.length],
    ['account', '계좌', accts.length],
    ['asset', '종목', assets.length],
  ];

  const actions = label => (
    <div className="row-actions">
      <button title="수정" onClick={() => onToast && onToast(label + ' 수정 (목업)')}>
        <window.Icon name="pencil" size={15} color="currentColor" />
      </button>
      <button title="비활성화" onClick={() => onToast && onToast(label + ' 비활성화 (목업)')}>
        <window.Icon name="archive" size={15} color="currentColor" />
      </button>
    </div>
  );

  return (
    <div className="view-enter grid" style={{ gap: 18 }}>
      <div
        className="note"
        style={{ background: 'var(--surface-soft)', border: '1px solid var(--hairline)' }}
      >
        <window.Icon name="pencil" size={18} />
        <span>
          기존의 “수정/삭제 불가” 제약을 해소했습니다 — 모든 기준 데이터(구성원·기관·계좌·종목)는
          편집 가능합니다.
        </span>
      </div>

      <div className="card flush" style={{ padding: '8px 22px 0' }}>
        <div className="flex between center" style={{ paddingTop: 8 }}>
          <div className="crud-tabs" style={{ border: 'none', marginBottom: 0 }}>
            {tabs.map(([k, l, n]) => (
              <button
                key={k}
                className={'crud-tab' + (tab === k ? ' on' : '')}
                onClick={() => setTab(k)}
              >
                {l}{' '}
                <span className="muted mono" style={{ fontSize: 11 }}>
                  {n}
                </span>
              </button>
            ))}
          </div>
          <button
            className="btn btn-accent"
            onClick={() =>
              onToast && onToast('새 ' + tabs.find(t => t[0] === tab)[1] + ' 추가 (목업)')
            }
          >
            <window.Icon name="plus" size={16} color="currentColor" />
            추가
          </button>
        </div>
        <div style={{ borderTop: '1px solid var(--hairline)', margin: '0 -22px' }}>
          {tab === 'member' && (
            <table className="tbl">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>표시 색상</th>
                  <th>상태</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id}>
                    <td className="nm">{m.name}</td>
                    <td>
                      <div className="flex center gap-sm" style={{ justifyContent: 'flex-end' }}>
                        <span className="swatch-sm" style={{ background: m.color }} />
                        <span className="mono muted">{m.color}</span>
                      </div>
                    </td>
                    <td>
                      <span className="tag safe">활성</span>
                    </td>
                    <td>{actions(m.name)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === 'institution' && (
            <table className="tbl">
              <thead>
                <tr>
                  <th>기관</th>
                  <th>유형</th>
                  <th>계좌 수</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {insts.map(i => (
                  <tr key={i.id}>
                    <td className="nm">{i.name}</td>
                    <td>
                      <span className="pill-type">{i.type === 'bank' ? '은행' : '증권'}</span>
                    </td>
                    <td className="num">{accts.filter(a => a.institutionId === i.id).length}</td>
                    <td>{actions(i.name)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === 'account' && (
            <table className="tbl">
              <thead>
                <tr>
                  <th>계좌</th>
                  <th>구성원</th>
                  <th>기관</th>
                  <th>유형</th>
                  <th>통화</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {accts.map(a => (
                  <tr key={a.id}>
                    <td className="nm">{a.name}</td>
                    <td>{WFm.memberById[a.memberId].name}</td>
                    <td>{WFm.instById[a.institutionId].name}</td>
                    <td>
                      <span className="pill-type">
                        {a.kind === 'cash' ? '현금 · ' : '투자 · '}
                        {a.accountType}
                      </span>
                    </td>
                    <td className="mono">{a.currency}</td>
                    <td>{actions(a.name)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === 'asset' && (
            <table className="tbl">
              <thead>
                <tr>
                  <th>종목</th>
                  <th>자산군</th>
                  <th>세부분류</th>
                  <th>위험구분</th>
                  <th>통화</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {assets.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div className="asset-cell">
                        <span
                          className="dot"
                          style={{ background: WFm.CLASS_COLOR[a.assetClass] }}
                        />
                        <div>
                          <div className="nm">{a.name}</div>
                          {a.symbol && <div className="meta">{a.symbol}</div>}
                        </div>
                      </div>
                    </td>
                    <td>{a.assetClass}</td>
                    <td>{a.subClass || '—'}</td>
                    <td>
                      <span className={'tag ' + (a.riskLevel === '위험자산' ? 'risk' : 'safe')}>
                        {a.riskLevel}
                      </span>
                    </td>
                    <td className="mono">{a.currency}</td>
                    <td>{actions(a.name)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DecompositionView, SnapshotInputView, BaseDataView });
