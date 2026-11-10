import React from 'react';
import { ObjectStatus } from '../types';

export interface BadgeProps {
  status?: ObjectStatus | 'ready' | string;
  children?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, children, className = '' }) => {
  let label = children;
  let colorStyles = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (status) {
    case 'published':
      label = label || 'Опубликован';
      colorStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'draft':
      label = label || 'Черновик';
      colorStyles = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case 'archived':
      label = label || 'Архив';
      colorStyles = 'bg-slate-100 text-slate-500 border-slate-200';
      break;
    case 'ready':
      label = label || 'Готово';
      colorStyles = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorStyles} ${className}`}
    >
      {label}
    </span>
  );
};

