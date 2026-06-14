import { describe, it, expect } from 'vitest';
import { isDustComparisonRow } from '../asset-profit-view';

describe('isDustComparisonRow', () => {
  it('원금·평가액이 모두 1만원 미만이면 dust로 제외(예: 제로지)', () => {
    expect(isDustComparisonRow({ principal: 2589, value: 1085 })).toBe(true);
  });

  it('큰 포지션은 유지', () => {
    expect(isDustComparisonRow({ principal: 160_000_000, value: 210_000_000 })).toBe(false);
  });

  it('평가폭락(원금 큼·평가액 소액)은 유지', () => {
    expect(isDustComparisonRow({ principal: 1_000_000, value: 5_000 })).toBe(false);
  });

  it('급등(원금 소액·평가액 큼)은 유지', () => {
    expect(isDustComparisonRow({ principal: 5_000, value: 500_000 })).toBe(false);
  });

  it('경계값: 둘 다 9,999원이면 dust', () => {
    expect(isDustComparisonRow({ principal: 9_999, value: 9_999 })).toBe(true);
  });

  it('경계값: 한쪽이 10,000원이면 유지', () => {
    expect(isDustComparisonRow({ principal: 10_000, value: 9_999 })).toBe(false);
  });
});
