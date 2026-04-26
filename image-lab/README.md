# ImageLab — Frontend React

Interface de traitement d'image inspirée d'Ederest, construite avec React + Tailwind CSS.

## Stack
- React 18 + React Router v6
- Tailwind CSS 3
- Lucide React (icônes)
- Axios (appels API)
- Recharts (graphiques)

## Installation

```bash
npm install
npm start
```

## Variable d'environnement

Créez un fichier `.env` à la racine :

```
REACT_APP_API_URL=http://localhost:8000/api
```

## Structure du projet

```
src/
├── components/
│   ├── auth/
│   │   ├── AuthPage.jsx          ← Login / Register avec particules
│   │   └── ProtectedRoute.jsx    ← Garde de route
│   ├── layout/
│   │   ├── AppLayout.jsx         ← Shell principal (Navbar + Sidebar + <Outlet/>)
│   │   ├── Navbar.jsx            ← Barre de navigation (4 features + profil)
│   │   └── Sidebar.jsx           ← Routeur de sidebar (change selon la page)
│   ├── features/
│   │   ├── noise/
│   │   │   └── NoiseSidebar.jsx  ← Contrôles bruit + filtre + métriques SNR/PSNR/SSIM
│   │   ├── convolution/
│   │   │   └── ConvolutionSidebar.jsx
│   │   ├── blur/
│   │   │   └── BlurSidebar.jsx
│   │   └── edge/
│   │       └── EdgeSidebar.jsx
│   └── ui/
│       ├── ParticleBackground.jsx ← Canvas animé (particules + connexions)
│       ├── ImageViewer.jsx        ← Double panneau original/résultat + toolbar
│       ├── ImageUpload.jsx        ← Dropzone drag & drop
│       ├── HistogramPanel.jsx     ← Histogramme / cumulé / égalisé
│       ├── AdjustmentsPanel.jsx   ← Luminosité / Contraste / Luminance
│       └── SidebarPrimitives.jsx  ← Composants réutilisables (Slider, Select, Toggle…)
├── context/
│   ├── AuthContext.jsx            ← User session (login / register / logout)
│   └── ImageContext.jsx           ← État global image (original, résultat, historique)
├── pages/
│   ├── FeaturePage.jsx            ← Layout partagé (viewer + panels du bas)
│   ├── FeaturePages.jsx           ← NoisePage / ConvolutionPage / BlurPage / EdgePage
│   └── HistoryPage.jsx            ← Galerie des images traitées
├── services/
│   └── api.js                     ← Tous les appels backend (authService, noiseService…)
├── App.jsx                        ← Routes principales
└── index.css                      ← Styles globaux + CSS vars
```

## Appels backend (services/api.js)

| Service              | Méthode              | Endpoint                     |
|---------------------|----------------------|------------------------------|
| authService.login    | POST                 | /auth/login                  |
| authService.register | POST                 | /auth/register               |
| imageService.upload  | POST multipart       | /images/upload               |
| noiseService.addNoise| POST                 | /noise/apply                 |
| noiseService.applyFilter| POST              | /noise/filter                |
| noiseService.metrics | POST                 | /noise/metrics               |
| convolutionService.convolve | POST         | /convolution/apply           |
| convolutionService.deconvolve | POST       | /convolution/deconvolve      |
| blurService.applyBlur| POST                | /blur/apply                  |
| edgeService.detectEdges| POST              | /edges/detect                |
| adjustmentService.adjust | POST            | /adjust/bcl                  |
| histogramService.get | GET                  | /histogram/:id               |
| histogramService.equalize | POST          | /histogram/equalize          |
| geometryService.rotate | POST             | /geometry/rotate             |
| geometryService.crop  | POST              | /geometry/crop               |

## Design

- Fond sombre `#0b0f1a` avec particules animées canvas (connexions dynamiques)
- Glassmorphism sur toutes les cartes
- Palette brand bleue `#2979ff`
- Police display: **Syne** · Corps: **DM Sans** · Mono: **JetBrains Mono**
- Double panneau image (original gauche / résultat droite) en temps réel
