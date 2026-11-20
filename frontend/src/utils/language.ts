import type { LanguageMode } from '../types';

export type ReplyLanguage = 'english' | 'urdu_roman' | 'urdu_script';

const URDU_WORDS = new Set([
  'kya', 'kia', 'hai', 'hain', 'ha', 'ka', 'ki', 'ke', 'ko', 'mein', 'me', 'mai', 'main',
  'se', 'par', 'pe', 'tak', 'kab', 'kahan', 'kaha', 'kaise', 'kese', 'kitne', 'kitna',
  'kitni', 'kyun', 'kyu', 'kon', 'kaun', 'nahi', 'nahin', 'mujhe', 'mera', 'meri', 'hum',
  'aap', 'ap', 'tum', 'kar', 'karo', 'karna', 'karein', 'ho', 'hoga', 'hogi', 'hota',
  'sakta', 'sakti', 'chahiye', 'batao', 'bataye', 'bata', 'wala', 'wali', 'abhi', 'kal',
  'aaj', 'shukriya', 'salam', 'assalam', 'janab', 'khula', 'khulta', 'band', 'baje',
  'bimar', 'bimari', 'milega', 'milta', 'milti', 'paisay', 'fees', 'wajah', 'agar', 'aur',
  'lekin', 'bhi', 'to', 'toh', 'jata', 'jati', 'jaye', 'jaaye', 'rehta', 'rehti',
]);

const URDU_SCRIPT = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function hasUrduScript(text: string): boolean {
  return URDU_SCRIPT.test(text);
}

export function detectLanguage(text: string): ReplyLanguage {
  if (hasUrduScript(text)) return 'urdu_script';
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  const matches = words.filter((word) => URDU_WORDS.has(word)).length;
  if (matches >= 2 || (words.length <= 3 && matches >= 1)) return 'urdu_roman';
  return 'english';
}

export function getReplyLanguage(
  text: string,
  mode: LanguageMode,
  urduScriptMode: boolean,
): { detectedLanguage: ReplyLanguage; replyLanguage: ReplyLanguage } {
  const detectedLanguage = detectLanguage(text);
  if (mode === 'english') return { detectedLanguage, replyLanguage: 'english' };
  if (mode === 'urdu') {
    return { detectedLanguage, replyLanguage: urduScriptMode ? 'urdu_script' : 'urdu_roman' };
  }
  return {
    detectedLanguage,
    replyLanguage: detectedLanguage === 'english'
      ? 'english'
      : urduScriptMode ? 'urdu_script' : 'urdu_roman',
  };
}

export function characterCount(text: string): number {
  return Array.from(text).length;
}

export function truncateCharacters(text: string, max = 300): string {
  return Array.from(text).slice(0, max).join('');
}
