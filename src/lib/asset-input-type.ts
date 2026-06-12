/**
 * 월별 입력 종목 유형 분류.
 * - 'value': 현금성(예금·적금·CMA 등) — 평가액 한 값만 입력, 원가=평가액(수익 0).
 * - 'quantity': 주식·ETF·채권·금·코인 등 — 수량 × 가격.
 *
 * 입력 UI(`getInputType`)·집계(`isValueTypeHolding`)·평균단가 백필이 공유한다.
 * (별도 import가 없어 prisma seed/tsx 컨텍스트에서도 그대로 쓸 수 있다.)
 */
export function getAssetInputType(assetClass: string, accountType: string): 'value' | 'quantity' {
  const valueOnlyTokens = ['deposit', 'savings', 'time_deposit', 'cma', 'cash'];
  const lowerAssetClass = assetClass.toLowerCase();
  const lowerAccountType = accountType.toLowerCase();

  if (
    assetClass.includes('예금') ||
    assetClass.includes('현금') ||
    accountType.includes('예금') ||
    accountType.includes('적금') ||
    accountType.toUpperCase().includes('CMA')
  ) {
    return 'value';
  }

  return valueOnlyTokens.some(
    token => lowerAssetClass.includes(token) || lowerAccountType === token
  )
    ? 'value'
    : 'quantity';
}
