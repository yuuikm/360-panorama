import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getObjectsApi } from '../../shared/api/objects';
import { PanoramaObject } from '../../shared/types';
import { Card } from '../../shared/components/Card';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { Layers, CheckCircle2, Clock, Plus, ArrowRight, Loader2 } from 'lucide-react';
import { CreateObjectModal } from '../../features/objects/CreateObjectModal';

export const DashboardPage: React.FC = () => {
  const [objects, setObjects] = useState<PanoramaObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchObjects = async () => {
    try {
      setIsLoading(true);
      const res = await getObjectsApi({ per_page: 5 });
      setObjects(res.data);
    } catch (err) {
      console.error('Failed to load objects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchObjects();
  }, []);

  const totalCount = objects.length;
  const publishedCount = objects.filter((o) => o.status === 'published').length;
  const draftCount = objects.filter((o) => o.status === 'draft').length;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Панель управления
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Обзор опубликованных объектов и загруженных панорам
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Всего объектов</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{totalCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Опубликовано</p>
              <p className="text-3xl font-bold text-emerald-600 mt-2">{publishedCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Черновики</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">{draftCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Objects */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Последние объекты</h2>
          <Link
            to="/admin/objects"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            Все объекты <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
            <p className="text-sm text-slate-500 mt-2">Загрузка объектов...</p>
          </div>
        ) : objects.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-medium text-slate-800">Пока нет созданных объектов</p>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Создайте первый объект, чтобы загрузить панорамы и расставить аннотации.
            </p>
            <Button
              variant="primary"
              size="sm"
              className="mt-4"
              onClick={() => setIsCreateOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Создать объект
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {objects.map((object) => (
              <div
                key={object.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/admin/objects/${object.id}`}
                      className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
                    >
                      {object.title}
                    </Link>
                    <Badge status={object.status} />
                  </div>
                  {object.description && (
                    <p className="text-sm text-slate-500 line-clamp-1">{object.description}</p>
                  )}
                  <p className="text-xs text-slate-400">
                    Панорам: {object.panoramas_count || 0}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link to={`/admin/objects/${object.id}`}>
                    <Button variant="outline" size="sm">
                      Открыть
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateObjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          setIsCreateOpen(false);
          fetchObjects();
        }}
      />
    </div>
  );
};

