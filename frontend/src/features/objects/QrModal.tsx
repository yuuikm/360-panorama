import React, { useState } from 'react';
import { Modal } from '../../shared/components/Modal';
import { Button } from '../../shared/components/Button';
import { Copy, Check, Download, ExternalLink } from 'lucide-react';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  publicUrl: string;
  qrSvg: string;
  qrDataUri: string;
}

export const QrModal: React.FC<QrModalProps> = ({
  isOpen,
  onClose,
  title,
  publicUrl,
  qrSvg,
  qrDataUri,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownloadSvg = () => {
    const blob = new Blob([qrSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-${title.toLowerCase().replace(/\s+/g, '-')}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Публичный доступ и QR-код" maxWidth="md">
      <div className="space-y-6 text-center">
        <div>
          <h4 className="font-medium text-slate-800 text-sm">Объект: {title}</h4>
          <p className="text-xs text-slate-500 mt-1">
            Отсканируйте камерой смартфона для мобильного просмотра
          </p>
        </div>

        {/* QR Code Container */}
        <div className="bg-slate-50 p-6 rounded-2xl inline-block border border-slate-200/80 shadow-inner mx-auto">
          {qrDataUri ? (
            <img
              src={qrDataUri}
              alt="QR Code"
              className="w-56 h-56 mx-auto rounded-lg shadow-sm bg-white p-2"
            />
          ) : (
            <div
              className="w-56 h-56 mx-auto bg-white p-2 rounded-lg flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          )}
        </div>

        {/* Public URL Box */}
        <div className="space-y-2 text-left">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Защищённая ссылка
          </label>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 border border-slate-200">
            <input
              type="text"
              readOnly
              value={publicUrl}
              className="bg-transparent text-xs text-slate-700 font-mono flex-1 focus:outline-none select-all"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="shrink-0 bg-white"
              leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copied ? 'Скопировано!' : 'Копировать'}
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDownloadSvg}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Скачать QR (SVG)
          </Button>

          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button
              variant="primary"
              className="w-full"
              leftIcon={<ExternalLink className="w-4 h-4" />}
            >
              Открыть в браузере
            </Button>
          </a>
        </div>
      </div>
    </Modal>
  );
};

