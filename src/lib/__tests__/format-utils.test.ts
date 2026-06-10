import { describe, it, expect } from 'vitest';
import {
  formatExchangeRate,
  formatKoreanWonCompact,
  formatSignedPercent,
  formatThousandsInput,
  stripThousandsInput,
} from '../format-utils';

describe('formatExchangeRate', () => {
  it('USD 등은 1단위 기준 소수점 2자리', () => {
    expect(formatExchangeRate(1525.4, 'USD')).toBe('1,525.40');
    expect(formatExchangeRate(1390.358361774744, 'USD')).toBe('1,390.36');
  });
  it('JPY는 100엔 기준 정수', () => {
    expect(formatExchangeRate(9.3749, 'JPY')).toBe('937 (100엔)');
    expect(formatExchangeRate(9, 'JPY')).toBe('900 (100엔)');
  });
  it('통화 미지정은 USD 스타일', () => {
    expect(formatExchangeRate(1427)).toBe('1,427.00');
  });
});

describe('formatThousandsInput', () => {
  it('빈 문자열은 그대로', () => {
    expect(formatThousandsInput('')).toBe('');
  });
  it('천 단위 콤마를 붙인다', () => {
    expect(formatThousandsInput('1234')).toBe('1,234');
    expect(formatThousandsInput('1000000')).toBe('1,000,000');
  });
  it('소수점 입력 중에도 정수부만 그룹화한다', () => {
    expect(formatThousandsInput('1234.')).toBe('1,234.');
    expect(formatThousandsInput('1234.56')).toBe('1,234.56');
  });
  it('숫자가 아닌 문자는 제거한다', () => {
    expect(formatThousandsInput('1,234')).toBe('1,234');
    expect(formatThousandsInput('abc')).toBe('');
  });
});

describe('stripThousandsInput', () => {
  it('콤마를 제거한다', () => {
    expect(stripThousandsInput('1,234')).toBe('1234');
    expect(stripThousandsInput('1,234.56')).toBe('1234.56');
  });
  it('라운드트립: strip(format(x)) === x', () => {
    for (const x of ['', '0', '1234', '1000000', '1234.56', '123.4']) {
      expect(stripThousandsInput(formatThousandsInput(x))).toBe(x);
    }
  });
});

describe('formatSignedPercent', () => {
  it('상승은 gain 토큰과 ▲', () => {
    expect(formatSignedPercent(65000, 71200)).toEqual({ text: '▲ +9.5%', tone: 'gain' });
  });
  it('하락은 loss 토큰과 ▼', () => {
    expect(formatSignedPercent(100, 96.9)).toEqual({ text: '▼ -3.1%', tone: 'loss' });
  });
  it('동일하면 · 유지(flat)', () => {
    expect(formatSignedPercent(50000, 50000)).toEqual({ text: '· 유지', tone: 'flat' });
  });
  it('전월값이 없으면 비교 불가', () => {
    expect(formatSignedPercent(null, 1000)).toEqual({ text: '', tone: 'none' });
  });
  it('현재값이 없으면 비교 불가', () => {
    expect(formatSignedPercent(1000, null)).toEqual({ text: '', tone: 'none' });
  });
  it('전월값이 0 이하면 비교 불가(0분모 방지)', () => {
    expect(formatSignedPercent(0, 1000)).toEqual({ text: '', tone: 'none' });
    expect(formatSignedPercent(-10, 1000)).toEqual({ text: '', tone: 'none' });
  });
});

describe('formatKoreanWonCompact', () => {
  it('만원 미만은 표시하지 않는다', () => {
    expect(formatKoreanWonCompact(0)).toBe('0원');
    expect(formatKoreanWonCompact(9999)).toBe('0원');
  });

  it('만원 단위로 절삭해 표시한다', () => {
    expect(formatKoreanWonCompact(12345)).toBe('1만원');
    expect(formatKoreanWonCompact(12345678)).toBe('1234만원');
  });

  it('억과 만원을 조합해 표시한다', () => {
    expect(formatKoreanWonCompact(412340000)).toBe('4억 1234만원');
    expect(formatKoreanWonCompact(400000000)).toBe('4억');
  });

  it('부호를 붙여 표시할 수 있다', () => {
    expect(formatKoreanWonCompact(412340000, { signed: true })).toBe('+4억 1234만원');
    expect(formatKoreanWonCompact(-412340000, { signed: true })).toBe('-4억 1234만원');
    expect(formatKoreanWonCompact(0, { signed: true })).toBe('0원');
  });
});
