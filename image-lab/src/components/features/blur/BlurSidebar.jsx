import { useState, useRef, useEffect } from 'react';
import {
  SidebarSection, ToggleGroup, SliderField, ApplyButton, Divider
} from '../../ui/SidebarPrimitives';
import ImageUpload from '../../ui/ImageUpload';
import { useImage } from '../../../context/ImageContext';
import { blurService } from '../../../services/api';

const BLUR_TYPES = [
  { value: 'average',     label: 'Moyen' },
  { value: 'gaussian',    label: 'Gaussien' },
  { value: 'motion',      label: 'Mouvement' },
  { value: 'personalisé', label: 'Personnalisé' },
];

const KERNEL_SIZES = [
  { value: '3', label: '3×3' },
  { value: '5', label: '5×5' },
  { value: '7', label: '7×7' },
];

const DEFAULT_CUSTOM_KERNEL = [
  [0, 0, 0],
  [0, 1, 0],
  [0, 0, 0],
];

const imageToFile = async (src, filename = 'image.png') => {
  if (src.startsWith('data:')) {
    const arr  = src.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  }
  const res  = await fetch(src);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || 'image/png' });
};

export default function BlurSidebar() {
  const { metadata, originalImage, processedImage, pushResult, setActiveFeature } = useImage();

  const [blurType,     setBlurType]     = useState('gaussian');
  const [kernelSize,   setKernelSize]   = useState('5');
  const [sigma,        setSigma]        = useState(1.5);
  const [angle,        setAngle]        = useState(0);
  const [customKernel, setCustomKernel] = useState(DEFAULT_CUSTOM_KERNEL);
  const [loading,      setLoading]      = useState(false);

  const baseRef = useRef(null);

  useEffect(() => { baseRef.current = null; }, [originalImage]);

  const getBase = () => {
    if (!baseRef.current) baseRef.current = processedImage || originalImage;
    return baseRef.current;
  };

  const updateKernelCell = (row, col, value) => {
    const next = customKernel.map((r, ri) =>
      r.map((c, ci) => (ri === row && ci === col ? Number(value) : c))
    );
    setCustomKernel(next);
  };

  const apply = async () => {
    if (!originalImage) return;
    setLoading(true);
    try {
      const base = getBase();
      const file = await imageToFile(base, metadata?.file?.name || 'image.png');
      let response;
      if (blurType === 'average') {
        response = await blurService.applyAverage(file, { kernel_size: parseInt(kernelSize) });
      } else if (blurType === 'gaussian') {
        response = await blurService.applyGaussian(file, { kernel_size: parseInt(kernelSize), sigma_x: sigma });
      } else if (blurType === 'motion') {
        response = await blurService.applyMotion(file, { kernel_size: parseInt(kernelSize), angle });
      } else if (blurType === 'personalisé') {
        response = await blurService.applyCustom(file, customKernel, { normalize: true });
      }
      setActiveFeature('blur');
      pushResult(URL.createObjectURL(response.data));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pr-1 custom-scrollbar space-y-3 pb-6">

      <SidebarSection title="Image source">
        <ImageUpload />
      </SidebarSection>

      <Divider />

      <SidebarSection title="Type de flou">
        <div className="grid grid-cols-2 gap-1.5">
          {BLUR_TYPES.map(b => (
            <button
              key={b.value}
              onClick={() => setBlurType(b.value)}
              disabled={!originalImage}
              className={`py-2 rounded-lg text-xs font-medium transition-all text-center border
                ${blurType === b.value
                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/40'
                  : 'bg-surface border-surface-border text-slate-400 hover:border-blue-500/30 hover:text-blue-300'
                }
                disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </SidebarSection>

      <Divider />

      <SidebarSection title="Paramètres">
        {blurType !== 'personalisé' && (
          <ToggleGroup
            label="Taille du noyau"
            options={KERNEL_SIZES}
            value={kernelSize}
            onChange={setKernelSize}
            disabled={!originalImage}
          />
        )}
        {blurType === 'gaussian' && (
          <SliderField
            label="Sigma"
            value={sigma}
            onChange={setSigma}
            min={0.1}
            max={10}
            step={0.1}
          />
        )}
        {blurType === 'motion' && (
          <SliderField
            label="Angle (°)"
            value={angle}
            onChange={setAngle}
            min={0}
            max={360}
            step={1}
          />
        )}
        {blurType === 'personalisé' && (
          <div className="mt-2">
            <p className="text-xs text-slate-400 mb-2">
              Noyau personnalisé (3×3)
            </p>
            <div className="grid grid-cols-3 gap-1">
              {customKernel.map((row, ri) =>
                row.map((val, ci) => (
                  <input
                    key={`${ri}-${ci}`}
                    type="number"
                    value={val}
                    onChange={e => updateKernelCell(ri, ci, e.target.value)}
                    disabled={!originalImage}
                    className="w-full text-center text-xs rounded px-1 py-1.5 border outline-none
                               bg-surface border-surface-border text-slate-300
                               focus:border-blue-500/50 transition-all
                               disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                ))
              )}
            </div>
            <p className="text-xs mt-2 text-slate-500">
              Somme : {customKernel.flat().reduce((a, b) => a + b, 0)}
            </p>
          </div>
        )}
      </SidebarSection>

      <ApplyButton onClick={apply} loading={loading} disabled={!originalImage} />
    </div>
  );
}