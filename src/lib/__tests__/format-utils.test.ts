import { describe, it, expect } from 'vitest';
import { formatThousandsInput, stripThousandsInput } from '../format-utils';

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
