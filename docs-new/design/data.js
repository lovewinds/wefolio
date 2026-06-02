/* ============================================================================
   WeFolio — mock data + derived-metric engine.
   PRD 충실: 저장하는 것은 '입력값'(스냅샷)뿐. 원금/평가액/수익/증가분해는 전부 파생.
   지완·지아 가족, 2025-12 ~ 2026-06 (7개월) 월별 스냅샷.
   plain JS → window.WF
   ========================================================================== */
(function () {
  const MONTHS = ['2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'];
  const MONTH_LABEL = {
    '2025-12': '2025.12',
    '2026-01': '2026.01',
    '2026-02': '2026.02',
    '2026-03': '2026.03',
    '2026-04': '2026.04',
    '2026-05': '2026.05',
    '2026-06': '2026.06',
  };

  /* ---- 구성원 (Member) ---- */
  const members = [
    { id: 'm-jiwan', name: '지완', color: '#E07856' },
    { id: 'm-jia', name: '지아', color: '#3E9C6B' },
  ];

  /* ---- 기관 (Institution) ---- */
  const institutions = [
    { id: 'i-nh', name: '농협은행', type: 'bank' },
    { id: 'i-shinhan', name: '신한은행', type: 'bank' },
    { id: 'i-kakao', name: '카카오뱅크', type: 'bank' },
    { id: 'i-namu', name: '나무증권', type: 'brokerage' },
    { id: 'i-toss', name: '토스증권', type: 'brokerage' },
    { id: 'i-nhinv', name: 'NH투자증권', type: 'brokerage' },
    { id: 'i-upbit', name: '업비트', type: 'brokerage' },
  ];

  /* ---- 계좌 (Account) ---- */
  const accounts = [
    {
      id: 'a-salary',
      memberId: 'm-jiwan',
      institutionId: 'i-nh',
      name: '급여통장',
      accountType: '예금',
      currency: 'KRW',
      kind: 'cash',
    },
    {
      id: 'a-life',
      memberId: 'm-jia',
      institutionId: 'i-shinhan',
      name: '생활비통장',
      accountType: '예금',
      currency: 'KRW',
      kind: 'cash',
    },
    {
      id: 'a-safe',
      memberId: 'm-jiwan',
      institutionId: 'i-kakao',
      name: '세이프박스',
      accountType: '예금',
      currency: 'KRW',
      kind: 'cash',
    },
    {
      id: 'a-isa',
      memberId: 'm-jiwan',
      institutionId: 'i-namu',
      name: 'ISA',
      accountType: 'ISA',
      currency: 'KRW',
      kind: 'invest',
    },
    {
      id: 'a-pension',
      memberId: 'm-jiwan',
      institutionId: 'i-namu',
      name: '연금저축',
      accountType: '연금저축',
      currency: 'KRW',
      kind: 'invest',
    },
    {
      id: 'a-jonghap',
      memberId: 'm-jia',
      institutionId: 'i-toss',
      name: '종합계좌',
      accountType: '종합',
      currency: 'KRW',
      kind: 'invest',
    },
    {
      id: 'a-irp',
      memberId: 'm-jia',
      institutionId: 'i-nhinv',
      name: 'IRP',
      accountType: 'IRP',
      currency: 'KRW',
      kind: 'invest',
    },
    {
      id: 'a-coin',
      memberId: 'm-jiwan',
      institutionId: 'i-upbit',
      name: '코인지갑',
      accountType: '코인',
      currency: 'KRW',
      kind: 'invest',
    },
    {
      id: 'a-cheongyak',
      memberId: 'm-jiwan',
      institutionId: 'i-shinhan',
      name: '주택청약',
      accountType: '청약',
      currency: 'KRW',
      kind: 'invest',
    },
  ];

  /* ---- 종목 (AssetMaster) ---- */
  const assets = [
    {
      id: 'am-sse',
      name: '삼성전자',
      symbol: '005930',
      assetClass: '주식',
      subClass: '배당',
      riskLevel: '위험자산',
      currency: 'KRW',
    },
    {
      id: 'am-snp',
      name: 'S&P 500 ETF',
      symbol: 'SPY',
      assetClass: '주식',
      subClass: '성장',
      riskLevel: '위험자산',
      currency: 'USD',
    },
    {
      id: 'am-ust',
      name: '미국채 10년 ETF',
      symbol: 'IEF',
      assetClass: '채권',
      subClass: '국채',
      riskLevel: '안전자산',
      currency: 'USD',
    },
    {
      id: 'am-corp',
      name: '국내 회사채 펀드',
      symbol: null,
      assetClass: '채권',
      subClass: '회사채',
      riskLevel: '안전자산',
      currency: 'KRW',
    },
    {
      id: 'am-gold',
      name: 'KODEX 골드선물',
      symbol: '132030',
      assetClass: '금',
      subClass: null,
      riskLevel: '안전자산',
      currency: 'KRW',
    },
    {
      id: 'am-btc',
      name: '비트코인',
      symbol: 'BTC',
      assetClass: '코인',
      subClass: null,
      riskLevel: '위험자산',
      currency: 'KRW',
    },
    {
      id: 'am-deposit',
      name: '정기예금',
      symbol: null,
      assetClass: '예금',
      subClass: null,
      riskLevel: '안전자산',
      currency: 'KRW',
    },
    {
      id: 'am-cheongyak',
      name: '주택청약저축',
      symbol: null,
      assetClass: '예금',
      subClass: null,
      riskLevel: '안전자산',
      currency: 'KRW',
    },
  ];

  /* ---- 현금형 종목 판정 (data-model.md 규칙) ---- */
  const CASH_LIKE = /예금|청약|포인트|현금|캐시|자동운용|RP|MMF/;
  const isValueType = assetName => CASH_LIKE.test(assetName);

  /* ---- 보유 + 월별 스냅샷 ----
     quantity형: q/avg/cur 배열(7개월). value형: value 배열(7개월) → 내부적으로 q=1, avg=cur=value. */
  const holdingDefs = [
    {
      id: 'h-isa-sse',
      accountId: 'a-isa',
      assetId: 'am-sse',
      q: [240, 240, 240, 300, 300, 300, 300],
      avg: [70000, 70000, 70000, 72000, 72000, 72000, 72000],
      cur: [69000, 71500, 74000, 73000, 75500, 77000, 78500],
    },
    {
      id: 'h-isa-snp',
      accountId: 'a-isa',
      assetId: 'am-snp',
      fx: [1310, 1320, 1335, 1340, 1345, 1350, 1355],
      q: [80, 80, 80, 80, 80, 80, 80],
      avg: [18500, 18500, 18500, 18500, 18500, 18500, 18500],
      cur: [17800, 18200, 19000, 18500, 19800, 20500, 21200],
    },
    {
      id: 'h-pension-ust',
      accountId: 'a-pension',
      assetId: 'am-ust',
      fx: [1310, 1320, 1335, 1340, 1345, 1350, 1355],
      q: [200, 200, 200, 200, 200, 200, 200],
      avg: [13000, 13000, 13000, 13000, 13000, 13000, 13000],
      cur: [12800, 12700, 12900, 12500, 12400, 12550, 12600],
    },
    {
      id: 'h-jonghap-snp',
      accountId: 'a-jonghap',
      assetId: 'am-snp',
      fx: [1310, 1320, 1335, 1340, 1345, 1350, 1355],
      q: [200, 200, 250, 250, 250, 250, 250],
      avg: [17500, 17500, 17800, 17800, 17800, 17800, 17800],
      cur: [17800, 18200, 19000, 18500, 19800, 20500, 21200],
    },
    {
      id: 'h-jonghap-corp',
      accountId: 'a-jonghap',
      assetId: 'am-corp',
      q: [500, 500, 500, 500, 500, 500, 500],
      avg: [10200, 10200, 10200, 10200, 10200, 10200, 10200],
      cur: [10250, 10300, 10320, 10350, 10400, 10430, 10450],
    },
    {
      id: 'h-irp-gold',
      accountId: 'a-irp',
      assetId: 'am-gold',
      q: [300, 300, 300, 400, 400, 400, 400],
      avg: [14000, 14000, 14000, 14500, 14500, 14500, 14500],
      cur: [14200, 14600, 15200, 15500, 16000, 16500, 16800],
    },
    {
      id: 'h-irp-deposit',
      accountId: 'a-irp',
      assetId: 'am-deposit',
      value: [10000000, 10000000, 11000000, 11000000, 12000000, 12000000, 12000000],
    },
    {
      id: 'h-coin-btc',
      accountId: 'a-coin',
      assetId: 'am-btc',
      q: [0.2, 0.2, 0.2, 0.25, 0.25, 0.25, 0.25],
      avg: [70000000, 70000000, 70000000, 78000000, 78000000, 78000000, 78000000],
      cur: [62000000, 72000000, 85000000, 88000000, 79000000, 90000000, 95000000],
    },
    {
      id: 'h-cheongyak',
      accountId: 'a-cheongyak',
      assetId: 'am-cheongyak',
      value: [7000000, 7200000, 7400000, 7600000, 7800000, 8000000, 8200000],
    },
  ];

  /* ---- 계좌 현금 월별 스냅샷 (CashSnapshot) ---- */
  const cashSeries = {
    'a-salary': [9000000, 7500000, 10500000, 8000000, 11000000, 9500000, 12420000],
    'a-life': [4000000, 3500000, 5000000, 4200000, 5500000, 5000000, 6250000],
    'a-safe': [11000000, 13000000, 12000000, 14000000, 15000000, 16000000, 17169000],
  };

  /* ---- 평균단가 보정 표식 (insight.md '보정월') ---- */
  const avgCostAdjusted = {
    'h-isa-sse': '2026-03',
    'h-coin-btc': '2026-03',
    'h-jonghap-snp': '2026-02',
    'h-irp-gold': '2026-03',
  };

  /* normalise holding into per-month snapshot rows */
  function holdingSnapshot(def, mi) {
    const isVal = !!def.value;
    if (isVal) {
      const v = def.value[mi];
      return { q: 1, avg: v, cur: v, principal: v, value: v, gain: 0, valueType: true };
    }
    const q = def.q[mi],
      avg = def.avg[mi],
      cur = def.cur[mi];
    return {
      q,
      avg,
      cur,
      principal: q * avg,
      value: q * cur,
      gain: q * (cur - avg),
      valueType: false,
    };
  }

  const accountById = Object.fromEntries(accounts.map(a => [a.id, a]));
  const assetById = Object.fromEntries(assets.map(a => [a.id, a]));
  const memberById = Object.fromEntries(members.map(m => [m.id, m]));
  const instById = Object.fromEntries(institutions.map(i => [i.id, i]));

  /* ---- 핵심: 한 달의 스냅샷에서 모든 지표 계산 ---- */
  function compute(mi) {
    const ym = MONTHS[mi];
    let C = 0,
      V = 0,
      P = 0;
    const cashRows = [];
    accounts
      .filter(a => a.kind === 'cash')
      .forEach(a => {
        const bal = (cashSeries[a.id] || [])[mi] || 0;
        C += bal;
        cashRows.push({ account: a, balance: bal });
      });
    const holdings = holdingDefs.map(def => {
      const snap = holdingSnapshot(def, mi);
      const acct = accountById[def.accountId];
      const asset = assetById[def.assetId];
      P += snap.principal;
      V += snap.value;
      return {
        def,
        account: acct,
        asset,
        member: memberById[acct.memberId],
        institution: instById[acct.institutionId],
        ...snap,
        ret: snap.principal > 0 ? snap.gain / snap.principal : null,
        adjusted: avgCostAdjusted[def.id] === ym,
        fx: def.fx ? def.fx[mi] : null,
      };
    });
    const N = C + V,
      G = V - P;
    return { ym, label: MONTH_LABEL[ym], C, V, P, N, G, cashRows, holdings };
  }

  function series() {
    return MONTHS.map((_, mi) => compute(mi));
  }

  /* ---- ★ 자산 증가 분해 (FR-C5): ΔN = ΔC + ΔP + ΔG ---- */
  function decompose(mi) {
    if (mi === 0) return null;
    const a = compute(mi - 1),
      b = compute(mi);
    const dC = b.C - a.C,
      dP = b.P - a.P,
      dG = b.G - a.G,
      dN = b.N - a.N;
    return {
      from: a,
      to: b,
      dC,
      dP,
      dG,
      dN,
      savings: dC + dP, // 순수 원금 증가(저축/납입)
      market: dG, // 투자 수익(시장)
      adjustedMonth: b.holdings.some(h => h.adjusted),
    };
  }

  /* ---- 그룹 집계 (구성별 분해 FR-C4 / 비중 FR-C2) ---- */
  function groupBy(snap, dim) {
    const map = {};
    snap.holdings.forEach(h => {
      let key, color;
      if (dim === 'member') {
        key = h.member.name;
        color = h.member.color;
      } else if (dim === 'institution') {
        key = h.institution.name;
        color = null;
      } else if (dim === 'assetClass') {
        key = h.asset.assetClass;
        color = null;
      } else if (dim === 'risk') {
        key = h.asset.riskLevel;
        color = null;
      }
      map[key] = map[key] || { key, value: 0, color };
      map[key].value += h.value;
    });
    // member 차원은 현금도 포함
    if (dim === 'member') {
      snap.cashRows.forEach(r => {
        const m = memberById[r.account.memberId];
        map[m.name] = map[m.name] || { key: m.name, value: 0, color: m.color };
        map[m.name].value += r.balance;
      });
    }
    return Object.values(map).sort((x, y) => y.value - x.value);
  }

  /* 위험/안전 분포 — 현금은 안전자산으로 본다 (insight.md FR-C2) */
  function riskSplit(snap) {
    let risk = 0,
      safe = 0;
    snap.holdings.forEach(h => {
      if (h.asset.riskLevel === '위험자산') risk += h.value;
      else safe += h.value;
    });
    safe += snap.C;
    return { risk, safe, total: risk + safe };
  }

  /* ---- formatting ---- */
  function won(n) {
    const neg = n < 0;
    n = Math.abs(Math.round(n));
    return (neg ? '-' : '') + n.toLocaleString('ko-KR') + '원';
  }
  // 만/억 요약 (큰 금액용)
  function wonShort(n) {
    const neg = n < 0;
    n = Math.abs(Math.round(n));
    const eok = Math.floor(n / 100000000);
    const man = Math.floor((n % 100000000) / 10000);
    let s = '';
    if (eok > 0) s += eok + '억 ';
    if (man > 0) s += man.toLocaleString('ko-KR') + '만';
    if (!s) s = n.toLocaleString('ko-KR');
    return (neg ? '-' : '') + s.trim() + '원';
  }
  function pct(x, digits) {
    return (x * 100).toFixed(digits == null ? 1 : digits) + '%';
  }
  function signed(n) {
    return (n >= 0 ? '+' : '') + won(n);
  }
  function signedShort(n) {
    return (n >= 0 ? '+' : '') + wonShort(n);
  }

  const CONST = {
    ASSET_CLASS: ['주식', '채권', '예금', '금', '코인'],
    SUB_CLASS: ['성장', '배당', '국채', '회사채'],
    RISK_LEVEL: ['위험자산', '안전자산'],
    ACCOUNT_TYPE: [
      '예금',
      '적금',
      '청약',
      '종합',
      'CMA',
      'IRP',
      'ISA',
      '연금저축',
      '코인',
      '금현물',
    ],
    CURRENCY: ['KRW', 'USD'],
  };

  /* class palette (warm, from blocks/semantics) */
  const CLASS_COLOR = {
    주식: '#E07856',
    채권: '#3E9C6B',
    예금: '#E8B04B',
    금: '#C9963F',
    코인: '#A78BFA',
  };
  const INST_COLOR = {
    농협은행: '#2E8B57',
    신한은행: '#2E5BFF',
    카카오뱅크: '#E8B04B',
    나무증권: '#7C8B5A',
    토스증권: '#3B82F6',
    NH투자증권: '#1F8A5B',
    업비트: '#5B7BD4',
  };

  window.WF = {
    MONTHS,
    MONTH_LABEL,
    members,
    institutions,
    accounts,
    assets,
    holdingDefs,
    cashSeries,
    accountById,
    assetById,
    memberById,
    instById,
    isValueType,
    compute,
    series,
    decompose,
    groupBy,
    riskSplit,
    won,
    wonShort,
    pct,
    signed,
    signedShort,
    CONST,
    CLASS_COLOR,
    INST_COLOR,
    avgCostAdjusted,
  };
})();
