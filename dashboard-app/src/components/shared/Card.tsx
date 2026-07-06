import type { CSSProperties, ReactNode } from 'react';
import type { InfoId } from '../../types';

export interface CardProps {
  infoId: InfoId;
  title?: string;
  flex?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  /** Unused today — reserved for the future click-to-explain feature. */
  onExplainClick?: (id: InfoId) => void;
}

export function Card({ infoId, title, flex, className, style, children, onExplainClick }: CardProps) {
  return (
    <div
      className={['card', className].filter(Boolean).join(' ')}
      style={flex !== undefined ? { flex, ...style } : style}
      data-info={infoId}
      onClick={onExplainClick ? () => onExplainClick(infoId) : undefined}
    >
      {title && <div className="card-title">{title}</div>}
      {children}
    </div>
  );
}
