import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider }  from './context/AuthContext';
import { ImageProvider } from './context/ImageContext';
import { ThemeProvider } from './context/ThemeContext';
import AuthPage          from './components/auth/AuthPage';
import ProtectedRoute    from './components/auth/ProtectedRoute';
import AppLayout         from './components/layout/AppLayout';
import { NoisePage, ConvolutionPage, BlurPage, EdgePage } from './pages/FeaturePages';
import HistoryPage       from './pages/HistoryPage';
import './index.css';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ImageProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<AuthPage />} />

              {/* Protected app shell */}
              <Route path="/app" element={
                <ProtectedRoute>   {/* ← wrappé ici */}
                  <AppLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="noise" replace />} />
                <Route path="noise"       element={<NoisePage />} />
                <Route path="convolution" element={<ConvolutionPage />} />
                <Route path="blur"        element={<BlurPage />} />
                <Route path="edge"        element={<EdgePage />} />
                <Route path="history"     element={<HistoryPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ImageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}