import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Annotation } from '../../shared/types';
import { AnnotationItem } from '../annotations/AnnotationItem';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, Loader2, Ruler } from 'lucide-react';

interface FlatPanoramaViewerProps {
  imageUrl: string;
  annotations?: Annotation[];
  isEditMode?: boolean;
  activeTemplateKey?: string | null;
  onCoordsClick?: (x: number, y: number, x2?: number, y2?: number) => void;
  onAnnotationSelect?: (annotation: Annotation) => void;
  onUpdateAnnotationPosition?: (
    id: number,
    pos: { x: number; y: number; x2?: number; y2?: number },
    isFinal?: boolean
  ) => void;
  selectedAnnotationId?: number | null;
  className?: string;
}

export const FlatPanoramaViewer: React.FC<FlatPanoramaViewerProps> = ({
  imageUrl,
  annotations = [],
  isEditMode = false,
  activeTemplateKey,
  onCoordsClick,
  onAnnotationSelect,
  onUpdateAnnotationPosition,
  selectedAnnotationId,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Two-click measurement placement state
  const [measurementPointA, setMeasurementPointA] = useState<{ x: number; y: number } | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  // Clamp horizontal panning to ensure the user can pan across the whole panorama without losing it
  const getClampedX = useCallback(
    (targetX: number, customScale = scale) => {
      if (!containerRef.current || !imageRef.current) return targetX;
      const viewportW = containerRef.current.clientWidth;
      const naturalW = imageRef.current.clientWidth;
      const currentW = naturalW * customScale;

      // Allow panning edge-to-edge plus generous margin
      const maxPan = Math.max(0, (currentW - viewportW) / 2) + Math.min(300, viewportW * 0.35);
      return Math.max(-maxPan, Math.min(maxPan, targetX));
    },
    [scale]
  );

  // Clear measurement step if template changes or edit mode exits
  useEffect(() => {
    if (activeTemplateKey !== 'measurement') {
      setMeasurementPointA(null);
      setCursorPos(null);
    }
  }, [activeTemplateKey, isEditMode]);

  // Cancel measurement on Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMeasurementPointA(null);
        setCursorPos(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Reset viewport when imageUrl changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsImageLoaded(false);
    setHasError(false);
    setMeasurementPointA(null);
    setCursorPos(null);
  }, [imageUrl]);

  // Mouse wheel zoom and trackpad horizontal panning
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      // Horizontal swipe / scroll
      const rawX = position.x - e.deltaX;
      setPosition({
        x: getClampedX(rawX),
        y: 0,
      });
    } else {
      // Zoom (minimum 1.0 = strictly full height, up to 5x)
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
      const newScale = Math.min(5, Math.max(1, scale * zoomFactor));
      setScale(newScale);
      setPosition((prev) => ({
        x: getClampedX(prev.x, newScale),
        y: 0,
      }));
    }
  };

  // Mouse drag pan & placement click handler
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Do not pan canvas if clicking handles, buttons, annotations or badges
    if (
      target.closest('button') ||
      target.closest('.cursor-grab') ||
      target.closest('.cursor-move') ||
      target.closest('.annotation-item') ||
      target.closest('svg line')
    ) {
      return;
    }

    // Check if in edit mode and click is intended to place an annotation
    if (isEditMode && onCoordsClick && activeTemplateKey) {
      const img = imageRef.current;
      if (img) {
        const rect = img.getBoundingClientRect();
        const clickX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const clickY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

        if (activeTemplateKey === 'measurement') {
          if (!measurementPointA) {
            // First click: Point A
            setMeasurementPointA({ x: clickX, y: clickY });
            return;
          } else {
            // Second click: Point B -> place measurement!
            onCoordsClick(measurementPointA.x, measurementPointA.y, clickX, clickY);
            setMeasurementPointA(null);
            setCursorPos(null);
            return;
          }
        } else {
          // Other templates (single click placement)
          onCoordsClick(clickX, clickY);
          return;
        }
      }
    }

    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const img = imageRef.current;

    // Track live cursor position on image for measurement preview
    if (measurementPointA && img) {
      const rect = img.getBoundingClientRect();
      const currX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const currY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      setCursorPos({ x: currX, y: currY });
    }

    if (!isDragging) return;
    const rawX = e.clientX - dragStart.x;
    setPosition({
      x: getClampedX(rawX),
      y: 0,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag & pinch-to-zoom
  const touchStartRef = useRef<{ dist: number; x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('.cursor-grab') ||
      target.closest('.cursor-move') ||
      target.closest('.annotation-item') ||
      target.closest('svg line')
    ) {
      return;
    }

    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: 0,
      });
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartRef.current = { dist, x: position.x, y: 0 };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const rawX = e.touches[0].clientX - dragStart.x;
      setPosition({
        x: getClampedX(rawX),
        y: 0,
      });
    } else if (e.touches.length === 2 && touchStartRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartRef.current.dist;
      const newScale = Math.min(5, Math.max(1, scale * factor));
      setScale(newScale);
      touchStartRef.current.dist = dist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartRef.current = null;
  };

  // Zoom controls (min scale 1.0 = full height fixed, max scale 5.0)
  const handleZoomIn = () => {
    const newScale = Math.min(5, scale * 1.25);
    setScale(newScale);
    setPosition((prev) => ({ x: getClampedX(prev.x, newScale), y: 0 }));
  };

  const handleZoomOut = () => {
    const newScale = Math.max(1, scale / 1.25);
    setScale(newScale);
    setPosition((prev) => ({ x: getClampedX(prev.x, newScale), y: 0 }));
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-slate-950 select-none ${className}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        cursor: isEditMode && activeTemplateKey ? 'crosshair' : isDragging ? 'grabbing' : 'grab',
      }}
    >
      {/* Loading Spinner */}
      {!isImageLoaded && !hasError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950 text-white">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
          <p className="text-xs text-slate-400">Загрузка панорамы в оригинальном качестве...</p>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center">
          <p className="text-sm font-semibold text-red-400 mb-1">Не удалось загрузить изображение</p>
          <p className="text-xs text-slate-500 max-w-sm">
            Проверьте доступность URL: {imageUrl}
          </p>
        </div>
      )}

      {/* Transformed Canvas Container: fixed full height, horizontal pan & zoom */}
      <div
        className={`absolute inset-0 flex items-center justify-center ${
          isDragging ? 'transition-none' : 'transition-transform duration-75 ease-out'
        }`}
        style={{
          transform: `translate(${position.x}px, 0px) scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <div className="panorama-image-container relative h-full inline-block max-w-none shrink-0 shadow-2xl">
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Панорама"
            draggable={false}
            onLoad={() => setIsImageLoaded(true)}
            onError={() => setHasError(true)}
            className="h-full w-auto max-w-none block pointer-events-none select-none"
          />

          {/* Live 2-click Measurement Preview between Point A and Cursor */}
          {measurementPointA && cursorPos && (
            <div className="absolute inset-0 pointer-events-none z-30">
              <svg className="absolute inset-0 w-full h-full overflow-visible">
                {/* Point A notch */}
                <line
                  x1={`${measurementPointA.x}%`}
                  y1={`${measurementPointA.y - 2.5}%`}
                  x2={`${measurementPointA.x}%`}
                  y2={`${measurementPointA.y + 2.5}%`}
                  stroke="#4f46e5"
                  strokeWidth="3"
                />
                {/* Point B notch */}
                <line
                  x1={`${cursorPos.x}%`}
                  y1={`${cursorPos.y - 2.5}%`}
                  x2={`${cursorPos.x}%`}
                  y2={`${cursorPos.y + 2.5}%`}
                  stroke="#4f46e5"
                  strokeWidth="3"
                />
                {/* Dimension line */}
                <line
                  x1={`${measurementPointA.x}%`}
                  y1={`${measurementPointA.y}%`}
                  x2={`${cursorPos.x}%`}
                  y2={`${cursorPos.y}%`}
                  stroke="#6366f1"
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                />
              </svg>
              {/* Point A indicator */}
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white shadow-lg"
                style={{ left: `${measurementPointA.x}%`, top: `${measurementPointA.y}%` }}
              />
              {/* Midpoint badge indicator */}
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full bg-indigo-600 text-white font-bold text-xs shadow-xl border border-white/40 flex items-center gap-1"
                style={{
                  left: `${(measurementPointA.x + cursorPos.x) / 2}%`,
                  top: `${(measurementPointA.y + cursorPos.y) / 2}%`,
                }}
              >
                <Ruler className="w-3 h-3" />
                <span>Кликните Точку Б</span>
              </div>
            </div>
          )}

          {/* Annotations Overlay Layer */}
          {isImageLoaded && (
            <div className="absolute inset-0 pointer-events-auto">
              {annotations.map((ann) => (
                <AnnotationItem
                  key={ann.id}
                  annotation={ann}
                  isSelected={selectedAnnotationId === ann.id}
                  isEditMode={isEditMode}
                  onSelect={onAnnotationSelect}
                  onPositionChange={(newPos, isFinal) => {
                    if (onUpdateAnnotationPosition) {
                      onUpdateAnnotationPosition(ann.id, newPos, isFinal);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating HUD Controls */}
      <div className="absolute bottom-5 right-5 z-40 flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700/80 shadow-2xl">
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          title="Приблизить"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          title="Отдалить"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleResetZoom}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          title="Сбросить масштаб (100% высоты)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-700 mx-0.5" />
        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          title={isFullscreen ? 'Выйти из полноэкранного режима' : 'На весь экран'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Dynamic Hint for 2-step measurement or dragging */}
      <div className="absolute top-4 left-4 z-30 pointer-events-none">
        {measurementPointA ? (
          <span className="px-3.5 py-1.5 rounded-full bg-indigo-600 text-white font-semibold text-xs shadow-lg flex items-center gap-2 animate-bounce pointer-events-auto">
            <Ruler className="w-3.5 h-3.5" />
            <span>Шаг 2 из 2: Кликните в конечную точку (Точка Б) для завершения линейки</span>
            <button
              type="button"
              onClick={() => {
                setMeasurementPointA(null);
                setCursorPos(null);
              }}
              className="ml-2 px-2 py-0.5 rounded bg-indigo-800 hover:bg-indigo-900 text-[10px] uppercase font-bold text-indigo-100 transition-colors"
            >
              Отмена
            </button>
          </span>
        ) : activeTemplateKey === 'measurement' ? (
          <span className="px-3.5 py-1.5 rounded-full bg-indigo-600 text-white font-semibold text-xs shadow-lg flex items-center gap-2">
            <Ruler className="w-3.5 h-3.5" />
            <span>Шаг 1 из 2: Кликните на панораму, чтобы задать Точку А (начало линейки)</span>
          </span>
        ) : isEditMode && activeTemplateKey ? (
          <span className="px-3.5 py-1.5 rounded-full bg-indigo-600 text-white font-semibold text-xs shadow-lg">
            Кликните на изображение для размещения элемента
          </span>
        ) : (
          <span className="px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-sm border border-slate-700 text-[11px] text-slate-300 shadow hidden sm:inline-block">
            {isEditMode ? 'Перетаскивайте элементы мышью' : 'Перемещение влево-вправо • Колёсико для масштаба'}
          </span>
        )}
      </div>
    </div>
  );
};
