import React from 'react';
import { Annotation, AnnotationType } from '../../shared/types';
import { ANNOTATION_TEMPLATES, getTemplate, normalizePosition } from './annotationTemplates';
import { Button } from '../../shared/components/Button';
import { Input } from '../../shared/components/Input';
import { Textarea } from '../../shared/components/Textarea';
import { Trash2, MapPin, Ruler, MessageSquare, Tag, X } from 'lucide-react';

interface AnnotationSidebarProps {
  annotations: Annotation[];
  selectedAnnotation: Annotation | null;
  onSelectAnnotation: (annotation: Annotation | null) => void;
  activeTemplateKey: string | null;
  onSelectTemplate: (templateKey: string | null) => void;
  onUpdateAnnotation: (updated: Partial<Annotation>) => Promise<void>;
  onDeleteAnnotation: (id: number) => Promise<void>;
  isSaving?: boolean;
}

export const AnnotationSidebar: React.FC<AnnotationSidebarProps> = ({
  annotations,
  selectedAnnotation,
  onSelectAnnotation,
  activeTemplateKey,
  onSelectTemplate,
  onUpdateAnnotation,
  onDeleteAnnotation,
}) => {
  const COLOR_OPTIONS = [
    { label: 'Indigo', value: '#4f46e5' },
    { label: 'Emerald', value: '#059669' },
    { label: 'Amber', value: '#d97706' },
    { label: 'Rose', value: '#e11d48' },
    { label: 'Sky', value: '#0284c7' },
    { label: 'Slate', value: '#1e293b' },
  ];

  const getTemplateIcon = (type: AnnotationType) => {
    switch (type) {
      case 'measurement':
        return <Ruler className="w-4 h-4" />;
      case 'callout':
        return <MessageSquare className="w-4 h-4" />;
      case 'label':
        return <Tag className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const pos = selectedAnnotation ? normalizePosition(selectedAnnotation.position) : null;

  return (
    <aside className="w-80 md:w-96 bg-white border-l border-slate-200 flex flex-col h-full shadow-lg z-20 text-slate-900">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">
            {selectedAnnotation ? 'Настройка элемента' : 'Элементы панорамы'}
          </h3>
          <p className="text-xs text-slate-500">
            {selectedAnnotation
              ? getTemplate(selectedAnnotation.template_key).name
              : `Всего элементов: ${annotations.length}`}
          </p>
        </div>
        {selectedAnnotation && (
          <button
            onClick={() => onSelectAnnotation(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {selectedAnnotation ? (
          /* PROPERTIES FORM */
          <div className="space-y-4">
            {selectedAnnotation.type === 'measurement' ? (
              <div className="space-y-4">
                <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5" /> Архитектурная размерная линия
                  </p>
                  <p className="text-indigo-700/80">
                    На панораме отображается размерная линия с засечками. Вы можете перетаскивать белые маркеры на концах линии, чтобы точно измерить любой проем, мебель или стену.
                  </p>
                </div>

                <Input
                  label="Название размера (необязательно)"
                  value={selectedAnnotation.content?.title || ''}
                  onChange={(e) =>
                    onUpdateAnnotation({
                      content: { ...selectedAnnotation.content, title: e.target.value },
                    })
                  }
                  placeholder="Например: Ширина окна, Высота проема"
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Длина / Значение"
                    value={selectedAnnotation.content?.value || ''}
                    onChange={(e) =>
                      onUpdateAnnotation({
                        content: { ...selectedAnnotation.content, value: e.target.value },
                      })
                    }
                    placeholder="2.40"
                  />
                  <Input
                    label="Ед. измерения"
                    value={selectedAnnotation.content?.unit || ''}
                    onChange={(e) =>
                      onUpdateAnnotation({
                        content: { ...selectedAnnotation.content, unit: e.target.value },
                      })
                    }
                    placeholder="м / см / мм / м²"
                  />
                </div>
              </div>
            ) : (
              <Input
                label="Заголовок"
                value={selectedAnnotation.content?.title || ''}
                onChange={(e) =>
                  onUpdateAnnotation({
                    content: { ...selectedAnnotation.content, title: e.target.value },
                  })
                }
                placeholder="Заголовок элемента..."
              />
            )}

            {(selectedAnnotation.type === 'callout' || selectedAnnotation.type === 'marker') && (
              <Textarea
                label="Текст описания"
                value={selectedAnnotation.content?.text || ''}
                onChange={(e) =>
                  onUpdateAnnotation({
                    content: { ...selectedAnnotation.content, text: e.target.value },
                  })
                }
                rows={3}
                placeholder="Подробная информация о материале, бренде, особенностях..."
              />
            )}

            {/* Color Palette */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Цвет оформления
              </label>
              <div className="flex items-center gap-2.5">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() =>
                      onUpdateAnnotation({
                        style: {
                          ...selectedAnnotation.style,
                          backgroundColor: c.value,
                          lineColor: c.value,
                        },
                      })
                    }
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      (selectedAnnotation.style?.backgroundColor || '#4f46e5') === c.value
                        ? 'border-indigo-600 scale-125 shadow-md'
                        : 'border-transparent hover:scale-110'
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Coordinates Info */}
            {pos && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1 font-mono">
                <p className="font-sans font-semibold text-slate-700">Позиция на изображении:</p>
                <div className="flex items-center justify-between">
                  <span>X: {pos.x.toFixed(1)}%</span>
                  <span>Y: {pos.y.toFixed(1)}%</span>
                </div>
                {selectedAnnotation.type === 'measurement' && (
                  <div className="flex items-center justify-between text-indigo-600">
                    <span>X2: {pos.x2.toFixed(1)}%</span>
                    <span>Y2: {pos.y2.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteAnnotation(selectedAnnotation.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Удалить
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => onSelectAnnotation(null)}
              >
                Готово
              </Button>
            </div>
          </div>
        ) : (
          /* TOOLBOX & ANNOTATIONS LIST */
          <div className="space-y-6">
            {/* Add Element Section */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Добавить элемент
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Выберите тип элемента и кликните в нужное место на панораме:
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                {ANNOTATION_TEMPLATES.map((tmpl) => {
                  const isSelected = activeTemplateKey === tmpl.key;
                  return (
                    <button
                      key={tmpl.key}
                      onClick={() => onSelectTemplate(isSelected ? null : tmpl.key)}
                      className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-md'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-lg shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {getTemplateIcon(tmpl.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-xs text-slate-900">{tmpl.name}</p>
                          {isSelected && (
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider animate-pulse">
                              Выбрано
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                          {tmpl.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {activeTemplateKey && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-xs flex items-center justify-between animate-pulse">
                  <span>Режим добавления: кликните на панораму!</span>
                  <button
                    onClick={() => onSelectTemplate(null)}
                    className="font-bold underline text-indigo-950 ml-2"
                  >
                    Отмена
                  </button>
                </div>
              )}
            </div>

            {/* List of Existing Annotations */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Размещенные элементы ({annotations.length})
              </label>

              {annotations.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  На этой панораме пока нет добавленных элементов.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {annotations.map((ann) => {
                    const normalized = normalizePosition(ann.position);
                    return (
                      <div
                        key={ann.id}
                        onClick={() => onSelectAnnotation(ann)}
                        className="p-3 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-2 transition-all group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                            style={{
                              backgroundColor: ann.style?.backgroundColor || '#4f46e5',
                            }}
                          />
                          <div className="truncate">
                            <span className="text-xs font-semibold text-slate-800 block truncate">
                              {ann.type === 'measurement'
                                ? `${ann.content?.title ? ann.content.title + ': ' : ''}${ann.content?.value || '2.40'} ${ann.content?.unit || 'м'}`
                                : ann.content?.title || ann.content?.text || getTemplate(ann.template_key).name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {getTemplate(ann.template_key).name}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {normalized.x.toFixed(0)}%, {normalized.y.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
