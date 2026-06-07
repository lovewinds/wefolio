import { describe, it, expect } from 'vitest';
import { formatSignedPercent, formatThousandsInput, stripThousandsInput } from '../format-utils';

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
