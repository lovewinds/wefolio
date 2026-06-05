import { describe, it, expect } from 'vitest';
import { buildNewHoldingRow, getInputType } from '../monthly-input-row';

describe('getInputType', () => {
  it('예금 계좌는 value형', () => {
    expect(getInputType('주식', '예금')).toBe('value');
  });
  it('CMA 계좌는 value형', () => {
    expect(getInputType('주식', 'CMA')).toBe('value');
  });
  it('종합 계좌의 주식은 quantity형', () => {
    expect(getInputType('주식', '종합')).toBe('quantity');
  });
});

describe('buildNewHoldingRow', () => {
  const base = {
    date: '2026-06-30',
    account: { id: 'acc1', name: '연금저축펀드', memberName: '남편', accountType: '연금저축' },
    institution: { name: '나무증권', type: 'brokerage' },
    assetMaster: {
      id: 'am1',
      name: 'ACE미국나스닥100',
      assetClass: '주식',
      currency: 'KRW',
      riskLevel: '위험자산',
    },
  };

  it('계좌·기관·종목 맥락을 행에 채운다', () => {
    const row = buildNewHoldingRow(base);
    expect(row.accountId).toBe('acc1');
    expect(row.assetMasterId).toBe('am1');
    expect(row.memberName).toBe('남편');
    expect(row.institutionName).toBe('나무증권');
    expect(row.institutionType).toBe('brokerage');
    expect(row.accountName).toBe('연금저축펀드');
    expect(row.isNew).toBe(true);
    expect(row.holdingId).toBeNull();
    expect(row.rowKey).toBe('new-acc1-am1');
  });

  it('종목이면 quantity형으로 펼침', () => {
    const row = buildNewHoldingRow(base);
    expect(row.inputType).toBe('quantity');
    expect(row.isExpanded).toBe(true);
    expect(row.quantityInput).toBe('');
  });

  it('예금류 계좌는 value형으로 수량 1', () => {
    const row = buildNewHoldingRow({
      ...base,
      account: { ...base.account, accountType: '예금' },
      institution: { name: '신한은행', type: 'bank' },
    });
    expect(row.inputType).toBe('value');
    expect(row.quantityInput).toBe('1');
    expect(row.isExpanded).toBe(false);
  });
});
