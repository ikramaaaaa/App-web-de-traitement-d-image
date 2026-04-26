import { useState, useRef, useEffect } from 'react';
import { Sun, Contrast, RotateCcw } from 'lucide-react';
import { useImage } from '../../context/ImageContext';
import api from '../../services/api';

export default function AdjustmentsPanel() {
  const { originalImage, processedImage, pushResult, setActiveFeature } = useImage();

  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [loading, setLoading] = useState(false);

  const adjustmentBaseRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    adjustmentBaseRef.current = null;
    setBrightness(0);
    setContrast(0);
  }, [originalImage]);

  const getBase = () => {
    if (!adjustmentBaseRef.current) {
      adjustmentBaseRef.current = processedImage || originalImage;
    }
    return adjustmentBaseRef.current;
  };

  const applyAdjustments = (b, c) => {
    if (!originalImage) return;

    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);

      try {
        const base = getBase();
        const res = await fetch(base);
        const blob = await res.blob();
        let currentImage = blob;

        if (b !== 0) {
          const form = new FormData();
          form.append('file', currentImage, 'image.png');
          form.append('alpha', b / 100.0);

          const r = await api.post('/adjust/brightness', form);
          currentImage = await (await fetch(r.data.image)).blob();
        }

        if (c !== 0) {
          const C0 = 1.0 + c / 100.0;

          const form = new FormData();
          form.append('file', currentImage, 'image.png');
          form.append('C0', String(C0));

          const r = await api.post('/adjust/contrast', form);
          currentImage = await (await fetch(r.data.image)).blob();
        }

        if (b === 0 && c === 0) {
          pushResult(base);
          setLoading(false);
          return;
        }

        setActiveFeature('adjustment');

        const reader = new FileReader();
        reader.onloadend = () => pushResult(reader.result);
        reader.readAsDataURL(currentImage);

      } catch (err) {
        console.error('Erreur adjust:', err);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleBrightness = (val) => {
    setBrightness(val);
    applyAdjustments(val, contrast);
  };

  const handleContrast = (val) => {
    setContrast(val);
    applyAdjustments(brightness, val);
  };

  const resetAll = () => {
    setBrightness(0);
    setContrast(0);

    const base = adjustmentBaseRef.current || processedImage || originalImage;
    adjustmentBaseRef.current = null;

    if (base) pushResult(base);
  };

  const hasChanges = brightness !== 0 || contrast !== 0;

  return (
    <div className="glass rounded-xl p-4 space-y-3">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <p className="text-[10px] uppercase tracking-widest text-slate-500">
          Réglages
        </p>

        {hasChanges && (
          <button
            onClick={resetAll}
            className="text-[10px] text-slate-400 flex items-center gap-1 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-2 gap-3">

        {/* BRIGHTNESS */}
        <div className={`flex flex-col gap-2 p-3 rounded-xl border transition-all
          ${!originalImage || loading ? 'opacity-40 pointer-events-none' : ''}
          border-yellow-600/30 bg-yellow-600/5`}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <Sun className="w-3.5 h-3.5 text-yellow-400" />
              Brillance
            </span>

            {/* VALUE (LIGHT MODE FIXED) */}
            <span className="text-xs font-mono px-2 py-0.5 rounded-md
              text-yellow-700 bg-yellow-100 border border-yellow-200">
              {brightness > 0 ? `+${brightness}` : brightness}
            </span>
          </div>

          <input
            type="range"
            min={-100}
            max={100}
            value={brightness}
            disabled={!originalImage || loading}
            onChange={(e) => handleBrightness(Number(e.target.value))}
            className="w-full h-1 rounded-full cursor-pointer accent-yellow-400"
          />

          <div className="flex justify-between text-[10px] text-slate-500">
            <span>−100</span><span>0</span><span>+100</span>
          </div>
        </div>

        {/* CONTRAST */}
        <div className={`flex flex-col gap-2 p-3 rounded-xl border transition-all
          ${!originalImage || loading ? 'opacity-40 pointer-events-none' : ''}
          border-purple-600/30 bg-purple-600/5`}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <Contrast className="w-3.5 h-3.5 text-purple-400" />
              Contraste
            </span>

            {/* VALUE (LIGHT MODE FIXED) */}
            <span className="text-xs font-mono px-2 py-0.5 rounded-md
              text-purple-700 bg-purple-100 border border-purple-200">
              {contrast > 0 ? `+${contrast}` : contrast}
            </span>
          </div>

          <input
            type="range"
            min={-100}
            max={100}
            value={contrast}
            disabled={!originalImage || loading}
            onChange={(e) => handleContrast(Number(e.target.value))}
            className="w-full h-1 rounded-full cursor-pointer accent-purple-400"
          />

          <div className="flex justify-between text-[10px] text-slate-500">
            <span>−100</span><span>0</span><span>+100</span>
          </div>
        </div>

      </div>

      {/* EMPTY STATE */}
      {!originalImage && (
        <p className="text-[10px] text-center text-slate-500">
          Charge une image
        </p>
      )}

    </div>
  );
}