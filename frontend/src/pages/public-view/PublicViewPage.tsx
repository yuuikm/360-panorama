import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicObjectApi } from '../../shared/api/public';
import { PublicObject, PublicPanorama, Annotation } from '../../shared/types';
import { FlatPanoramaViewer } from '../../features/panoramas/FlatPanoramaViewer';
import { PanoramaViewer } from '../../features/panoramas/PannellumViewer';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Loader2,
  AlertCircle,
  Home,
  Compass,
} from 'lucide-react';

export const PublicViewPage: React.FC = () => {
  const { publicToken } = useParams<{ publicToken: string }>();

  const [object, setObject] = useState<PublicObject | null>(null);
  const [currentPanoramaIndex, setCurrentPanoramaIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const fetchPublicData = async () => {
      if (!publicToken) {
        setError('Не указан ключ доступа');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const res = await getPublicObjectApi(publicToken);
        setObject(res.data);
      } catch (err: any) {
        console.error('Failed to load public panorama:', err);
        setError('Объект не найден или больше недоступен');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicData();
  }, [publicToken]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-3" />
        <p className="text-sm font-medium text-slate-300">Загрузка виртуального пространства...</p>
      </div>
    );
  }

  if (error || !object || !object.panoramas || object.panoramas.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 text-indigo-400 flex items-center justify-center mb-4 border border-slate-700">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">Объект недоступен</h2>
        <p className="text-sm text-slate-400 max-w-sm mb-6">
          {error || 'У этого объекта пока нет готовых панорам для публичного просмотра.'}
        </p>
      </div>
    );
  }

  const currentPanorama: PublicPanorama = object.panoramas[currentPanoramaIndex] || object.panoramas[0];
  const hasMultiplePanoramas = object.panoramas.length > 1;
  const is360Mode = currentPanorama.viewer_type === '360';

  // Convert PublicAnnotation to Annotation type for Viewer
  const mappedAnnotations: Annotation[] = (currentPanorama.annotations || []).map((pa) => ({
    ...pa,
    panorama_id: currentPanorama.id,
  }));

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white overflow-hidden select-none">
      {/* Top Floating Glass Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 p-4 pointer-events-none flex items-center justify-between">
        {/* Object & Room title badge */}
        <div className="pointer-events-auto bg-slate-900/85 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-700/80 shadow-2xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
            {is360Mode ? <Compass className="w-4 h-4" /> : <Home className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <h1 className="text-[11px] text-indigo-300 font-semibold uppercase tracking-wider line-clamp-1">
              {object.title}
            </h1>
            <p className="text-sm font-bold text-white line-clamp-1">
              {currentPanorama.title}
            </p>
          </div>
        </div>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="pointer-events-auto w-10 h-10 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-slate-700/80 text-white flex items-center justify-center shadow-xl hover:bg-slate-800 transition-colors"
          title={isFullscreen ? 'Выйти из полноэкранного режима' : 'На весь экран'}
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Main Dynamic Panorama Viewer (360 Sphere or Flat Original) */}
      <div className="flex-1 w-full h-full relative">
        {is360Mode ? (
          <PanoramaViewer
            imageUrl={currentPanorama.image_url}
            annotations={mappedAnnotations}
            isEditMode={false}
          />
        ) : (
          <FlatPanoramaViewer
            imageUrl={currentPanorama.image_url}
            annotations={mappedAnnotations}
            isEditMode={false}
          />
        )}
      </div>

      {/* Bottom Floating Room Selector (If > 1 room) */}
      {hasMultiplePanoramas && (
        <div className="absolute bottom-6 left-0 right-0 z-30 flex items-center justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 shadow-2xl flex items-center gap-1 max-w-full overflow-x-auto">
            {/* Prev Room Button */}
            <button
              onClick={() =>
                setCurrentPanoramaIndex((prev) =>
                  prev > 0 ? prev - 1 : object.panoramas.length - 1
                )
              }
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors shrink-0"
              title="Предыдущее помещение"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Room Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {object.panoramas.map((p, idx) => {
                const isActive = idx === currentPanoramaIndex;
                return (
                  <button
                    key={p.id}
                    onClick={() => setCurrentPanoramaIndex(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    {p.title}
                  </button>
                );
              })}
            </div>

            {/* Next Room Button */}
            <button
              onClick={() =>
                setCurrentPanoramaIndex((prev) =>
                  prev < object.panoramas.length - 1 ? prev + 1 : 0
                )
              }
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors shrink-0"
              title="Следующее помещение"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
