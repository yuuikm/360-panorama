import React, { useEffect, useRef, useState } from 'react';
import { Annotation } from '../../shared/types';
import { PannellumViewer, PannellumConfig } from '../../shared/types/pannellum';
import { createHotspotElement } from '../annotations/annotationTemplates';
import { Loader2 } from 'lucide-react';

interface PannellumViewerProps {
  imageUrl: string;
  annotations?: Annotation[];
  isEditMode?: boolean;
  onCoordsClick?: (pitch: number, yaw: number) => void;
  onAnnotationSelect?: (annotation: Annotation) => void;
  selectedAnnotationId?: number | null;
  className?: string;
}

export const PanoramaViewer: React.FC<PannellumViewerProps> = ({
  imageUrl,
  annotations = [],
  isEditMode = false,
  onCoordsClick,
  onAnnotationSelect,
  selectedAnnotationId,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<PannellumViewer | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Initialize or re-initialize viewer when imageUrl changes
  useEffect(() => {
    if (!containerRef.current) return;

    setIsLoaded(false);
    setLoadError(null);

    // Destroy existing viewer
    if (viewerRef.current) {
      try {
        viewerRef.current.destroy();
      } catch {
        // ignore
      }
      viewerRef.current = null;
    }

    if (!window.pannellum) {
      setLoadError('Библиотека Pannellum не загружена. Проверьте подключение к интернету.');
      return;
    }

    const config: PannellumConfig = {
      type: 'equirectangular',
      panorama: imageUrl,
      autoLoad: true,
      showZoomCtrl: true,
      showFullscreenCtrl: true,
      mouseZoom: true,
      doubleClickZoom: true,
      draggable: true,
      hfov: 100,
      minHfov: 50,
      maxHfov: 120,
    };

    try {
      const viewer = window.pannellum.viewer(containerRef.current, config);
      viewerRef.current = viewer;

      viewer.on('load', () => {
        setIsLoaded(true);
      });

      viewer.on('error', (err: any) => {
        console.error('Pannellum error:', err);
        setLoadError('Не удалось загрузить 360-изображение. Проверьте доступность файла.');
      });
    } catch (e: any) {
      console.error('Pannellum init error:', e);
      setLoadError('Ошибка инициализации 360 просмотрщика');
    }

    return () => {
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy();
        } catch {
          // ignore
        }
        viewerRef.current = null;
      }
    };
  }, [imageUrl]);

  // Click handler on container to capture coordinates in edit mode
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isEditMode || !onCoordsClick) return;

    const handleClick = (e: MouseEvent) => {
      // If clicked on an existing hotspot, do not trigger coordinate click
      const target = e.target as HTMLElement;
      if (target.closest('.custom-panorama-hotspot') || target.closest('.pnlm-control')) {
        return;
      }

      const viewer = viewerRef.current;
      if (viewer && typeof viewer.mouseEventToCoords === 'function') {
        const [pitch, yaw] = viewer.mouseEventToCoords(e);
        if (!isNaN(pitch) && !isNaN(yaw)) {
          onCoordsClick(pitch, yaw);
        }
      }
    };

    container.addEventListener('click', handleClick);
    return () => {
      container.removeEventListener('click', handleClick);
    };
  }, [isEditMode, onCoordsClick]);

  // Sync annotations hotspots into viewer
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !isLoaded) return;

    // Remove existing hotspots
    const existingElements = containerRef.current?.querySelectorAll('.custom-panorama-hotspot');
    existingElements?.forEach((el) => {
      const pId = el.getAttribute('data-annotation-id');
      if (pId) viewer.removeHotSpot(pId);
    });

    // Add updated hotspots
    annotations.forEach((annotation) => {
      try {
        viewer.addHotSpot({
          id: annotation.id.toString(),
          pitch: annotation.position.pitch ?? 0,
          yaw: annotation.position.yaw ?? 0,
          createTooltipFunc: (hotspotDiv: HTMLElement) => {
            hotspotDiv.setAttribute('data-annotation-id', annotation.id.toString());
            createHotspotElement(hotspotDiv, annotation, onAnnotationSelect);

            if (selectedAnnotationId === annotation.id) {
              hotspotDiv.classList.add('ring-4', 'ring-indigo-400', 'ring-offset-2', 'rounded-full');
            }
          },
        });
      } catch (err) {
        console.warn('Failed to add hotspot:', err);
      }
    });
  }, [annotations, isLoaded, selectedAnnotationId, onAnnotationSelect]);

  return (
    <div className={`relative overflow-hidden w-full h-full bg-slate-950 ${className}`}>
      {/* 360 Viewport Container */}
      <div ref={containerRef} className="w-full h-full select-none" />

      {/* Loading Overlay */}
      {!isLoaded && !loadError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm text-white">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-3" />
          <p className="text-sm font-medium">Загрузка 360° панорамы...</p>
        </div>
      )}

      {/* Error Overlay */}
      {loadError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/90 text-white p-6 text-center">
          <p className="text-base font-semibold text-red-400 mb-2">{loadError}</p>
          <p className="text-xs text-slate-400 max-w-sm">
            Убедитесь, что сервер раздачи статических файлов доступен и изображение имеет правильный формат.
          </p>
        </div>
      )}
    </div>
  );
};

