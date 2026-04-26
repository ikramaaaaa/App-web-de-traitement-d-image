import { useState, useRef, useEffect } from 'react';
import {
  SidebarSection, ToggleGroup,
  ApplyButton, Divider
} from '../../ui/SidebarPrimitives';
import ImageUpload from '../../ui/ImageUpload';
import { useImage } from '../../../context/ImageContext';
import { convolutionService } from '../../../services/api';

const KERNEL_SIZES = [
  { value: '3', label: '3×3' },
  { value: '5', label: '5×5' },
  { value: '7', label: '7×7' },
];

export default function ConvolutionSidebar() {
  const { originalImage, processedImage, pushResult, setActiveFeature } = useImage();
  const [mode,       setMode]       = useState('conv');
  const [kernelSize, setKernelSize] = useState('3');
  const [loading,    setLoading]    = useState(false);

  const baseRef = useRef(null);

  useEffect(() => {
    baseRef.current = null;
  }, [originalImage]);

  const getBase = () => {
    if (!baseRef.current) {
      baseRef.current = processedImage || originalImage;
    }
    return baseRef.current;
  };

  const apply = async () => {
    if (!originalImage) return;
    setLoading(true);
    try {
      const base = getBase();
      let r;
      if (mode === 'conv') {
        r = await convolutionService.convolve(base, parseInt(kernelSize));
      } else {
        r = await convolutionService.deconvolve(base, parseInt(kernelSize));
      }
      setActiveFeature('convolution');
      pushResult(r.data.url);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <>
      <SidebarSection title="Image source">
        <ImageUpload />
      </SidebarSection>
      <Divider />
      <SidebarSection title="Mode">
        <ToggleGroup
          options={[{ value: 'conv', label: 'Convolution' }, { value: 'deconv', label: 'Déconvolution' }]}
          value={mode} onChange={setMode}
        />
      </SidebarSection>
      <Divider />
      <SidebarSection title="Taille du noyau">
        <ToggleGroup
          options={KERNEL_SIZES}
          value={kernelSize}
          onChange={setKernelSize}
        />
      </SidebarSection>
      <ApplyButton onClick={apply} loading={loading} />
    </>
  );
}