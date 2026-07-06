import type { InfoId, Language } from '../types';
import { explainRegistry } from './explainRegistry';

const files = import.meta.glob('../../../each-component-explanation/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function findRaw(mdFile: string): string {
  const entry = Object.entries(files).find(([path]) => path.endsWith(mdFile));
  return entry?.[1] ?? '';
}

const englishContent = Object.fromEntries(
  Object.entries(explainRegistry).map(([id, entry]) => [id, findRaw(entry.mdFile)]),
) as Record<InfoId, string>;

const JP_PLACEHOLDER = '## 日本語\n\nJapanese translation coming soon.';

export function getExplanation(id: InfoId, language: Language): string {
  if (language === 'jp') return JP_PLACEHOLDER;
  return englishContent[id];
}
