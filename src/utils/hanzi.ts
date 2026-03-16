import pinyinData from './pinyin-hanzi.json';
import { pinyin } from 'pinyin-pro';

const pinyinDict = pinyinData as Record<string, string>;

const charToPinyinMap: Record<string, string[]> = {};
for (const [pinyin, hanziGroup] of Object.entries(pinyinDict)) {
  for (const char of hanziGroup) {
    if (!charToPinyinMap[char]) charToPinyinMap[char] = [];
    charToPinyinMap[char].push(pinyin);
  }
}

export const allHanziList = Object.values(pinyinDict).join('').split('');

export function getHanziOf(pinyin: string): string[] {
  return pinyinDict[pinyin.toLowerCase()]?.split('') || [];
}


export function getSinglePinyinOf(hanzi: string): string[] {
  if (!hanzi) return [];
  const char = hanzi[0]; 
  return charToPinyinMap[char] || [];
}


export function getPinyinOf(hanzi: string): string[] {
  if (!hanzi) return [];
  
  const char = hanzi[0]; 
  
  const backup = pinyin(char, { 
    multiple: true,  
    type: 'array',  
    toneType: 'none'
  });

  if (backup.length > 0 && backup[0] !== char) {
    return backup.map(p => p.replaceAll('ü', 'v'));
  }

  return [];
}

export function isValidHanzi(char: string): boolean {
  if (!char) return false;
  const singleChar = char[0];

  if (singleChar in charToPinyinMap) {
    return true;
  }
  const result = pinyin(singleChar, { pattern: 'pinyin' });
  
  return result !== singleChar;
}

export function isValidPinyin(pinyin: string): boolean {
  return pinyin.toLowerCase() in pinyinDict;
}
