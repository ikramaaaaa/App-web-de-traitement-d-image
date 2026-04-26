import { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, Sliders } from 'lucide-react';
import { useImage } from '../../context/ImageContext';
import { histogramService } from '../../services/api';

const TABS = [
  { id: 'normal',     label: 'Histogramme', icon: BarChart2  },
  { id: 'cumulative', label: 'Cumulé',      icon: TrendingUp },
  { id: 'equalized',  label: 'Égalisé',     icon: Sliders    },
];

function HistCanvas({ data, color = '#2979ff', height = 200 }) {
  if (!Array.isArray(data) || !data.length) {
    return (
      <div className="flex items-center justify-center h-40 text-xs text-slate-500 dark:text-slate-400">
        Aucune donnée
      </div>
    );
  }

  const max = Math.max(...data, 1);

  return (
    <div
      className="flex items-end w-full border-b"
      style={{
        height,
        borderColor: 'var(--border-color)',
      }}
    >
      {data.map((v, i) => (
        <div
          key={i}
          className="hist-bar rounded-t-sm hover:opacity-100"
          style={{
            height: `${(v / max) * 100}%`,
            flex: 1,
            background: color,
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  );
}

// ─── Utilitaire image → File ───────────────────────────
const imageToFile = async (src, filename = 'image.png') => {
  if (!src) return null;

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

  return new File([blob], filename, {
    type: blob.type || 'image/png',
  });
};

export default function HistogramPanel({ imageSource, label }) {
  const { metadata, originalImage } = useImage();

  const [tab, setTab] = useState('normal');
  const [histData, setHistData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState('gray');

  const channelColors = {
    r: '#ef4444',
    g: '#22c55e',
    b: '#3b82f6',
    gray: '#64748b',
  };

  const effectiveSource = imageSource ?? originalImage;

  useEffect(() => {
    if (!effectiveSource) {
      setHistData(null);
      return;
    }

    const load = async () => {
      setLoading(true);

      try {
        const file = await imageToFile(
          effectiveSource,
          metadata?.name || 'image.png'
        );

        let res;

        if (tab === 'normal') {
          res = await histogramService.getHistoFromImage(file);
          setHistData(res.data);
        } else if (tab === 'cumulative') {
          res = await histogramService.cumulativeFromImage(file);
          setHistData({ gray: res.data });
        } else if (tab === 'equalized') {
          res = await histogramService.equalizeFromImage(file);
          setHistData({ gray: res.data });
        }
      } catch (err) {
        console.error('Histogram error:', err);
      }

      setLoading(false);
    };

    load();
  }, [effectiveSource, tab]);

  return (
    <div
      className="rounded-xl p-4 space-y-4 border"
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border-color)',
        color: 'var(--text-primary)',
      }}
    >

      {/* Label */}
      {label && (
        <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400">
          {label}
        </p>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map(({ id, label: tabLabel, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-all"
            style={{
              background:
                tab === id ? 'rgba(41,121,255,0.15)' : 'transparent',
              color:
                tab === id
                  ? '#60a5fa'
                  : 'var(--text-secondary)',
              border:
                tab === id
                  ? '1px solid rgba(41,121,255,0.4)'
                  : '1px solid transparent',
            }}
          >
            <Icon className="w-4 h-4" />
            {tabLabel}
          </button>
        ))}
      </div>

      {/* Channel selector */}
      {tab !== 'equalized' && (
        <div className="flex gap-2">
          {['gray', 'r', 'g', 'b'].map(c => (
            <button
              key={c}
              onClick={() => setChannel(c)}
              className="px-3 py-1 text-xs uppercase border rounded-md transition-all"
              style={{
                borderColor:
                  channel === c
                    ? channelColors[c]
                    : 'var(--border-color)',
                color: channelColors[c],
                opacity: channel === c ? 1 : 0.6,
              }}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Chart */}
      <div
        className="rounded-lg p-4 min-h-[220px]"
        style={{
          background: 'var(--bg-base)',   // 🔥 FIX ICI
          border: '1px solid var(--border-color)',
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-40 text-sm text-slate-500 dark:text-slate-400">
            Chargement...
          </div>
        ) : histData ? (
          <HistCanvas
            data={histData[channel] || histData.gray || []}
            color={channelColors[channel]}
            height={200}
          />
        ) : (
          <div className="flex items-center justify-center h-40 text-sm text-slate-500 dark:text-slate-400">
            Charge une image
          </div>
        )}
      </div>

    </div>
  );
}