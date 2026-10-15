'use client';

import { useCallback, useEffect, useState } from 'react';
import Cropper from 'react-easy-crop';
import { Loader2 } from 'lucide-react';
import { getCroppedBlob, type CropPixels } from '@/lib/cropImage';

/** Crop modal shown when an admin picks a product photo. Fixed 3:4 (site ratio). */
export default function ImageCropper({
  file,
  onDone,
  onCancel,
  uploading,
  remaining,
}: {
  file: File;
  onDone: (blob: Blob) => void;
  onCancel: () => void;
  uploading?: boolean;
  remaining?: number;
}) {
  const [src, setSrc] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<CropPixels | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setArea(null);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onComplete = useCallback((_: unknown, pixels: CropPixels) => setArea(pixels), []);

  const use = async () => {
    if (!area) return;
    setBusy(true);
    try {
      const blob = await getCroppedBlob(src, area, 1200, 1600);
      onDone(blob);
    } catch {
      setBusy(false);
    }
  };

  const working = busy || !!uploading;

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-[5px] w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
        <div className="px-4 py-3 border-b border-neutral-200 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Crop photo{remaining && remaining > 1 ? ` (1 of ${remaining})` : ''}</p>
            <p className="text-[11px] text-neutral-500">Recommended: 3:4 portrait · ~1200×1600 px</p>
          </div>
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider bg-neutral-100 border border-neutral-200 px-2 py-1 rounded-[5px]">3 : 4</span>
        </div>

        <div className="relative w-full bg-neutral-900" style={{ height: 360 }}>
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={3 / 4}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onComplete}
              objectFit="contain"
              showGrid
            />
          )}
        </div>

        <div className="px-4 py-3 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-500 shrink-0">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-black"
            />
          </div>
          <p className="text-[11px] text-neutral-500 leading-relaxed">
            The area inside the box is what gets saved. Drag / zoom to frame it — anything outside the 3:4 box is cropped off.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={working}
              className="px-3 py-2 text-sm rounded-[5px] border border-neutral-200 hover:bg-neutral-50 disabled:opacity-60"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={use}
              disabled={!area || working}
              className="px-4 py-2 text-sm rounded-[5px] bg-black text-white hover:bg-neutral-800 disabled:opacity-60 inline-flex items-center gap-1.5"
            >
              {working && <Loader2 size={14} className="animate-spin" />} Use photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
