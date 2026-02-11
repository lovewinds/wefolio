/**
 * 한글 초성 검색 유틸리티
 */

const CHOSUNG_LIST = [
  'ㄱ',
  'ㄲ',
  'ㄴ',
  'ㄷ',
  'ㄸ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅃ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅉ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
] as const;

const CHOSUNG_SET = new Set<string>(CHOSUNG_LIST);

const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;

/**
 * 한글 완성형 글자에서 초성을 추출
 */
function getChosung(char: string): string {
  const code = char.charCodeAt(0);
  if (code < HANGUL_START || code > HANGUL_END) return char;
  const index = Math.floor((code - HANGUL_START) / 588);
  return CHOSUNG_LIST[index] ?? char;
}

/**
 * 문자열에서 초성만 추출
 */
export function extractChosung(str: string): string {
  return Array.from(str).map(getChosung).join('');
}

/**
 * 입력 텍스트가 초성으로만 구성되어 있는지 확인
 */
export function isChosungOnly(str: string): boolean {
  return Array.from(str).every(char => CHOSUNG_SET.has(char));
}

/**
 * 한글 초성 검색을 포함한 매칭 함수
 * 1. 초성만 입력된 경우: 각 글자의 초성과 매칭
 * 2. 일반 텍스트: startsWith → includes fallback
 */
export function matchHangul(text: string, query: string): boolean {
  if (!query) return true;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // 초성 검색
  if (isChosungOnly(query)) {
    const textChosung = extractChosung(lowerText);
    return textChosung.includes(lowerQuery);
  }

  // 일반 텍스트: prefix 매칭 → includes fallback
  if (lowerText.startsWith(lowerQuery)) return true;
  return lowerText.includes(lowerQuery);
}
