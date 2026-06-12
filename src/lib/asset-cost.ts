/**
 * 평균단가(원금 기준) 자동 파생.
 *
 * 거래 기록 없이, 직전 스냅샷의 (수량·평단가)와 이번 달 (수량·현재가)만으로 원가를 추론한다.
 * - 신규/직전 없음: 이번 달 현재가를 원가 시작점으로 본다(과거 체결가 미상 → 근사).
 * - 수량 증가(추가 매수 추정): 늘어난 몫을 이번 달 현재가로 산 것으로 보고 가중평균.
 * - 수량 동일/감소(보유·매도): 평단가를 유지한다(매도는 남은 주식의 원가를 바꾸지 않음).
 *
 * 자세한 규칙·효과·한계는 docs/product/insights.md의 "평균단가 자동 파생" 참조.
 */
export function deriveAvgCostKRW(
  prev: { quantity: number; avgCostKRW: number } | null,
  quantity: number,
  priceKRW: number
): number {
  if (!prev || prev.quantity <= 0) return priceKRW;
  if (quantity > prev.quantity) {
    return (prev.quantity * prev.avgCostKRW + (quantity - prev.quantity) * priceKRW) / quantity;
  }
  return prev.avgCostKRW;
}
