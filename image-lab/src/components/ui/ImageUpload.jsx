import { useCallback, useState } from 'react';
import { ImageIcon, CheckCircle } from 'lucide-react';
import { useImage } from '../../context/ImageContext';
import UTIF from 'utif';

export default function ImageUpload() {
  const { loadImage } = useImage();
  const [loaded, setLoaded] = useState(false);

  /* ── Conversion TIFF → PNG dataURL via utif.js ── */
  const tiffToDataUrl = async (file) => {
    const buffer = await file.arrayBuffer();
    const ifds = UTIF.decode(buffer);
    UTIF.decodeImage(buffer, ifds[0]);
    const rgba = UTIF.toRGBA8(ifds[0]);

    const canvas = document.createElement('canvas');
    canvas.width = ifds[0].width;
    canvas.height = ifds[0].height;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    imageData.data.set(rgba);
    ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL('image/png');
  };

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setLoaded(false);

    let localUrl;
    let displayFile = file;

    /* ── TIFF : conversion côté client ── */
    if (file.name.match(/\.tiff?$/i) || file.type === 'image/tiff') {
      try {
        localUrl = await tiffToDataUrl(file);
        // Recréer un File PNG pour le reste du pipeline (crop, rotate, etc.)
        const res = await fetch(localUrl);
        const blob = await res.blob();
        displayFile = new File(
          [blob],
          file.name.replace(/\.tiff?$/i, '.png'),
          { type: 'image/png' }
        );
      } catch (err) {
        console.error('Échec conversion TIFF:', err);
        return;
      }
    } else {
      /* ── Autres formats : lecture locale classique ── */
      localUrl = await new Promise((res) => {
        const reader = new FileReader();
        reader.onload = (e) => res(e.target.result);
        reader.readAsDataURL(file);
      });
    }

    /* ── Chargement dans un <img> pour récupérer les dimensions ── */
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error('Impossible de lire l\'image'));
      i.src = localUrl;
    }).catch((err) => {
      console.error(err);
      return null;
    });

    if (!img) return;

    loadImage(localUrl, {
      name:   file.name,
      width:  img.naturalWidth,
      height: img.naturalHeight,
      size:   file.size,
      file:   displayFile,   // PNG converti si TIFF, original sinon
    });

    setLoaded(true);
    setTimeout(() => setLoaded(false), 2000);
  }, [loadImage]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  return (
    <div
      onDragOver={e => e.preventDefault()}
      onDrop={onDrop}
      className="relative border-2 border-dashed border-brand-600/30 hover:border-brand-600/60
                 rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer
                 bg-brand-950/20 hover:bg-brand-950/30 transition-all group"
      onClick={() => document.getElementById('file-input').click()}
    >
      <div className="w-12 h-12 rounded-xl bg-brand-600/15 flex items-center justify-center
                      group-hover:bg-brand-600/25 transition-colors">
        {loaded
          ? <CheckCircle className="w-5 h-5 text-emerald-400" />
          : <ImageIcon className="w-5 h-5 text-brand-400" />
        }
      </div>

      <div className="text-center">
        <p className="text-sm text-slate-300 font-medium">
          {loaded ? 'Image chargée !' : 'Glissez une image ou cliquez'}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">PNG, JPG, BMP, TIFF</p>
      </div>

      <input
        id="file-input"
        type="file"
        accept="image/*,.tif,.tiff"
        className="hidden"
        onChange={e => handleFile(e.target.files[0])}
      />
    </div>
  );
}