import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getObjectsApi,
  deleteObjectApi,
  publishObjectApi,
  unpublishObjectApi,
} from '../../shared/api/objects';
import { PanoramaObject } from '../../shared/types';
import { Button } from '../../shared/components/Button';
import { Badge } from '../../shared/components/Badge';
import { Card } from '../../shared/components/Card';
import { Input } from '../../shared/components/Input';
import { CreateObjectModal } from '../../features/objects/CreateObjectModal';
import { QrModal } from '../../features/objects/QrModal';
import {
  Plus,
  Search,
  Layers,
  Trash2,
  Globe,
  Loader2,
  Calendar,
} from 'lucide-react';

export const ObjectsPage: React.FC = () => {
  const [objects, setObjects] = useState<PanoramaObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // QR Modal state
  const [qrModalData, setQrModalData] = useState<{
    isOpen: boolean;
    title: string;
    publicUrl: string;
    qrSvg: string;
    qrDataUri: string;
  }>({
    isOpen: false,
    title: '',
    publicUrl: '',
    qrSvg: '',
    qrDataUri: '',
  });

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchObjects = async () => {
    try {
      setIsLoading(true);
      const res = await getObjectsApi({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      });
      setObjects(res.data);
    } catch (err) {
      console.error('Failed to fetch objects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchObjects();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchObjects();
  };

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Вы уверены, что хотите удалить объект «${title}»? Все загруженные панорамы также будут удалены.`)) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteObjectApi(id);
      setObjects((prev) => prev.filter((o) => o.id !== id));
    } catch (err: any) {
      alert(err?.message || 'Ошибка удаления');
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublish = async (object: PanoramaObject) => {
    try {
      if (object.status === 'published') {
        await unpublishObjectApi(object.id);
        setObjects((prev) =>
          prev.map((o) => (o.id === object.id ? { ...o, status: 'draft' } : o))
        );
      } else {
        const res = await publishObjectApi(object.id);
        setObjects((prev) =>
          prev.map((o) =>
            o.id === object.id
              ? { ...o, status: 'published', has_token: true }
              : o
          )
        );
        // Show QR modal upon publishing
        setQrModalData({
          isOpen: true,
          title: object.title,
          publicUrl: res.public_url,
          qrSvg: res.qr_code_svg,
          qrDataUri: res.qr_code_data_uri,
        });
      }
    } catch (err: any) {
      alert(err?.message || 'Ошибка при изменении статуса публикации');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Объекты
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Список всех пространств и панорамных экспозиций
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsCreateOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Создать объект
        </Button>
      </div>

      {/* Filters and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md flex items-center gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию или описанию..."
              className="py-1.5"
            />
            <Button type="submit" variant="secondary" size="sm" leftIcon={<Search className="w-4 h-4" />}>
              Найти
            </Button>
          </form>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Статус:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Все статусы</option>
              <option value="draft">Черновики</option>
              <option value="published">Опубликованные</option>
              <option value="archived">Архив</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Objects List */}
      {isLoading ? (
        <div className="p-16 text-center bg-white rounded-xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="text-sm text-slate-500 mt-3">Загрузка списка объектов...</p>
        </div>
      ) : objects.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-xl border border-slate-200">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900">Объекты не найдены</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {search || statusFilter
              ? 'По заданным параметрам поиска ничего не найдено. Попробуйте сбросить фильтры.'
              : 'Создайте первый объект, чтобы начать загрузку панорам.'}
          </p>
          <Button
            variant="primary"
            size="sm"
            className="mt-5"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Создать объект
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {objects.map((obj) => (
            <Card key={obj.id} className="flex flex-col justify-between overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900 text-lg hover:text-indigo-600 transition-colors line-clamp-1">
                    <Link to={`/admin/objects/${obj.id}`}>{obj.title}</Link>
                  </h3>
                  <Badge status={obj.status} />
                </div>

                <p className="text-sm text-slate-500 line-clamp-2 min-h-[2.5rem]">
                  {obj.description || 'Описание отсутствует'}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1 font-medium">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    Панорам: {obj.panoramas_count || 0}
                  </span>
                  {obj.updated_at && (
                    <span className="flex items-center gap-1 text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(obj.updated_at).toLocaleDateString('ru-RU')}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-1">
                <Link to={`/admin/objects/${obj.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    Управление
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTogglePublish(obj)}
                  title={obj.status === 'published' ? 'Снять с публикации' : 'Опубликовать'}
                  className={obj.status === 'published' ? 'text-emerald-600 hover:text-emerald-700' : 'text-slate-600'}
                >
                  <Globe className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(obj.id, obj.title)}
                  disabled={deletingId === obj.id}
                  title="Удалить объект"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateObjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          setIsCreateOpen(false);
          fetchObjects();
        }}
      />

      {/* QR & Publish Modal */}
      <QrModal
        isOpen={qrModalData.isOpen}
        onClose={() => setQrModalData((prev) => ({ ...prev, isOpen: false }))}
        title={qrModalData.title}
        publicUrl={qrModalData.publicUrl}
        qrSvg={qrModalData.qrSvg}
        qrDataUri={qrModalData.qrDataUri}
      />
    </div>
  );
};
