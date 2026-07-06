import { useEffect } from 'react';
import type { InfoId, Language } from '../../types';
import { explainRegistry } from '../../data/explainRegistry';
import { getExplanation } from '../../data/explanations';
import './ExplanationModal.css';

interface Props {
  infoId: InfoId | null;
  language: Language;
  onClose: () => void;
}

function renderMarkdown(raw: string) {
  return raw
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .flatMap((block, i) => {
      if (block.startsWith('# ') && !block.startsWith('## ')) return [];
      if (block.startsWith('## ')) {
        const [heading, ...rest] = block.split('\n');
        const answer = rest.join(' ').trim();
        return [
          <h3 key={`${i}-h`}>{heading.slice(3)}</h3>,
          answer && <p key={`${i}-p`}>{answer}</p>,
        ].filter(Boolean);
      }
      return [<p key={i}>{block}</p>];
    });
}

export function ExplanationModal({ infoId, language, onClose }: Props) {
  useEffect(() => {
    if (!infoId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [infoId, onClose]);

  if (!infoId) return null;

  const entry = explainRegistry[infoId];
  const body = getExplanation(infoId, language);

  return (
    <div className="explanation-modal-overlay" onClick={onClose}>
      <div className="explanation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="explanation-modal-header">
          <span>{entry.title}</span>
          <button type="button" className="explanation-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="explanation-modal-body">{renderMarkdown(body)}</div>
      </div>
    </div>
  );
}
