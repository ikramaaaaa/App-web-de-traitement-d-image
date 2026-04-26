import { useRef, useState, useEffect } from 'react';
import {
  ZoomIn, ZoomOut, RotateCw, Crop, Save, Undo2, RefreshCcw,
  Maximize2, Download, CheckCircle, Loader2,
} from 'lucide-react';
import { useImage } from '../../context/ImageContext';
import { histogramService } from '../../services/api';

export default function ImageViewer() {
  const {originalImage, processedImage, metadata,setMetadata,undo, reset, canUndo,activeFeature,setProcessedImage} = useImage();

  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [cropMode, setCropMode] = useState(false);
  const [panelH, setPanelH] = useState(320);
  const [degree, setDegree] = useState(90);
  const [rotating, setRotating] = useState(false);
  const [cropStart, setCropStart] = useState(null);

  // ── CROP FIX : rectangle visuel pendant le drag ──
  const [dragRect, setDragRect] = useState(null);
  const imgRef = useRef(null);

  // État du bouton Sauvegarder
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [saveErr, setSaveErr] = useState(false);

  const containerRef = useRef(null);

  /* ── Hauteur dynamique selon les proportions de l'image ── */
  useEffect(() => {
    if (!metadata?.width || !metadata?.height) { setPanelH(320); return; }
    const availW = (containerRef.current?.offsetWidth ?? window.innerWidth - 330) / 2 - 8;
    const ratio = metadata.height / metadata.width;
    const ideal = Math.round(availW * ratio);
    const clamped = Math.min(Math.max(ideal, 200), window.innerHeight * 0.68);
    setPanelH(clamped);
  }, [metadata]);

  const handleRotate = async () => {
    if (!metadata?.file || rotating) return;
    setRotating(true);
    try {
      const sourceImage = processedImage || originalImage;
      const response = await fetch(sourceImage);
      const blob = await response.blob();
      const fileToRotate = new File([blob], metadata.file.name, { type: blob.type || "image/png" });
      const res = await histogramService.rotateImage(fileToRotate, degree);
      const url = URL.createObjectURL(res.data);
      setProcessedImage(url);
      const newFile = new File([res.data], metadata.file.name, { type: "image/png" });
      setMetadata(prev => ({ ...prev, file: newFile }));
    } catch (err) {
      console.error('Rotation failed:', err);
    } finally {
      setRotating(false);
    }
  };

  /* ── CROP FIX : conversion coordonnées CSS → pixels image réels ── */
  const getCropDataInImagePixels = (cssX, cssY, cssW, cssH, containerRect) => {
    const img = imgRef.current;
    if (!img) return null;

    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;
    const containerW = containerRect.width;
    const containerH = containerRect.height;

    // Calcul du facteur object-contain (letterboxing)
    const scaleToFit = Math.min(containerW / naturalW, containerH / naturalH);

    // Taille réelle affichée de l'image dans le conteneur
    const displayedW = naturalW * scaleToFit;
    const displayedH = naturalH * scaleToFit;

    // Offset des marges letterbox (centrage)
    const offsetX = (containerW - displayedW) / 2;
    const offsetY = (containerH - displayedH) / 2;

    // Conversion en coordonnées image réelles
    const realX = Math.round((cssX - offsetX) / scaleToFit);
    const realY = Math.round((cssY - offsetY) / scaleToFit);
    const realW = Math.round(cssW / scaleToFit);
    const realH = Math.round(cssH / scaleToFit);

    // Clamp pour ne pas dépasser les bords de l'image
    const clampedX = Math.max(0, realX);
    const clampedY = Math.max(0, realY);
    const clampedW = Math.min(realW, naturalW - clampedX);
    const clampedH = Math.min(realH, naturalH - clampedY);

    return { x: clampedX, y: clampedY, width: clampedW, height: clampedH };
  };

  const handleCrop = async (cropData) => {
    if (!metadata?.file || !cropData) return;
    try {
      const sourceImage = processedImage || originalImage;
      const response = await fetch(sourceImage);
      const blob = await response.blob();
      const file = new File([blob], metadata.file.name, { type: blob.type || "image/png" });
      const res = await histogramService.cropImage(file, cropData);
      const url = URL.createObjectURL(res.data);
      setProcessedImage(url);
    } catch (err) {
      console.error("Crop failed:", err);
    }
  };

  const zoom = (dir) => setScale(s => Math.min(Math.max(s + dir * 0.15, 0.2), 5));
  const rotate = () => setRotation(r => (r + 90) % 360);

  /* ── Téléchargement local ── */
  const download = () => {
    if (!processedImage) return;
    const a = document.createElement('a');
    a.href = processedImage;
    a.download = `imagelab_${Date.now()}.png`;
    a.click();
  };

  const saveToHistory = async () => {
    if (!processedImage || saving) return;
    setSaving(true);
    setSaveOk(false);
    setSaveErr(false);
    try {
      const originalResponse = await fetch(originalImage);
      const originalBlob = await originalResponse.blob();
      const resultResponse = await fetch(processedImage);
      const resultBlob = await resultResponse.blob();
      const form = new FormData();
      form.append("original_file", originalBlob, "original.png");
      form.append("result_file", resultBlob, "result.png");
      form.append("file_name", metadata?.name || "image.png");
      form.append("feature", activeFeature || "adjustment");
      form.append("width", metadata?.width || 0);
      form.append("height", metadata?.height || 0);
      form.append("params", JSON.stringify({ feature: activeFeature, date: new Date().toISOString() }));
      const userStr = localStorage.getItem('imagelab_user');
      const token = userStr ? JSON.parse(userStr).token : null;
      const res = await fetch('http://127.0.0.1:8000/api/history/save', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      setSaveOk(true);
    } catch (err) {
      console.error("SAVE ERROR:", err);
      setSaveErr(true);
    } finally {
      setSaving(false);
    }
  };

  const SaveIcon = saving ? Loader2 : saveOk ? CheckCircle : Save;
  const saveLabel = saving ? 'Sauvegarde…' : saveOk ? 'Sauvegardé !' : saveErr ? 'Erreur !' : 'Sauvegarder';

  const EmptySlot = ({ label }) => (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-600">
      <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-700 flex items-center justify-center">
        <Maximize2 className="w-6 h-6" />
      </div>
      <span className="text-xs">{label}</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-3" ref={containerRef}>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1">
          {[
            { Icon: ZoomIn, onClick: () => zoom(1), tip: 'Zoom avant' },
            { Icon: ZoomOut, onClick: () => zoom(-1), tip: 'Zoom arrière' },
            { Icon: Crop, onClick: () => { setCropMode(v => !v); setDragRect(null); }, tip: 'Recadrer', active: cropMode },
          ].map(({ Icon, onClick, tip, active }) => (
            <IconBtn key={tip} Icon={Icon} onClick={onClick} tip={tip} active={active} />
          ))}
        </div>

        <div className="w-px h-6 bg-surface-border mx-1" />
        {/* <span className="text-xs text-slate-500 font-mono">{Math.round(scale * 100)}%</span> */}

        <div className="flex items-center gap-1.5 bg-white/5 border border-surface-border rounded-lg px-2 py-1">
          <button
            onClick={handleRotate}
            disabled={rotating || !originalImage}
            className="disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <RotateCw className={`w-3.5 h-3.5 transition-colors ${
              rotating
                ? 'text-brand-400 animate-spin'
                : 'text-slate-400 hover:text-white cursor-pointer'
            }`} />
          </button>
          <input
            type="number"
            value={degree}
            min={-360}
            max={360}
            step={1}
            onChange={e => setDegree(Number(e.target.value))}
            onKeyDown={e => e.key === 'Enter' && handleRotate()}
            className="w-12 bg-transparent text-xs text-white font-mono text-center
               focus:outline-none [appearance:textfield]
               [&::-webkit-outer-spin-button]:appearance-none
               [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-xs text-slate-500">°</span>
        </div>
      </div>

      {/* ── Dual panels ── */}
      <div className="grid grid-cols-2 gap-4" style={{ height: panelH }}>

        {/* Original */}
        <div className="image-panel">
          <span className="absolute top-2 left-2 z-10 text-[10px] font-mono uppercase tracking-widest
                           text-brand-400 bg-surface/80 px-2 py-0.5 rounded-full border border-brand-600/20">
            Original
          </span>
          {originalImage ? (
            <img
              src={originalImage}
              alt="Original"
              draggable={false}
              className="w-full h-full object-contain"
              style={{ transform: `scale(${scale}) rotate(${rotation}deg)`, transition: 'transform 0.25s ease' }}
            />
          ) : <EmptySlot label="Chargez une image" />}
        </div>

        {/* Résultat */}
        <div className="image-panel">
          <span className="absolute top-2 left-2 z-10 text-[10px] font-mono uppercase tracking-widest
                           text-emerald-400 bg-surface/80 px-2 py-0.5 rounded-full border border-emerald-600/20">
            Résultat
          </span>

          {processedImage ? (
            <div
              className={`relative w-full h-full overflow-hidden ${cropMode ? 'cursor-crosshair' : ''}`}

              /* ── MOUSE DOWN : début du crop ── */
              onMouseDown={(e) => {
                if (!cropMode) return;
                const rect = e.currentTarget.getBoundingClientRect();
                setCropStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                setDragRect(null);
              }}

              /* ── MOUSE MOVE : dessin du rectangle visuel ── */
              onMouseMove={(e) => {
                if (!cropMode || !cropStart) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const curX = e.clientX - rect.left;
                const curY = e.clientY - rect.top;
                setDragRect({
                  x: Math.min(cropStart.x, curX),
                  y: Math.min(cropStart.y, curY),
                  width: Math.abs(curX - cropStart.x),
                  height: Math.abs(curY - cropStart.y),
                });
              }}

              /* ── MOUSE UP : fin du crop → envoi au backend ── */
              onMouseUp={async (e) => {
                if (!cropMode || !cropStart) return;

                const rect = e.currentTarget.getBoundingClientRect();
                const endX = e.clientX - rect.left;
                const endY = e.clientY - rect.top;

                const cssX = Math.min(cropStart.x, endX);
                const cssY = Math.min(cropStart.y, endY);
                const cssW = Math.abs(endX - cropStart.x);
                const cssH = Math.abs(endY - cropStart.y);

                // Trop petit → ignorer
                if (cssW < 5 || cssH < 5) {
                  setCropStart(null);
                  setDragRect(null);
                  return;
                }

                // Conversion CSS → pixels image réels
                const cropData = getCropDataInImagePixels(cssX, cssY, cssW, cssH, rect);

                setDragRect(null);
                setCropStart(null);

                if (!cropData || cropData.width < 1 || cropData.height < 1) return;

                await handleCrop(cropData);
                setCropMode(false); // désactiver le mode crop après chaque recadrage
              }}

              /* ── MOUSE LEAVE : annuler si on sort du panneau ── */
              onMouseLeave={() => {
                if (cropMode) {
                  setCropStart(null);
                  setDragRect(null);
                }
              }}
            >
              <img
                ref={imgRef}
                src={processedImage}
                alt="Processed"
                draggable={false}
                className="w-full h-full object-contain pointer-events-none"
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  transition: 'transform 0.25s ease',
                }}
              />

              {/* Rectangle visuel de sélection du crop */}
              {dragRect && (
                <div
                  className="absolute border-2 border-brand-400 bg-brand-400/10 pointer-events-none"
                  style={{
                    left: dragRect.x,
                    top: dragRect.y,
                    width: dragRect.width,
                    height: dragRect.height,
                  }}
                />
              )}

              {/* Indicateur mode crop actif */}
              {cropMode && !dragRect && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-mono
                                text-brand-400 bg-surface/80 px-2 py-0.5 rounded-full border border-brand-600/20
                                pointer-events-none select-none">
                  Tracez une zone à recadrer
                </div>
              )}
            </div>
          ) : (
            <EmptySlot label="Résultat apparaîtra ici" />
          )}
        </div>
      </div>

      {/* ── Metadata ── */}
      {metadata && (
        <div className="flex items-center gap-4 text-xs text-slate-500 font-mono px-1">
          <span>{metadata.name}</span>
          <span className="text-slate-700">|</span>
          <span>{metadata.width} × {metadata.height} px</span>
          {metadata.size && (
            <>
              <span className="text-slate-700">|</span>
              <span>{(metadata.size / 1024).toFixed(1)} KB</span>
            </>
          )}
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex items-center justify-end gap-2 border-t border-surface-border pt-3">
        <ActionBtn Icon={Undo2} label="Retour" onClick={undo} disabled={!canUndo} />
        <ActionBtn Icon={RefreshCcw} label="Réinitialiser" onClick={reset} />
        <div className="w-px h-5 bg-surface-border mx-1" />
        <ActionBtn
          Icon={Download}
          label="Télécharger"
          onClick={download}
          disabled={!processedImage}
          tip="Télécharger l'image traitée"
        />
        <ActionBtn
          Icon={SaveIcon}
          label={saveLabel}
          onClick={saveToHistory}
          disabled={!processedImage || saving}
          primary
          spin={saving}
          success={saveOk}
          error={saveErr}
          tip="Sauvegarder dans votre historique"
        />
      </div>
    </div>
  );
}

function IconBtn({ Icon, onClick, tip, active }) {
  return (
    <div className="relative has-tooltip">
      <button
        onClick={onClick}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
          ${active
            ? 'bg-brand-600/30 text-brand-400 border border-brand-600/40'
            : 'text-slate-400 hover:text-white hover:bg-white/8 border border-transparent'}`}
      >
        <Icon className="w-4 h-4" />
      </button>
      {tip && <span className="tooltip">{tip}</span>}
    </div>
  );
}

function ActionBtn({ Icon, label, onClick, disabled, primary, spin, success, error, tip }) {
  return (
    <div className="relative has-tooltip">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
          ${primary
            ? success
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : error
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-brand-600 hover:bg-brand-500 text-white glow-brand-sm'
            : 'border border-surface-border text-slate-400 hover:text-white hover:bg-white/5'}
          ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
      >
        <Icon className={`w-3.5 h-3.5 ${spin ? 'animate-spin' : ''}`} />
        {label}
      </button>
      {tip && <span className="tooltip">{tip}</span>}
    </div>
  );
}