import { Annotation, AnnotationType, AnnotationPosition } from '../../shared/types';

export function createHotspotElement(
  hotspotDiv: HTMLElement,
  annotation: Annotation,
  onSelect?: (annotation: Annotation) => void
) {
  hotspotDiv.classList.add('custom-panorama-hotspot');
  hotspotDiv.style.cursor = 'pointer';
  hotspotDiv.innerHTML = `<div class="px-2 py-1 bg-slate-900 text-white rounded text-xs">${annotation.content?.title || ''}</div>`;
  if (onSelect) {
    hotspotDiv.onclick = (e) => {
      e.stopPropagation();
      onSelect(annotation);
    };
  }
}

export interface TemplateDefinition {
  type: AnnotationType;
  key: string;
  name: string;
  description: string;
  defaultContent: Record<string, any>;
  defaultStyle: Record<string, any>;
}

export const ANNOTATION_TEMPLATES: TemplateDefinition[] = [
  {
    type: 'measurement',
    key: 'measurement',
    name: 'Линейка / Размер',
    description: 'Архитектурный размер с засечками и выносной размерной линией (например: 2.4 м, 15 м²)',
    defaultContent: {
      title: 'Размер',
      value: '2.40',
      unit: 'м',
    },
    defaultStyle: {
      backgroundColor: '#4f46e5',
      color: '#ffffff',
      lineColor: '#6366f1',
    },
  },
  {
    type: 'callout',
    key: 'callout',
    name: 'Выноска с описанием',
    description: 'Интерактивная точка с линией-выноской и подробной карточкой описания',
    defaultContent: {
      title: 'Премиальная отделка',
      text: 'Итальянский керамогранит, подогрев пола, панорамное остекление',
    },
    defaultStyle: {
      backgroundColor: '#059669',
      color: '#ffffff',
    },
  },
  {
    type: 'label',
    key: 'simple-label',
    name: 'Текстовая плашка',
    description: 'Компактная дизайнерская плашка с названием зоны или элемента',
    defaultContent: {
      title: 'Зона отдыха',
    },
    defaultStyle: {
      backgroundColor: '#1e293b',
      color: '#ffffff',
    },
  },
  {
    type: 'marker',
    key: 'marker',
    name: 'Маркер внимания',
    description: 'Пульсирующий маячок с открываемой информацией',
    defaultContent: {
      title: 'Информация',
      text: 'Нажмите для просмотра подробностей',
    },
    defaultStyle: {
      backgroundColor: '#ea580c',
      color: '#ffffff',
    },
  },
];

export function getTemplate(typeOrKey: string): TemplateDefinition {
  const match = ANNOTATION_TEMPLATES.find(
    (t) => t.key === typeOrKey || t.type === typeOrKey
  );
  return match || ANNOTATION_TEMPLATES[0];
}

/**
 * Normalizes coordinate position to percentage (0..100%).
 * Supports both {x, y} and legacy {yaw, pitch}.
 */
export function normalizePosition(pos: AnnotationPosition): {
  x: number;
  y: number;
  x2: number;
  y2: number;
} {
  let x = pos.x;
  let y = pos.y;

  if (x === undefined || y === undefined) {
    x = (((pos.yaw ?? 0) + 180) / 360) * 100;
    y = (((pos.pitch ?? 0) + 90) / 180) * 100;
  }

  // Bound to 0..100
  x = Math.max(0, Math.min(100, x));
  y = Math.max(0, Math.min(100, y));

  let x2 = pos.x2 !== undefined ? Math.max(0, Math.min(100, pos.x2)) : Math.min(100, x + 12);
  let y2 = pos.y2 !== undefined ? Math.max(0, Math.min(100, pos.y2)) : y;

  return { x, y, x2, y2 };
}
