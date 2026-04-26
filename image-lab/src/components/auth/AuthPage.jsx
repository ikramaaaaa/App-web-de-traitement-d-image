import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, User, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ParticleBackground from '../ui/ParticleBackground';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        navigate('/app/noise');
      } else {
        await register(name, email, password);
        setMode('login'); // switch vers login
        setEmail('');
        setPassword('');
        setName('');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center relative overflow-hidden">
      <ParticleBackground />

      {/* Glow background */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-brand-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-6 animate-fade-in">

        {/* Logo + Subtitle */}
        <div className="flex flex-col items-center mb-8">
          <span className="font-display text-3xl font-bold text-white text-glow tracking-tight">
            Tswir<span className="text-brand-400">Ti</span>
          </span>
          <span className="text-slate-400 text-sm mt-1">
            Traitement et amélioration d’images
          </span>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-2xl p-6 shadow-2xl">

          {/* Title */}
          <div className="space-y-1 mb-4">
            <h1 className="font-display text-2xl font-bold text-white">
              {mode === 'login' ? 'Bon retour' : 'Créer un compte'}
            </h1>
            <p className="text-slate-400 text-sm">
              {mode === 'login'
                ? 'Connectez-vous pour accéder à votre espace'
                : 'Inscrivez-vous et commencez à traiter vos images'}
            </p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">

            {mode === 'register' && (
              <Field
                icon={<User className="w-4 h-4" />}
                placeholder="Nom complet"
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                required
              />
            )}

            <Field
              icon={<Mail className="w-4 h-4" />}
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />

            <div className="relative">
              <Field
                icon={<Lock className="w-4 h-4" />}
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPw ? 'text' : 'password'}
                required
              />

              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-brand-400 transition-colors"
              >
                {showPw ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold
                         flex items-center justify-center gap-2 transition-all
                         hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Se connecter' : "S'inscrire"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch */}
          <p className="mt-4 text-center text-sm text-slate-400">
            {mode === 'login' ? "Pas encore de compte ?" : 'Déjà inscrit ?'}{' '}
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
            >
              {mode === 'login' ? "S'inscrire" : 'Se connecter'}
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center mt-4 text-xs text-slate-500">
          Amélioration • Filtres • Traitement d’images
        </p>
      </div>
    </div>
  );
}

function Field({ icon, type, placeholder, value, onChange, required }) {
  return (
    <div className="relative flex items-center">
      <span className="absolute left-3 text-slate-500">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full bg-surface border border-surface-border hover:border-brand-600/40 focus:border-brand-600
                   text-white placeholder-slate-500 rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all"
      />
    </div>
  );
}