// pages/HistoryPage.jsx
import { useState, useEffect } from 'react';
import { Clock, Trash2, ChevronRight, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { historyService } from '../services/api';
import { useImage } from '../context/ImageContext';

const FEATURE_LABELS = {
  noise:       'Bruit & Filtre',
  blur:        'Flou',
  edge:        'Détection de contour',
  convolution: 'Convolution',
  adjustment:  'Réglages',
  brightness:  'Brillance',
  contrast:    'Contraste',
  luminosity:  'Luminosité',
};

const FEATURE_COLORS = {
  noise:       'text-purple-600 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/30',
  blur:        'text-blue-600   bg-blue-100   dark:text-blue-300   dark:bg-blue-900/30',
  edge:        'text-yellow-600 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/30',
  convolution: 'text-pink-600   bg-pink-100   dark:text-pink-300   dark:bg-pink-900/30',
  adjustment:  'text-green-600  bg-green-100  dark:text-green-300  dark:bg-green-900/30',
  brightness:  'text-orange-600 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/30',
  contrast:    'text-indigo-600 bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-900/30',
  luminosity:  'text-cyan-600   bg-cyan-100   dark:text-cyan-300   dark:bg-cyan-900/30',
};

function DeleteModal({ item, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative glass-strong rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <h3 className="text-white font-display font-bold text-lg text-center mb-1">
          Supprimer l'image ?
        </h3>
        <p className="text-slate-400 text-sm text-center mb-1">
          <span className="text-slate-300 font-medium">{item.file_name}</span>
        </p>
        <p className="text-slate-600 text-xs text-center mb-6">
          Cette action est irréversible.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-surface-border
                       text-slate-300 hover:text-white hover:bg-white/5
                       text-sm font-medium transition-all"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500
                       text-white text-sm font-medium transition-all"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [items,         setItems]         = useState([]);
  const [total,         setTotal]         = useState(0);
  const [page,          setPage]          = useState(1);
  const [loading,       setLoading]       = useState(true);
  const [deleteTarget,  setDeleteTarget]  = useState(null);
  const { loadImage, setProcessedImage }  = useImage();
  const navigate                          = useNavigate();
  const LIMIT = 12;

  const fetchHistory = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await historyService.list(p, LIMIT);
      setItems(data.images || []);
      setTotal(data.total  || 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(page); }, [page]);

  const handleDeleteClick = (item, e) => {
    e.stopPropagation();
    setDeleteTarget(item);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await historyService.delete(deleteTarget.id);
      setItems(prev => prev.filter(i => i.id !== deleteTarget.id));
      setTotal(t => t - 1);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleOpen = (item) => {
    loadImage(item.original_url, {
      id:     item.id,
      name:   item.file_name,
      width:  item.width,
      height: item.height,
    });
    if (item.result_url && item.result_url !== item.original_url) {
      setProcessedImage(item.result_url);
    }
    navigate('/app/noise');
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <>
      {deleteTarget && (
        <DeleteModal
          item={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="p-8 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Historique</h1>
              <p className="text-sm text-slate-500">
                {total} image{total !== 1 ? 's' : ''} traitée{total !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Grille */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: LIMIT }).map((_, i) => (
              <div key={i} className="aspect-video rounded-xl shimmer" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-24 text-slate-600">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Aucune image traitée pour l'instant</p>
            <p className="text-sm mt-1">Uploadez une image et appliquez un traitement</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map(item => (
              <div
                key={item.id}
                onClick={() => handleOpen(item)}
                className="group relative glass rounded-xl overflow-hidden cursor-pointer
                           hover:border-brand-600/40 transition-all hover:glow-brand-sm"
              >
                {/* Miniature */}
                <div className="aspect-video bg-surface flex items-center justify-center">
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt={item.file_name}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-700" />
                  )}
                </div>

                {/* Infos + badge en bas */}
                <div className="p-3">
                  <p className="text-sm text-slate-300 truncate font-medium">{item.file_name}</p>

                  {/* Badge feature */}
                  {item.feature && (
                    <span className={`inline-block text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full mt-1
                      ${FEATURE_COLORS[item.feature] || 'text-slate-400 bg-slate-800'}`}>
                      {FEATURE_LABELS[item.feature] || item.feature}
                    </span>
                  )}

                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-slate-600">
                      {new Date(item.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </p>
                    {item.width && item.height && (
                      <p className="text-xs text-slate-700 font-mono">{item.width}×{item.height}</p>
                    )}
                  </div>
                </div>

                {/* Overlay hover */}
                <div className="absolute inset-0 bg-brand-600/10 opacity-0 group-hover:opacity-100
                                transition-opacity flex items-center justify-center gap-2">
                  <button className="p-2 bg-brand-600 rounded-lg text-white">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(item, e)}
                    className="p-2 bg-red-500/80 rounded-lg text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-surface-border text-sm
                         text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
            >
              ← Précédent
            </button>
            <span className="text-sm text-slate-500 font-mono">{page} / {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-surface-border text-sm
                         text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
            >
              Suivant →
            </button>
          </div>
        )}
      </div>
    </>
  );
}