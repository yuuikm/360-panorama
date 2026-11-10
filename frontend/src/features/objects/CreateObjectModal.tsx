import React, { useState } from 'react';
import { Modal } from '../../shared/components/Modal';
import { Input } from '../../shared/components/Input';
import { Textarea } from '../../shared/components/Textarea';
import { Button } from '../../shared/components/Button';
import { createObjectApi } from '../../shared/api/objects';

interface CreateObjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newObjectId?: number) => void;
}

export const CreateObjectModal: React.FC<CreateObjectModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Название обязательно');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await createObjectApi({
        title: title.trim(),
        description: description.trim() || undefined,
        status: 'draft',
      });
      setTitle('');
      setDescription('');
      onCreated(res.data.id);
    } catch (err: any) {
      setError(err?.message || 'Не удалось создать объект');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Новый объект">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <Input
          label="Название объекта"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Например: Жилой комплекс «Панорама», Квартира 42"
          required
          autoFocus
        />

        <Textarea
          label="Описание (необязательно)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Краткая информация об объекте, этаже, планировке..."
          rows={3}
        />

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Создать
          </Button>
        </div>
      </form>
    </Modal>
  );
};

