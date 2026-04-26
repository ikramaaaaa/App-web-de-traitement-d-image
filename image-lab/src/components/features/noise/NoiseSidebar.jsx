import { useState, useRef, useEffect } from 'react';
import {
  SidebarSection,
  ToggleGroup,
  SliderField,
  Divider
} from '../../ui/SidebarPrimitives';
import ImageUpload from '../../ui/ImageUpload';
import { useImage } from '../../../context/ImageContext';

const NOISE_TYPES = [
  { value: 'gaussien', label: 'Gaussien', recommended: ['gaussien', 'moyenne', 'binomial'] },
  { value: 'poivre_sel', label: 'Poivre & Sel', recommended: ['median'] },
  { value: 'speckle', label: 'Speckle', recommended: ['median', 'gaussien'] },
];

const FILTER_TYPES = [
  { value: 'moyenne', label: 'Moyenneur' },
  { value: 'gaussien', label: 'Gaussien' },
  { value: 'binomial', label: 'Binomial' },
  { value: 'median', label: 'Médian' },
  { value: 'dog', label: 'DOG' },
  { value: 'log', label: 'LoG' },
];

const KERNEL_SIZES = [
  { value: '3', label: '3×3' },
  { value: '5', label: '5×5' },
  { value: '7', label: '7×7' },
];

const imageToBlob = async (src, filename = 'image.png') => {
  if (src.startsWith('data:')) {
    const arr = src.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  }

  const res = await fetch(src);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || 'image/png' });
};

export default function NoiseSidebar() {
  const {
    metadata,
    pushResult,
    originalImage,
    processedImage,
    setActiveFeature
  } = useImage();

  const [noiseType, setNoiseType] = useState('gaussien');
  const [intensity, setIntensity] = useState(20);
  const [loadingNoise, setLoadingNoise] = useState(false);

  const [filterType, setFilterType] = useState('gaussien');
  const [kernelSize, setKernelSize] = useState('3');
  const [loadingFilter, setLoadingFilter] = useState(false);

  const [metrics, setMetrics] = useState(null);

  const noiseBaseRef = useRef(null);
  const noisyImageRef = useRef(null);

  useEffect(() => {
    noiseBaseRef.current = null;
    noisyImageRef.current = null;
  }, [originalImage]);

  const getNoiseBase = () => {
    if (!noiseBaseRef.current) {
      noiseBaseRef.current = processedImage || originalImage;
    }
    return noiseBaseRef.current;
  };

  const currentNoise = NOISE_TYPES.find((n) => n.value === noiseType);
  const recommendedFilters = currentNoise?.recommended ?? [];

  const handleNoiseChange = (value) => {
    setNoiseType(value);
    setMetrics(null);

    const noise = NOISE_TYPES.find((n) => n.value === value);
    if (noise?.recommended?.length) {
      setFilterType(noise.recommended[0]);
    }
  };

  const applyNoise = async () => {
    if (!originalImage) return;

    setLoadingNoise(true);
    setMetrics(null);

    try {
      const file = await imageToBlob(
        getNoiseBase(),
        metadata?.name || 'image.png'
      );

      const formData = new FormData();
      formData.append('file', file);
      formData.append('noise_type', noiseType);
      formData.append('intensity', intensity);

      const res = await fetch(
        'http://127.0.0.1:8000/api/noise/noise',
        { method: 'POST', body: formData }
      );

      const data = await res.json();

      setActiveFeature('noise');
      pushResult(data.image);
      noisyImageRef.current = data.image; // 📌 fige l'image bruitée

      if (data.psnr || data.ssim) {
        setMetrics({
          psnr: data.psnr,
          ssim: data.ssim,
          stage: 'bruit'
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingNoise(false);
    }
  };

  const applyFilter = async () => {
    if (!noisyImageRef.current || !originalImage) return;

    setLoadingFilter(true);

    try {
      const originalFile = await imageToBlob(originalImage, 'original.png');
      const noisyFile = await imageToBlob(noisyImageRef.current, 'noisy.png'); // toujours l'image bruitée figée

      const formData = new FormData();
      formData.append('original', originalFile);
      formData.append('noisy', noisyFile);
      formData.append('filter_type', filterType);
      formData.append('kernel_size', parseInt(kernelSize));

      const res = await fetch(
        'http://127.0.0.1:8000/api/noise/filter',
        { method: 'POST', body: formData }
      );

      const data = await res.json();

      pushResult(data.image);

      if (data.psnr || data.ssim) {
        setMetrics({
          psnr: data.psnr,
          ssim: data.ssim,
          stage: 'restauration'
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFilter(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pr-1 custom-scrollbar space-y-3 pb-6">

      <SidebarSection title="Image source">
        <ImageUpload />
      </SidebarSection>

      <Divider />

      {/* DEGRADATION */}
      <div className="rounded-xl border border-blue-500/25 bg-blue-500/5 overflow-visible">

        <div className="flex items-center gap-3 px-4 py-3 border-b border-blue-500/15">
          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-blue-600/30 text-blue-300 text-xs font-bold">
            1
          </div>
          <p className="text-sm font-semibold text-blue-300">
            Dégradation
          </p>
        </div>

        <div className="p-4 space-y-4">

          <div className="grid grid-cols-3 gap-1.5">
            {NOISE_TYPES.map((n) => {
              const active = noiseType === n.value;

              return (
                <button
                  key={n.value}
                  onClick={() => handleNoiseChange(n.value)}
                  className={`py-2 px-1 rounded-lg text-xs font-medium transition-all border
                  ${
                    active
                      ? 'bg-blue-500/15 text-blue-300 border-blue-500/40'
                      : 'bg-surface border-surface-border text-slate-400 hover:border-blue-500/30 hover:text-blue-300'
                  }`}
                >
                  {n.label}
                </button>
              );
            })}
          </div>

          <SliderField
            label="Intensité"
            value={intensity}
            onChange={setIntensity}
            min={1}
            max={100}
            step={1}
          />

          <button
            onClick={applyNoise}
            disabled={loadingNoise || !originalImage}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all
            ${
              loadingNoise
                ? 'bg-blue-500/20 text-blue-300 cursor-wait'
                : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'
            }
            disabled:opacity-50`}
          >
            {loadingNoise ? 'Injection...' : 'Appliquer le bruit'}
          </button>

        </div>
      </div>

      {/* CONNECTOR */}
      <div className="flex items-center justify-center gap-2 py-1">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-700" />
        <span className="text-[10px] text-slate-600 uppercase tracking-widest px-2">
          puis
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-700" />
      </div>

      {/* RESTAURATION */}
      <div className="rounded-xl border border-blue-400/25 bg-blue-400/5 overflow-visible">

        <div className="flex items-center gap-3 px-4 py-3 border-b border-blue-400/15">
          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-blue-500/20 text-blue-300 text-xs font-bold">
            2
          </div>
          <p className="text-sm font-semibold text-blue-300">
            Restauration
          </p>
        </div>

        <div className="p-4 space-y-4">

          <div className="grid grid-cols-2 gap-1.5">
            {FILTER_TYPES.map((f) => {
              const active = filterType === f.value;
              const recommended = recommendedFilters.includes(f.value);

              return (
                <button
                  key={f.value}
                  onClick={() => setFilterType(f.value)}
                  className={`flex items-center justify-between py-2 px-3 rounded-lg text-xs font-medium transition-all border
                  ${
                    active
                      ? 'bg-blue-500/15 text-blue-300 border-blue-500/40'
                      : 'bg-surface border-surface-border text-slate-400 hover:border-blue-500/30 hover:text-blue-300'
                  }`}
                >
                  <span>{f.label}</span>

                  {recommended && (
                    <span className="text-[10px] text-emerald-400 font-bold">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <ToggleGroup
            label="Taille du noyau"
            options={KERNEL_SIZES}
            value={kernelSize}
            onChange={setKernelSize}
          />

          <button
            onClick={applyFilter}
            disabled={loadingFilter || !noisyImageRef.current || !originalImage}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all
            ${
              loadingFilter
                ? 'bg-blue-500/20 text-blue-300 cursor-wait'
                : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'
            }
            disabled:opacity-50`}
          >
            {loadingFilter ? 'Filtrage...' : 'Appliquer le filtre'}
          </button>

        </div>
      </div>

      {/* METRICS */}
      {metrics && (
        <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl space-y-3">

          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            {metrics.stage === 'bruit'
              ? 'Impact du bruit'
              : 'Qualité restauration'}
          </p>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400">PSNR</span>
              <span className="font-mono font-bold text-blue-400">
                {metrics.psnr} dB
              </span>
            </div>

            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{
                  width: `${Math.min((metrics.psnr / 50) * 100, 100)}%`
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400">SSIM</span>
              <span className="font-mono font-bold text-blue-400">
                {metrics.ssim}
              </span>
            </div>

            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500"
                style={{
                  width: `${metrics.ssim * 100}%`
                }}
              />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}