import ImageViewer     from '../components/ui/ImageViewer';
import HistogramPanel  from '../components/ui/HistogramPanel';
import AdjustmentsPanel from '../components/ui/AdjustmentsPanel';
import { useImage }    from '../context/ImageContext';

export default function FeaturePage({ title, subtitle }) {
  const { originalImage, processedImage } = useImage();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col p-5 gap-4 overflow-y-auto">

      {/* ── En-tête ── */}
      <div className="shrink-0">
        <h1 className="font-display text-xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      {/* ── Zone images ── */}
      <div className="shrink-0">
        <ImageViewer />
      </div>

      {/* ── Réglages ── */}
      <div className="shrink-0">
        <AdjustmentsPanel />
      </div>

      {/* ── Histogrammes côte à côte ── */}
      <div className="shrink-0 grid grid-cols-2 gap-4">
        <div className="overflow-y-auto max-h-96">
          <HistogramPanel
            imageSource={originalImage}
            label="Histogramme — Original"
          />
        </div>
        <div className="overflow-y-auto max-h-96">
          <HistogramPanel
            imageSource={processedImage ?? originalImage}
            label="Histogramme — Résultat"
          />
        </div>
      </div>

    </div>
  );
}