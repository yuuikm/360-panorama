import React, { useState } from 'react';
import { Modal } from '../../shared/components/Modal';
import { Input } from '../../shared/components/Input';
import { Button } from '../../shared/components/Button';
import { uploadPanoramaApi } from '../../shared/api/panoramas';
import { UploadCloud, X } from 'lucide-react';

interface UploadPanoramaModalProps {
  isOpen: boolean;
  objectId: number;
  onClose: () => void;
  onUploaded: () => void;
}

export const UploadPanoramaModal: React.FC<UploadPanoramaModalProps> = ({
  isOpen,
  objectId,
  onClose,
  onUploaded,
}) => {
  const [title, setTitle] = useState('');
  const [viewerType, setViewerType] = useState<'flat' | '360'>('flat');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selectedFile.type)) {
      setError('Поддерживаются только форматы JPEG, PNG, WebP');
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('Размер файла не должен превышать 50 МБ');
      return;
    }

    setError(null);
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));

    if (!title) {
      // Auto-fill title from filename
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
      setTitle(nameWithoutExt);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Укажите название помещения');
      return;
    }
    if (!file) {
      setError('Выберите панорамное изображение');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('viewer_type', viewerType);
      formData.append('image', file);

      await uploadPanoramaApi(objectId, formData);

      setTitle('');
      setFile(null);
      setPreviewUrl(null);
      onUploaded();
    } catch (err: any) {
      setError(err?.message || 'Ошибка загрузки панорамы');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Добавить 360°-панораму">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <Input
          label="Название помещения"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Например: Гостиная, Спальня, Прихожая"
          required
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Тип отображения
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setViewerType('flat')}
              className={`p-3 rounded-xl border text-left transition-all ${
                viewerType === 'flat'
                  ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 text-indigo-950 font-semibold'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="text-xs font-bold mb-0.5">Фиксированная</div>
              <div className="text-[11px] text-slate-500 font-normal">
                Без искажений, исходное фото
              </div>
            </button>

            <button
              type="button"
              onClick={() => setViewerType('360')}
              className={`p-3 rounded-xl border text-left transition-all ${
                viewerType === '360'
                  ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 text-indigo-950 font-semibold'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="text-xs font-bold mb-0.5">360° Сфера</div>
              <div className="text-[11px] text-slate-500 font-normal">
                Equirectangular 2:1 панорама
              </div>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Панорамное изображение (360° Equirectangular)
          </label>

          {previewUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 aspect-[2/1] group">
              <img
                src={previewUrl}
                alt="Предпросмотр"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreviewUrl(null);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-black/60 text-white text-xs">
                {file?.name} ({(file!.size / 1024 / 1024).toFixed(1)} МБ)
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/20 cursor-pointer transition-colors text-center">
              <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
              <p className="text-sm font-medium text-slate-700">
                Нажмите для выбора или перетащите файл
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Поддерживается 360° формат 2:1 (JPG, PNG, WebP) до 50 МБ
              </p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />
            </label>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} disabled={!file}>
            Загрузить
          </Button>
        </div>
      </form>
    </Modal>
  );
};
