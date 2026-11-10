import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getObjectApi,
  updateObjectApi,
  publishObjectApi,
  unpublishObjectApi,
  regenerateTokenApi,
} from '../../shared/api/objects';
import {
  deletePanoramaApi,
  reorderPanoramasApi,
  updatePanoramaApi,
} from '../../shared/api/panoramas';
import { Panorama, PanoramaObject } from '../../shared/types';
import { Button } from '../../shared/components/Button';
import { Badge } from '../../shared/components/Badge';
import { Card } from '../../shared/components/Card';
import { Input } from '../../shared/components/Input';
import { Textarea } from '../../shared/components/Textarea';
import { Modal } from '../../shared/components/Modal';
import { UploadPanoramaModal } from '../../features/panoramas/UploadPanoramaModal';
import { QrModal } from '../../features/objects/QrModal';
import {
  ArrowLeft,
  Plus,
  QrCode,
  Globe,
  RotateCw,
  Trash2,
  Edit2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Loader2,
  Compass,
  Image as ImageIcon,
} from 'lucide-react';

export const ObjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const objectId = Number(id);
  const navigate = useNavigate();

  const [object, setObject] = useState<PanoramaObject | null>(null);
  const [panoramas, setPanoramas] = useState<Panorama[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit object details modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Upload modal
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // QR Modal
  const [qrModal, setQrModal] = useState<{
    isOpen: boolean;
    publicUrl: string;
    qrSvg: string;
    qrDataUri: string;
  }>({
    isOpen: false,
    publicUrl: '',
    qrSvg: '',
    qrDataUri: '',
  });

  const [isPublishing, setIsPublishing] = useState(false);

  const fetchObject = async () => {
    try {
      setIsLoading(true);
      const res = await getObjectApi(objectId);
      setObject(res.data);
      setPanoramas(res.data.panoramas || []);
      setEditTitle(res.data.title);
      setEditDesc(res.data.description || '');
    } catch (err) {
      console.error('Failed to fetch object:', err);
      navigate('/admin/objects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchObject();
  }, [objectId]);

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await updateObjectApi(objectId, {
        title: editTitle.trim(),
        description: editDesc.trim(),
      });
      setObject((prev) => (prev ? { ...prev, title: res.data.title, description: res.data.description } : null));
      setIsEditOpen(false);
    } catch (err: any) {
      alert(err?.message || 'Ошибка обновления данных');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      const res = await publishObjectApi(objectId);
      setObject((prev) => (prev ? { ...prev, status: 'published', has_token: true } : null));
      setQrModal({
        isOpen: true,
        publicUrl: res.public_url,
        qrSvg: res.qr_code_svg,
        qrDataUri: res.qr_code_data_uri,
      });
    } catch (err: any) {
      alert(err?.message || 'Ошибка при публикации');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!window.confirm('Снять объект с публикации? Публичная ссылка перестанет быть доступной для посетителей.')) {
      return;
    }
    try {
      setIsPublishing(true);
      await unpublishObjectApi(objectId);
      setObject((prev) => (prev ? { ...prev, status: 'draft' } : null));
    } catch (err: any) {
      alert(err?.message || 'Ошибка при снятии с публикации');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRegenerateToken = async () => {
    if (
      !window.confirm(
        'Внимание! При генерации нового токена старая ссылка и все ранее напечатанные QR-коды немедленно перестанут работать. Продолжить?'
      )
    ) {
      return;
    }
    try {
      setIsPublishing(true);
      const res = await regenerateTokenApi(objectId);
      setQrModal({
        isOpen: true,
        publicUrl: res.public_url,
        qrSvg: res.qr_code_svg,
        qrDataUri: res.qr_code_data_uri,
      });
    } catch (err: any) {
      alert(err?.message || 'Ошибка генерации токена');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeletePanorama = async (panoramaId: number, title: string) => {
    if (!window.confirm(`Удалить панораму «${title}»?`)) return;

    try {
      await deletePanoramaApi(panoramaId);
      setPanoramas((prev) => prev.filter((p) => p.id !== panoramaId));
    } catch (err: any) {
      alert(err?.message || 'Ошибка при удалении');
    }
  };

  const handleMovePanorama = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= panoramas.length) return;

    const newPanoramas = [...panoramas];
    const temp = newPanoramas[index];
    newPanoramas[index] = newPanoramas[targetIndex];
    newPanoramas[targetIndex] = temp;

    const orders = newPanoramas.map((p, idx) => ({ id: p.id, sort_order: idx }));
    setPanoramas(newPanoramas);

    try {
      await reorderPanoramasApi(objectId, orders);
    } catch (err: any) {
      console.error('Failed to save order:', err);
      fetchObject();
    }
  };

  const handleToggleViewerType = async (panorama: Panorama) => {
    const nextType: 'flat' | '360' = panorama.viewer_type === '360' ? 'flat' : '360';
    try {
      setPanoramas((prev) =>
        prev.map((p) => (p.id === panorama.id ? { ...p, viewer_type: nextType } : p))
      );
      await updatePanoramaApi(panorama.id, { viewer_type: nextType });
    } catch (err: any) {
      alert(err?.message || 'Ошибка смены режима');
      setPanoramas((prev) =>
        prev.map((p) => (p.id === panorama.id ? { ...p, viewer_type: panorama.viewer_type } : p))
      );
    }
  };

  if (isLoading || !object) {
    return (
      <div className="p-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
        <p className="text-sm text-slate-500 mt-3">Загрузка объекта...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back button and navigation */}
      <div className="flex items-center gap-2">
        <Link to="/admin/objects" className="text-slate-500 hover:text-slate-800 transition-colors">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Все объекты
          </Button>
        </Link>
      </div>

      {/* Object Header Card */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{object.title}</h1>
              <Badge status={object.status} />
              <button
                onClick={() => setIsEditOpen(true)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
                title="Редактировать название и описание"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600">
              {object.description || 'Описание не заполнено.'}
            </p>
            {object.published_at && (
              <p className="text-xs text-slate-400">
                Опубликовано: {new Date(object.published_at).toLocaleString('ru-RU')}
              </p>
            )}
          </div>

          {/* Action Buttons for Publishing */}
          <div className="flex flex-wrap items-center gap-2.5">
            {object.status === 'published' ? (
              <>
                <Button
                  variant="primary"
                  onClick={handlePublish}
                  isLoading={isPublishing}
                  leftIcon={<QrCode className="w-4 h-4" />}
                >
                  QR-код и ссылка
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRegenerateToken}
                  isLoading={isPublishing}
                  leftIcon={<RotateCw className="w-4 h-4" />}
                  title="Аннулировать старую ссылку и выпустить новую"
                >
                  Новый токен
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleUnpublish}
                  isLoading={isPublishing}
                >
                  Снять с публикации
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                onClick={handlePublish}
                isLoading={isPublishing}
                leftIcon={<Globe className="w-4 h-4" />}
              >
                Опубликовать объект
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Panoramas Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Панорамы помещений ({panoramas.length})
            </h2>
            <p className="text-xs text-slate-500">
              Управляйте комнатами, порядком отображения и настраивайте интерактивные аннотации
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsUploadOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Добавить панораму
          </Button>
        </div>

        {panoramas.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">В этом объекте пока нет панорам</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Загрузите 360° фотографии комнат, чтобы разместить на них выноски, размеры и маркеры.
            </p>
            <Button
              variant="primary"
              size="sm"
              className="mt-4"
              onClick={() => setIsUploadOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Загрузить первую панораму
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {panoramas.map((panorama, index) => (
              <Card
                key={panorama.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  {/* Reorder arrows */}
                  <div className="flex flex-col gap-0.5 text-slate-400">
                    <button
                      onClick={() => handleMovePanorama(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:text-slate-700 disabled:opacity-20 transition-colors"
                      title="Переместить вверх"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMovePanorama(index, 'down')}
                      disabled={index === panoramas.length - 1}
                      className="p-1 hover:text-slate-700 disabled:opacity-20 transition-colors"
                      title="Переместить вниз"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Thumbnail */}
                  <div className="w-24 h-14 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-200">
                    <img
                      src={panorama.image_url}
                      alt={panorama.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 text-base">{panorama.title}</h3>
                      <button
                        type="button"
                        onClick={() => handleToggleViewerType(panorama)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium text-[11px] border transition-all ${
                          panorama.viewer_type === '360'
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        }`}
                        title="Нажмите, чтобы переключить режим: 360° Сфера или Фиксированная"
                      >
                        {panorama.viewer_type === '360' ? (
                          <>
                            <Compass className="w-3 h-3 text-indigo-500" />
                            <span>360° Сфера</span>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-3 h-3 text-emerald-500" />
                            <span>Фиксированная</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span>Аннотаций: <strong>{panorama.annotations_count || (panorama.annotations?.length ?? 0)}</strong></span>
                      {panorama.width && panorama.height && (
                        <span>• {panorama.width}×{panorama.height} px</span>
                      )}
                      <span>• {(panorama.image_size / 1024 / 1024).toFixed(1)} МБ</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Link to={`/admin/objects/${objectId}/panoramas/${panorama.id}`}>
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Sparkles className="w-4 h-4" />}
                    >
                      Редактор аннотаций
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePanorama(panorama.id, panorama.title)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Удалить панораму"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Details Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Редактировать объект">
        <form onSubmit={handleSaveDetails} className="space-y-4">
          <Input
            label="Название объекта"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            required
          />
          <Textarea
            label="Описание"
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            rows={4}
          />
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" variant="primary" isLoading={isSaving}>
              Сохранить
            </Button>
          </div>
        </form>
      </Modal>

      {/* Upload Panorama Modal */}
      <UploadPanoramaModal
        isOpen={isUploadOpen}
        objectId={objectId}
        onClose={() => setIsUploadOpen(false)}
        onUploaded={() => {
          setIsUploadOpen(false);
          fetchObject();
        }}
      />

      {/* QR Modal */}
      <QrModal
        isOpen={qrModal.isOpen}
        onClose={() => setQrModal((prev) => ({ ...prev, isOpen: false }))}
        title={object.title}
        publicUrl={qrModal.publicUrl}
        qrSvg={qrModal.qrSvg}
        qrDataUri={qrModal.qrDataUri}
      />
    </div>
  );
};
