import type { InfoId, Language } from '../types';
import { explainRegistry } from './explainRegistry';

const enFiles = import.meta.glob('../../../each-component-explanation/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const jpFiles = import.meta.glob('../../../each-component-explanation-jp/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function findRaw(source: Record<string, string>, mdFile: string): string {
  const entry = Object.entries(source).find(([path]) => path.endsWith(mdFile));
  return entry?.[1] ?? '';
}

const englishContent = Object.fromEntries(
  Object.entries(explainRegistry).map(([id, entry]) => [id, findRaw(enFiles, entry.mdFile)]),
) as Record<InfoId, string>;

const japaneseContent = Object.fromEntries(
  Object.entries(explainRegistry).map(([id, entry]) => [id, findRaw(jpFiles, entry.mdFile)]),
) as Record<InfoId, string>;

export function getExplanation(id: InfoId, language: Language): string {
  if (language === 'jp') return japaneseContent[id];
  return englishContent[id];
}
