import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getObjectApi } from '../../shared/api/objects';
import { getPanoramaApi, updatePanoramaApi } from '../../shared/api/panoramas';
import {
  createAnnotationApi,
  updateAnnotationApi,
  deleteAnnotationApi,
} from '../../shared/api/annotations';
import { Panorama, PanoramaObject, Annotation } from '../../shared/types';
import { FlatPanoramaViewer } from '../../features/panoramas/FlatPanoramaViewer';
import { PanoramaViewer } from '../../features/panoramas/PannellumViewer';
import { AnnotationSidebar } from '../../features/annotations/AnnotationSidebar';
import { getTemplate } from '../../features/annotations/annotationTemplates';
import { ArrowLeft, Eye, EyeOff, Loader2, Compass, Image as ImageIcon } from 'lucide-react';

export const PanoramaEditorPage: React.FC = () => {
  const { id, panoramaId } = useParams<{ id: string; panoramaId: string }>();
  const objectId = Number(id);
  const currentPanoramaId = Number(panoramaId);
  const navigate = useNavigate();

  const [object, setObject] = useState<PanoramaObject | null>(null);
  const [panorama, setPanorama] = useState<Panorama | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const [activeTemplateKey, setActiveTemplateKey] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load object and current panorama
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [objRes, panRes] = await Promise.all([
          getObjectApi(objectId),
          getPanoramaApi(currentPanoramaId),
        ]);
        setObject(objRes.data);
        setPanorama(panRes.data);
        setAnnotations(panRes.data.annotations || []);
      } catch (err) {
        console.error('Failed to load panorama:', err);
        navigate(`/admin/objects/${objectId}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [objectId, currentPanoramaId]);

  // Toggle Viewer Type (360 vs Flat)
  const handleToggleViewerType = async () => {
    if (!panorama) return;
    const newType = panorama.viewer_type === '360' ? 'flat' : '360';
    setPanorama((prev) => (prev ? { ...prev, viewer_type: newType } : null));

    try {
      await updatePanoramaApi(currentPanoramaId, { viewer_type: newType });
    } catch (err) {
      console.error('Failed to save viewer type:', err);
    }
  };

  // Place new annotation
  const handleCoordsClick = async (x: number, y: number, x2?: number, y2?: number) => {
    if (!activeTemplateKey || isPreviewMode) return;

    const template = getTemplate(activeTemplateKey);

    const position: Record<string, number> = {
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
    };

    // If measurement, assign second point (either from 2nd click or fallback offset)
    if (template.type === 'measurement') {
      position.x2 = x2 !== undefined ? Number(x2.toFixed(2)) : Number(Math.min(100, x + 15).toFixed(2));
      position.y2 = y2 !== undefined ? Number(y2.toFixed(2)) : Number(y.toFixed(2));
    }

    try {
      setIsSaving(true);
      const res = await createAnnotationApi(currentPanoramaId, {
        type: template.type,
        template_key: template.key,
        position,
        content: template.defaultContent,
        style: template.defaultStyle,
      });

      const newAnnotation = res.data;
      setAnnotations((prev) => [...prev, newAnnotation]);
      setSelectedAnnotation(newAnnotation);
      setActiveTemplateKey(null); // finished placing
    } catch (err: any) {
      alert(err?.message || 'Ошибка создания элемента');
    } finally {
      setIsSaving(false);
    }
  };

  // Update annotation properties
  const handleUpdateAnnotation = async (updatedFields: Partial<Annotation>) => {
    if (!selectedAnnotation) return;

    const updatedAnnotation = { ...selectedAnnotation, ...updatedFields };
    setSelectedAnnotation(updatedAnnotation);
    setAnnotations((prev) =>
      prev.map((a) => (a.id === selectedAnnotation.id ? updatedAnnotation : a))
    );

    try {
      setIsSaving(true);
      await updateAnnotationApi(selectedAnnotation.id, updatedFields);
    } catch (err: any) {
      console.error('Update failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Dragging measurement endpoints or moving position
  const handleUpdatePosition = async (
    annotationId: number,
    newPos: { x: number; y: number; x2?: number; y2?: number },
    isFinal: boolean = false
  ) => {
    let mergedPos = newPos;

    // 60fps local state update with safe merge
    setAnnotations((prev) =>
      prev.map((a) => {
        if (a.id === annotationId) {
          mergedPos = { ...a.position, ...newPos };
          return { ...a, position: mergedPos };
        }
        return a;
      })
    );

    if (selectedAnnotation?.id === annotationId) {
      setSelectedAnnotation((prev) =>
        prev ? { ...prev, position: { ...prev.position, ...newPos } } : null
      );
    }

    // Persist to server only when user releases mouse
    if (isFinal) {
      try {
        await updateAnnotationApi(annotationId, { position: mergedPos });
      } catch (err) {
        console.error('Failed to save position:', err);
      }
    }
  };

  // Delete annotation
  const handleDeleteAnnotation = async (annotationId: number) => {
    try {
      setIsSaving(true);
      await deleteAnnotationApi(annotationId);
      setAnnotations((prev) => prev.filter((a) => a.id !== annotationId));
      if (selectedAnnotation?.id === annotationId) {
        setSelectedAnnotation(null);
      }
    } catch (err: any) {
      alert(err?.message || 'Ошибка удаления');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !panorama || !object) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
      </div>
    );
  }

  const is360Mode = panorama.viewer_type === '360';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white">
      {/* Top Bar */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            to={`/admin/objects/${objectId}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Назад</span>
          </Link>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          {/* Room Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">Помещение:</span>
            <select
              value={currentPanoramaId}
              onChange={(e) =>
                navigate(`/admin/objects/${objectId}/panoramas/${e.target.value}`)
              }
              className="bg-slate-800 text-white text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:border-indigo-500"
            >
              {object.panoramas?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden md:block" />

          {/* Mode Switcher (360 Sphere vs Flat / Fixed Panorama) */}
          <button
            type="button"
            onClick={handleToggleViewerType}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all shadow-sm bg-slate-800/90 hover:bg-slate-700 border-slate-600 text-slate-200"
            title="Нажмите для переключения режима отображения на сайте"
          >
            {is360Mode ? (
              <>
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                <span>Режим: <strong>360° Сфера</strong></span>
              </>
            ) : (
              <>
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Режим: <strong>Фиксированная</strong></span>
              </>
            )}
            <span className="text-[10px] text-slate-400 font-normal underline ml-1">изменить</span>
          </button>
        </div>

        {/* Right Actions: High-Contrast "Предпросмотр" Button */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setIsPreviewMode(!isPreviewMode);
              if (!isPreviewMode) {
                setSelectedAnnotation(null);
                setActiveTemplateKey(null);
              }
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md border ${
              isPreviewMode
                ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500 ring-2 ring-emerald-400/40'
                : 'bg-white text-slate-900 border-white hover:bg-slate-100 hover:text-indigo-600'
            }`}
          >
            {isPreviewMode ? (
              <>
                <EyeOff className="w-4 h-4 text-white" />
                <span>Режим редактора</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-slate-900" />
                <span>Предпросмотр</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace (Viewer + Sidebar) */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Dynamic Viewport (Flat or 360) */}
        <div className="flex-1 h-full relative">
          {is360Mode ? (
            <PanoramaViewer
              imageUrl={panorama.image_url}
              annotations={annotations}
              isEditMode={!isPreviewMode && !!activeTemplateKey}
              onCoordsClick={(pitch, yaw) => handleCoordsClick(yaw, pitch)}
              onAnnotationSelect={(ann) => {
                if (!isPreviewMode) setSelectedAnnotation(ann);
              }}
              selectedAnnotationId={selectedAnnotation?.id}
            />
          ) : (
            <FlatPanoramaViewer
              imageUrl={panorama.image_url}
              annotations={annotations}
              isEditMode={!isPreviewMode}
              activeTemplateKey={activeTemplateKey}
              onCoordsClick={handleCoordsClick}
              onAnnotationSelect={(ann) => {
                if (!isPreviewMode) setSelectedAnnotation(ann);
              }}
              onUpdateAnnotationPosition={handleUpdatePosition}
              selectedAnnotationId={selectedAnnotation?.id}
            />
          )}
        </div>

        {/* Properties / Annotation Sidebar (Hidden in Preview Mode) */}
        {!isPreviewMode && (
          <AnnotationSidebar
            annotations={annotations}
            selectedAnnotation={selectedAnnotation}
            onSelectAnnotation={setSelectedAnnotation}
            activeTemplateKey={activeTemplateKey}
            onSelectTemplate={setActiveTemplateKey}
            onUpdateAnnotation={handleUpdateAnnotation}
            onDeleteAnnotation={handleDeleteAnnotation}
            isSaving={isSaving}
          />
        )}
      </div>
    </div>
  );
};
