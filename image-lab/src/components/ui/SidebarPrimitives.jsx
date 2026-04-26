// ─── Reusable sidebar primitives ───

export function SidebarSection({ title, children }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-3">
        {title}
      </p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function SliderField({ label, value, onChange, min = 0, max = 100, step = 1, unit = '' }) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xs text-brand-400 font-mono">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))} />
    </div>
  );
}

export function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      {label && <p className="text-xs text-slate-400 mb-1.5">{label}</p>}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-surface border border-surface-border hover:border-brand-600/40
                   focus:border-brand-600 text-sm text-slate-200 rounded-lg px-3 py-2 outline-none
                   transition-all appearance-none cursor-pointer"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export function ToggleGroup({ label, options, value, onChange }) {
  return (
    <div>
      {label && <p className="text-xs text-slate-400 mb-1.5">{label}</p>}
      <div className="flex flex-wrap gap-1.5">
        {options.map(o => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all
              ${value === o.value
                ? 'bg-brand-600/30 text-brand-300 border border-brand-600/50'
                : 'bg-surface border border-surface-border text-slate-400 hover:border-brand-600/30 hover:text-slate-200'}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ApplyButton({ onClick, loading, label = 'Appliquer' }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold
                 flex items-center justify-center gap-2 transition-all glow-brand-sm hover:glow-brand
                 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
    >
      {loading
        ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        : label}
    </button>
  );
}

export function MetricsCard({ snr, psnr, ssim }) {
  if (!snr && !psnr && !ssim) return null;
  return (
    <div className="glass rounded-xl p-4 space-y-2">
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Métriques</p>
      {[['SNR', snr, 'dB'], ['PSNR', psnr, 'dB'], ['SSIM', ssim, '']].map(([k, v, u]) =>
        v != null ? (
          <div key={k} className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-mono">{k}</span>
            <span className="text-xs font-semibold text-brand-300 font-mono">
              {typeof v === 'number' ? v.toFixed(2) : v}{u}
            </span>
          </div>
        ) : null
      )}
    </div>
  );
}

export function Divider() {
  return <div className="border-t border-surface-border" />;
}
