import FeaturePage from './FeaturePage';

export function NoisePage() {
  return (
    <FeaturePage
      title="Bruit & Filtre"
      subtitle="Ajout de bruit · Filtres de restauration · PSNR · SSIM"
    />
  );
}

export function ConvolutionPage() {
  return (
    <FeaturePage
      title="Convolution & Déconvolution"
      subtitle="Noyaux 3×3, 5×5, 7×7 "
    />
  );
}

export function BlurPage() {
  return (
    <FeaturePage
      title="Flou"
      subtitle="Moyen · Gaussien · Mouvement "
    />
  );
}

export function EdgePage() {
  return (
    <FeaturePage
      title="Détection de Contour"
      subtitle="Canny · Laplacien · Roberts "
    />
  );
}
