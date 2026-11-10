import React, { useState, useRef } from 'react';
import { Annotation } from '../../shared/types';
import { normalizePosition } from './annotationTemplates';
import { Ruler, Info } from 'lucide-react';

interface AnnotationItemProps {
  annotation: Annotation;
  isSelected?: boolean;
  isEditMode?: boolean;
  onSelect?: (annotation: Annotation) => void;
  onPositionChange?: (
    newPosition: { x: number; y: number; x2?: number; y2?: number },
    isFinal: boolean
  ) => void;
}

export const AnnotationItem: React.FC<AnnotationItemProps> = ({
  annotation,
  isSelected = false,
  isEditMode = false,
  onSelect,
  onPositionChange,
}) => {
  const { x, y, x2, y2 } = normalizePosition(annotation.position);
  const { type, content, style } = annotation;
  const [isOpen, setIsOpen] = useState(false);
  const isDraggingRef = useRef(false);

  const bg = style?.backgroundColor || '#4f46e5';
  const textCol = style?.color || '#ffffff';
  const lineColor = style?.lineColor || bg;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDraggingRef.current) return;
    if (onSelect) onSelect(annotation);
    setIsOpen(!isOpen);
  };

  /**
   * Unified 60fps drag handler for desktop (mouse) and mobile (touch).
   * Supports dragging Point A ('p1'), Point B ('p2'), or the whole ruler ('both').
   * Guarantees exact coordinate calculation and persists on mouseup/touchend.
   */
  const handleStartDrag = (
    e: React.MouseEvent | React.TouchEvent,
    dragType: 'p1' | 'p2' | 'both'
  ) => {
    if (!isEditMode || !onPositionChange) return;
    e.stopPropagation();

    const target = e.currentTarget as HTMLElement;
    const container = target.closest('.panorama-image-container') as HTMLElement | null;
    if (!container) return;

    // Get current normalized positions at the moment drag begins
    const norm = normalizePosition(annotation.position);
    const startP1 = { x: norm.x, y: norm.y };
    const startP2 = { x: norm.x2, y: norm.y2 };

    const initialRect = container.getBoundingClientRect();
    const startClientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const startClientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const startPercentX = ((startClientX - initialRect.left) / initialRect.width) * 100;
    const startPercentY = ((startClientY - initialRect.top) / initialRect.height) * 100;

    let hasMoved = false;
    isDraggingRef.current = false;

    let latestPos: { x: number; y: number; x2?: number; y2?: number } = {
      x: startP1.x,
      y: startP1.y,
      x2: type === 'measurement' ? startP2.x : undefined,
      y2: type === 'measurement' ? startP2.y : undefined,
    };

    const onMove = (moveEv: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in moveEv ? moveEv.touches[0].clientX : (moveEv as MouseEvent).clientX;
      const clientY = 'touches' in moveEv ? moveEv.touches[0].clientY : (moveEv as MouseEvent).clientY;

      if (!hasMoved) {
        const dist = Math.hypot(clientX - startClientX, clientY - startClientY);
        if (dist > 3) {
          hasMoved = true;
          isDraggingRef.current = true;
        }
      }

      if (!hasMoved) return;

      const currentRect = container.getBoundingClientRect();
      if (!currentRect.width || !currentRect.height) return;

      const currPercentX = ((clientX - currentRect.left) / currentRect.width) * 100;
      const currPercentY = ((clientY - currentRect.top) / currentRect.height) * 100;

      const totalDeltaX = currPercentX - startPercentX;
      const totalDeltaY = currPercentY - startPercentY;

      let nextPos: { x: number; y: number; x2?: number; y2?: number };

      if (dragType === 'p1') {
        nextPos = {
          x: Number(Math.max(0, Math.min(100, currPercentX)).toFixed(2)),
          y: Number(Math.max(0, Math.min(100, currPercentY)).toFixed(2)),
          x2: type === 'measurement' ? Number(startP2.x.toFixed(2)) : undefined,
          y2: type === 'measurement' ? Number(startP2.y.toFixed(2)) : undefined,
        };
      } else if (dragType === 'p2') {
        nextPos = {
          x: Number(startP1.x.toFixed(2)),
          y: Number(startP1.y.toFixed(2)),
          x2: Number(Math.max(0, Math.min(100, currPercentX)).toFixed(2)),
          y2: Number(Math.max(0, Math.min(100, currPercentY)).toFixed(2)),
        };
      } else {
        // 'both': Move entire element / ruler preserving length and orientation
        if (type === 'measurement') {
          const minX = Math.min(startP1.x, startP2.x);
          const maxX = Math.max(startP1.x, startP2.x);
          const minY = Math.min(startP1.y, startP2.y);
          const maxY = Math.max(startP1.y, startP2.y);

          const clampedDeltaX = Math.max(-minX, Math.min(100 - maxX, totalDeltaX));
          const clampedDeltaY = Math.max(-minY, Math.min(100 - maxY, totalDeltaY));

          nextPos = {
            x: Number((startP1.x + clampedDeltaX).toFixed(2)),
            y: Number((startP1.y + clampedDeltaY).toFixed(2)),
            x2: Number((startP2.x + clampedDeltaX).toFixed(2)),
            y2: Number((startP2.y + clampedDeltaY).toFixed(2)),
          };
        } else {
          nextPos = {
            x: Number(Math.max(0, Math.min(100, startP1.x + totalDeltaX)).toFixed(2)),
            y: Number(Math.max(0, Math.min(100, startP1.y + totalDeltaY)).toFixed(2)),
          };
        }
      }

      latestPos = nextPos;
      onPositionChange(nextPos, false);
    };

    const onEnd = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);

      if (hasMoved) {
        onPositionChange(latestPos, true);
        // Clear dragging flag after a short delay so click does not fire immediately
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 100);
      } else {
        isDraggingRef.current = false;
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  };

  /* -------------------------------------------------------------
   * 1. MEASUREMENT (REAL ARCHITECTURAL DIMENSION LINE)
   * ------------------------------------------------------------- */
  if (type === 'measurement') {
    const midX = (x + x2) / 2;
    const midY = (y + y2) / 2;

    // Vector calculations for witness ticks perpendicular to the dimension line
    const dx = x2 - x;
    const dy = y2 - y;
    const len = Math.hypot(dx, dy);
    // Unit normal vector
    const nx = len > 0.001 ? -dy / len : 0;
    const ny = len > 0.001 ? dx / len : 1;
    // Tick half-length in percentage
    const tickLen = 2.0;

    return (
      <div className="annotation-item absolute inset-0 pointer-events-none z-20">
        {/* SVG Dimension Line with End Notches */}
        <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
          <defs>
            <marker
              id={`arrow-start-${annotation.id}`}
              markerWidth="6"
              markerHeight="6"
              refX="1"
              refY="3"
              orient="auto"
            >
              <path d="M5,1 L1,3 L5,5" fill="none" stroke={lineColor} strokeWidth="1.5" />
            </marker>
            <marker
              id={`arrow-end-${annotation.id}`}
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="3"
              orient="auto"
            >
              <path d="M1,1 L5,3 L1,5" fill="none" stroke={lineColor} strokeWidth="1.5" />
            </marker>
          </defs>

          {/* End tick / witness line at Point A (perpendicular to dimension line) */}
          <line
            x1={`${x - nx * tickLen}%`}
            y1={`${y - ny * tickLen}%`}
            x2={`${x + nx * tickLen}%`}
            y2={`${y + ny * tickLen}%`}
            stroke={lineColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* End tick / witness line at Point B (perpendicular to dimension line) */}
          <line
            x1={`${x2 - nx * tickLen}%`}
            y1={`${y2 - ny * tickLen}%`}
            x2={`${x2 + nx * tickLen}%`}
            y2={`${y2 + ny * tickLen}%`}
            stroke={lineColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Main dimension line between points */}
          <line
            x1={`${x}%`}
            y1={`${y}%`}
            x2={`${x2}%`}
            y2={`${y2}%`}
            stroke={lineColor}
            strokeWidth="2"
            markerStart={`url(#arrow-start-${annotation.id})`}
            markerEnd={`url(#arrow-end-${annotation.id})`}
          />

          {/* Transparent wide hitbox along dimension line for easy whole-ruler dragging */}
          <line
            x1={`${x}%`}
            y1={`${y}%`}
            x2={`${x2}%`}
            y2={`${y2}%`}
            stroke="transparent"
            strokeWidth="24"
            className={`pointer-events-auto ${isEditMode ? 'cursor-move' : 'cursor-pointer'}`}
            onMouseDown={(e) => handleStartDrag(e, 'both')}
            onTouchStart={(e) => handleStartDrag(e, 'both')}
            onClick={handleClick}
          />
        </svg>

        {/* Central Architectural Measurement Badge */}
        <div
          className={`absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto select-none transition-transform hover:scale-105 ${
            isEditMode ? 'cursor-move' : 'cursor-pointer'
          }`}
          style={{
            left: `${midX}%`,
            top: `${midY}%`,
          }}
          onClick={handleClick}
          onMouseDown={(e) => handleStartDrag(e, 'both')}
          onTouchStart={(e) => handleStartDrag(e, 'both')}
          title={isEditMode ? 'Зажмите, чтобы переместить всю размерную линию' : undefined}
        >
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-xl font-bold text-xs tracking-wide border backdrop-blur-md transition-all ${
              isSelected ? 'ring-4 ring-indigo-400 ring-offset-2' : ''
            }`}
            style={{
              backgroundColor: bg,
              color: textCol,
              borderColor: 'rgba(255, 255, 255, 0.4)',
            }}
          >
            <Ruler className="w-3.5 h-3.5 opacity-90" />
            {content.title && <span className="opacity-80 font-normal">{content.title}:</span>}
            <span className="font-mono text-sm tracking-tight">
              {content.value || '2.40'} {content.unit || 'м'}
            </span>
          </div>
        </div>

        {/* Edit mode: Draggable Endpoints A and B with letter tags */}
        {isEditMode && (
          <>
            {/* Point A Handle */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-2 border-indigo-600 shadow-2xl cursor-grab active:cursor-grabbing pointer-events-auto hover:scale-125 transition-transform flex items-center justify-center group z-30"
              style={{ left: `${x}%`, top: `${y}%` }}
              onMouseDown={(e) => handleStartDrag(e, 'p1')}
              onTouchStart={(e) => handleStartDrag(e, 'p1')}
              title="Точка А: Перетащите для изменения начальной точки"
            >
              <div className="w-2 h-2 rounded-full bg-indigo-600 pointer-events-none" />
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-900/90 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow">
                А
              </span>
            </div>

            {/* Point B Handle */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-2 border-indigo-600 shadow-2xl cursor-grab active:cursor-grabbing pointer-events-auto hover:scale-125 transition-transform flex items-center justify-center group z-30"
              style={{ left: `${x2}%`, top: `${y2}%` }}
              onMouseDown={(e) => handleStartDrag(e, 'p2')}
              onTouchStart={(e) => handleStartDrag(e, 'p2')}
              title="Точка Б: Перетащите для изменения конечной точки"
            >
              <div className="w-2 h-2 rounded-full bg-indigo-600 pointer-events-none" />
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-900/90 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow">
                Б
              </span>
            </div>
          </>
        )}
      </div>
    );
  }

  /* -------------------------------------------------------------
   * 2. CALLOUT (ARCHITECTURAL LEADER LINE & CARD)
   * ------------------------------------------------------------- */
  if (type === 'callout') {
    return (
      <div
        className="annotation-item absolute pointer-events-auto select-none z-30"
        style={{ left: `${x}%`, top: `${y}%` }}
        onClick={handleClick}
      >
        {/* Anchor Beacon */}
        <div
          className="relative -translate-x-1/2 -translate-y-1/2 group"
          style={{ cursor: isEditMode ? 'move' : 'pointer' }}
          onMouseDown={(e) => handleStartDrag(e, 'p1')}
          onTouchStart={(e) => handleStartDrag(e, 'p1')}
        >
          <div className="absolute inset-0 rounded-full animate-ping opacity-60" style={{ backgroundColor: bg }} />
          <div
            className={`relative w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-transform group-hover:scale-110 ${
              isSelected ? 'ring-4 ring-indigo-400 ring-offset-2' : ''
            }`}
            style={{ backgroundColor: bg, color: textCol }}
          >
            <Info className="w-4 h-4" />
          </div>

          {/* Floating Card */}
          <div
            className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-72 rounded-2xl bg-slate-900/95 text-white p-4 shadow-2xl backdrop-blur-md border border-slate-700 transition-all ${
              isOpen || isSelected
                ? 'opacity-100 scale-100 pointer-events-auto'
                : 'opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: bg }} />
              <h4 className="font-bold text-xs text-indigo-300 tracking-wide uppercase">
                {content.title || 'Выноска'}
              </h4>
            </div>
            {content.text && <p className="text-xs text-slate-200 leading-relaxed">{content.text}</p>}
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------
   * 3. LABEL (CLEAN FLOATING TAG)
   * ------------------------------------------------------------- */
  if (type === 'label') {
    return (
      <div
        className="annotation-item absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto select-none z-20"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          cursor: isEditMode ? 'move' : 'pointer',
        }}
        onClick={handleClick}
        onMouseDown={(e) => handleStartDrag(e, 'p1')}
        onTouchStart={(e) => handleStartDrag(e, 'p1')}
        title={isEditMode ? 'Зажмите для перемещения метки' : undefined}
      >
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl shadow-lg border font-semibold text-xs transition-all hover:scale-105 ${
            isSelected ? 'ring-4 ring-indigo-400 ring-offset-2' : ''
          }`}
          style={{
            backgroundColor: bg,
            color: textCol,
            borderColor: 'rgba(255, 255, 255, 0.3)',
          }}
        >
          <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
          <span>{content.title || 'Метка'}</span>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------
   * 4. MARKER (PULSING FOCAL POINT)
   * ------------------------------------------------------------- */
  return (
    <div
      className="annotation-item absolute pointer-events-auto select-none z-20"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        cursor: isEditMode ? 'move' : 'pointer',
      }}
      onClick={handleClick}
      onMouseDown={(e) => handleStartDrag(e, 'p1')}
      onTouchStart={(e) => handleStartDrag(e, 'p1')}
      title={isEditMode ? 'Зажмите для перемещения маркера' : undefined}
    >
      <div className="relative -translate-x-1/2 -translate-y-1/2 group">
        <div className="absolute inset-0 rounded-full animate-ping opacity-50" style={{ backgroundColor: bg }} />
        <div
          className={`relative w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-transform group-hover:scale-110 ${
            isSelected ? 'ring-4 ring-indigo-400 ring-offset-2' : ''
          }`}
          style={{ backgroundColor: bg, color: textCol }}
        >
          <div className="w-2 h-2 rounded-full bg-white" />
        </div>

        {(content.title || content.text) && (
          <div
            className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-60 rounded-xl bg-slate-900/95 text-white p-3 shadow-2xl backdrop-blur-md border border-slate-700 transition-all ${
              isOpen || isSelected
                ? 'opacity-100 scale-100 pointer-events-auto'
                : 'opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {content.title && <p className="font-bold text-xs mb-1">{content.title}</p>}
            {content.text && <p className="text-xs text-slate-300 leading-relaxed">{content.text}</p>}
          </div>
        )}
      </div>
    </div>
  );
};
