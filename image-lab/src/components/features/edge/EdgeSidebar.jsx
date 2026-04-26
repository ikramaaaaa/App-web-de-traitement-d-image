import { useState, useRef, useEffect } from 'react';
import { useImage } from '../../../context/ImageContext';
import { edgeService } from '../../../services/api';
import ImageUpload from '../../ui/ImageUpload';
import {
  SidebarSection, ToggleGroup,
  ApplyButton, Divider
} from '../../ui/SidebarPrimitives';

const METHODS = [
  { value: 'gradient-directionnel', label: 'Directionnel' },
  { value: 'roberts',               label: 'Roberts'      },
  { value: 'prewitt',               label: 'Prewitt'      },
  { value: 'sobel',                 label: 'Sobel'        },
  { value: 'laplacien',             label: 'Laplacien'    },
  { value: 'seuillage-gradient',    label: 'Seuillage'    },
  { value: 'seuillage-laplacien',   label: 'Annulation. Lap.' },
  { value: 'canny',                 label: 'Canny'        },
  { value: 'lignes-contours',       label: 'Lignes contours'  },
];

function MatrixDisplay({ kernel, selected, onSelect }) {
  const is4 = kernel === '4';
  const rows = is4
    ? [['0', '1', '0'], ['1', '-4', '1'], ['0', '1', '0']]
    : [['1', '1', '1'], ['1', '-8', '1'], ['1', '1', '1']];

  return (
    <button
      onClick={() => onSelect(kernel)}
      style={{
        borderColor: selected ? 'rgba(41,121,255,0.5)' : 'var(--border-color)',
        backgroundColor: selected ? 'rgba(41,121,255,0.15)' : 'var(--bg-card)',
        color: selected ? '#60a5fa' : 'var(--text-secondary)',
      }}
      className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border transition-all hover:border-[rgba(41,121,255,0.3)]"
    >
      <span className="text-[11px] font-semibold tracking-wide">
        {is4 ? 'D-4' : 'D-8'}
      </span>
      <div className="flex items-center gap-1">
        <div className="flex flex-col" style={{ fontSize: 22, lineHeight: '1' }}>
          <span>⎛</span><span>⎜</span><span>⎝</span>
        </div>
        <div className="grid gap-x-2 gap-y-0.5" style={{ gridTemplateColumns: 'repeat(3, auto)' }}>
          {rows.flat().map((val, i) => (
            <span key={i} className="text-[12px] font-mono text-center w-5 leading-5">{val}</span>
          ))}
        </div>
        <div className="flex flex-col" style={{ fontSize: 22, lineHeight: '1' }}>
          <span>⎞</span><span>⎟</span><span>⎠</span>
        </div>
      </div>
      <span className="text-[10px] opacity-60">
        {is4 ? 'D = [[0,1,0],[1,-4,1],[0,1,0]]' : 'D1 = [[1,1,1],[1,-8,1],[1,1,1]]'}
      </span>
    </button>
  );
}

function Slider({ label, value, onChange, min, max, step = 1 }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span
          className="text-xs font-mono px-1.5 py-0.5 rounded"
          style={{ color: '#60a5fa', backgroundColor: 'rgba(41,121,255,0.15)' }}
        >
          {value}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1 rounded-full cursor-pointer"
      />
      <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}

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

export default function EdgeSidebar() {
  const { metadata, originalImage, processedImage, pushResult, setActiveFeature } = useImage();
  const [method,    setMethod]    = useState('sobel');
  const [lapKernel, setLapKernel] = useState('4');
  const [thresh1,   setThresh1]   = useState(100);
  const [thresh2,   setThresh2]   = useState(200);
  const [levels,    setLevels]    = useState(3);
  const [loading,   setLoading]   = useState(false);

  const baseRef = useRef(null);

  useEffect(() => { baseRef.current = null; }, [originalImage]);

  const getBase = () => {
    if (!baseRef.current) baseRef.current = processedImage || originalImage;
    return baseRef.current;
  };

  const apply = async () => {
    if (!originalImage) return;
    setLoading(true);
    try {
      const base = getBase();
      const file = await imageToFile(base, metadata?.file?.name || 'image.png');
      const formData = new FormData();
      formData.append('file', file);
      if (method === 'laplacien')       formData.append('kernel',     lapKernel);
      if (method === 'canny') {
        formData.append('threshold1',   String(thresh1));
        formData.append('threshold2',   String(thresh2));
      }
      if (method === 'lignes-contours') formData.append('levels', String(levels));
      const r = await edgeService.detectEdges(method, formData);
      setActiveFeature('edge');
      pushResult(`data:image/png;base64,${r.data.image}`);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col gap-4">
      <SidebarSection title="Image source">
        <ImageUpload />
      </SidebarSection>
      <Divider />

      <section>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-2"
           style={{ color: 'var(--text-muted)' }}>
          Methode de detection
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {METHODS.map(m => (
            <button
              key={m.value}
              onClick={() => setMethod(m.value)}
              style={{
                backgroundColor: method === m.value ? 'rgba(41,121,255,0.2)' : 'var(--bg-card)',
                color:           method === m.value ? '#60a5fa'               : 'var(--text-secondary)',
                borderColor:     method === m.value ? 'rgba(41,121,255,0.5)'  : 'var(--border-color)',
              }}
              className="py-2 px-1 rounded-lg text-xs font-medium transition-all text-center border hover:border-[rgba(41,121,255,0.3)]"
            >
              {m.label}
            </button>
          ))}
        </div>
      </section>

      {method === 'laplacien' && (
        <>
          <hr style={{ borderColor: 'var(--border-color)' }} />
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-3"
               style={{ color: 'var(--text-muted)' }}>
              Matrice D
            </p>
            <div className="flex gap-2">
              <MatrixDisplay kernel="4" selected={lapKernel === '4'} onSelect={setLapKernel} />
              <MatrixDisplay kernel="8" selected={lapKernel === '8'} onSelect={setLapKernel} />
            </div>
          </section>
        </>
      )}

      {method === 'canny' && (
        <>
          <hr style={{ borderColor: 'var(--border-color)' }} />
          <section className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest"
               style={{ color: 'var(--text-muted)' }}>
              Parametres Canny
            </p>
            <Slider label="Seuil bas (threshold1)"  value={thresh1} onChange={setThresh1} min={0} max={500} />
            <Slider label="Seuil haut (threshold2)" value={thresh2} onChange={setThresh2} min={0} max={500} />
          </section>
        </>
      )}

      {method === 'lignes-contours' && (
        <>
          <hr style={{ borderColor: 'var(--border-color)' }} />
          <section>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-3"
               style={{ color: 'var(--text-muted)' }}>
              Parametres
            </p>
            <Slider label="Nombre de niveaux" value={levels} onChange={setLevels} min={1} max={20} step={1} />
          </section>
        </>
      )}

      <hr style={{ borderColor: 'var(--border-color)' }} />

      <button
        onClick={apply}
        disabled={loading || !originalImage}
        style={{
          backgroundColor: loading ? 'rgba(41,121,255,0.2)' : '#2979ff',
          color: loading ? '#60a5fa' : '#ffffff',
        }}
        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
      >
        {loading ? 'Traitement...' : 'Appliquer'}
      </button>
    </div>
  );
}