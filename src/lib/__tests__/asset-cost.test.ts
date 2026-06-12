import { describe, expect, it } from 'vitest';
import { deriveAvgCostKRW } from '@/lib/asset-cost';

describe('deriveAvgCostKRW', () => {
  it('직전 스냅샷이 없으면 현재가를 원가 시작점으로 한다', () => {
    expect(deriveAvgCostKRW(null, 10, 7000)).toBe(7000);
  });

  it('직전 수량이 0이면 현재가를 원가로 한다(재진입)', () => {
    expect(deriveAvgCostKRW({ quantity: 0, avgCostKRW: 5000 }, 10, 7000)).toBe(7000);
  });

  it('수량 증가 시 추가 몫을 현재가로 본 가중평균을 반환한다', () => {
    // (10*70000 + 5*90000) / 15
    expect(deriveAvgCostKRW({ quantity: 10, avgCostKRW: 70000 }, 15, 90000)).toBeCloseTo(
      1150000 / 15,
      6
    );
  });

  it('수량이 같으면 평단가를 유지한다', () => {
    expect(deriveAvgCostKRW({ quantity: 10, avgCostKRW: 70000 }, 10, 90000)).toBe(70000);
  });

  it('수량이 감소(매도)하면 평단가를 유지한다', () => {
    expect(deriveAvgCostKRW({ quantity: 10, avgCostKRW: 70000 }, 4, 90000)).toBe(70000);
  });
});
