import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-hairline bg-surface p-6 shadow-[var(--shadow-1)] ${className}`}
    >
      {children}
    </div>
  );
}
