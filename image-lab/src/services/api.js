import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  // headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token
api.interceptors.request.use(config => {
  const user = localStorage.getItem('imagelab_user');
  if (user) {
    const token = JSON.parse(user).token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─────────── Auth ───────────
export const authService = {
  login:    (email, password)       => api.post('/users/login',    { email: email, password: password }),
  register: (name, email, password) => api.post('/users/add',      { nom: name, email:email, password:password }),
  profile:  ()                      => api.get('/users/me'),
};

// ─────────── Image upload ───────────
export const imageService = {
  /**
   * Upload an image file. Returns { image_id, url, width, height }
   */
  upload: (file) => {
    const form = new FormData();
    form.append('image', file);
    return api.post('/images/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  /** List user's image history */
  history: (page = 1, limit = 20) => api.get('/images/history', { params: { page, limit } }),
  /** Delete an image by id */
  delete: (imageId) => api.delete(`/images/${imageId}`),
};

// ─────────── Noise & Filter ───────────
export const noiseService = {
  /**
   * Add noise to an image
   * @param {string} imageId
   * @param {'uniform'|'gaussian'|'salt_pepper'|'speckle'} type
   * @param {object} params  e.g. { kernel: 3, intensity: 0.05 }
   */
  addNoise: (imageId, type, params) =>
    api.post('/noise/apply', { image_id: imageId, noise_type: type, params }),

  /**
   * Apply a restoration filter
   * @param {string} imageId  (noisy image id)
   * @param {'mean'|'median'|'gaussian_lpf'|'butterworth'|'wiener'|'high_pass'} filterType
   * @param {object} params
   */
  applyFilter: (imageId, filterType, params) =>
    api.post('/noise/filter', { image_id: imageId, filter_type: filterType, params }),

  /**
   * Compute quality metrics between two images
   * @returns { snr, psnr, ssim }
   */
  metrics: (originalId, noisyId) =>
    api.post('/noise/metrics', { original_id: originalId, noisy_id: noisyId }),
};

// ─────────── Convolution / Deconvolution ───────────
export const convolutionService = {

  convolve: (imageBase64, kernelSize) =>
    api.post('/convolution/apply', { image: imageBase64, kernel_size: kernelSize }),

  deconvolve: (imageBase64, kernelSize) =>
    api.post('/convolution/deconvolve', { image: imageBase64, kernel_size: kernelSize }),

};

// ─────────── Blur ───────────
export const blurService = {
  /**
   * Flou moyen (Box Blur)
   * @param {File} file
   * @param {{ kernel_size: number, normalize: boolean, border_mode: string }} params
   */
  applyAverage: (file, params = {}) => {
    const form = new FormData();
    form.append('file', file);
    form.append('kernel_size', params.kernel_size ?? 3);
    form.append('normalize',   params.normalize   ?? true);
    form.append('border_mode', params.border_mode ?? 'reflect');
    return api.post('/process/blur/average', form, {
      headers:      { 'Content-Type': 'multipart/form-data' },
      responseType: 'blob',
    });
  },

  /**
   * Flou gaussien
   * @param {File} file
   * @param {{ kernel_size: number, sigma_x: number, sigma_y: number, border_mode: string }} params
   */
  applyGaussian: (file, params = {}) => {
    const form = new FormData();
    form.append('file',        file);
    form.append('kernel_size', params.kernel_size ?? 5);
    form.append('sigma_x',     params.sigma_x     ?? 1.0);
    form.append('sigma_y',     params.sigma_y     ?? 0);
    form.append('border_mode', params.border_mode ?? 'reflect');
    return api.post('/process/blur/gaussian', form, {
      headers:      { 'Content-Type': 'multipart/form-data' },
      responseType: 'blob',
    });
  },

  /**
   * Flou de mouvement
   * @param {File} file
   * @param {{ kernel_size: number, angle: number, intensity: number, border_mode: string }} params
   */
  applyMotion: (file, params = {}) => {
    const form = new FormData();
    form.append('file',        file);
    form.append('kernel_size', params.kernel_size ?? 15);
    form.append('angle',       params.angle       ?? 0);
    form.append('intensity',   params.intensity   ?? 1.0);
    form.append('border_mode', params.border_mode ?? 'reflect');
    return api.post('/process/blur/motion', form, {
      headers:      { 'Content-Type': 'multipart/form-data' },
      responseType: 'blob',
    });
  },

  /**
   * Flou personnalisé (noyau custom)
   * @param {File}      file
   * @param {number[][]} kernel     - matrice NxN (N impair, 3 ≤ N ≤ 9)
   * @param {{ normalize: boolean, border_mode: string, depth: number }} params
   */
  applyCustom: (file, kernel, params = {}) => {
    const form = new FormData();
    form.append('file',        file);
    form.append('kernel',      JSON.stringify(kernel));
    form.append('normalize',   params.normalize   ?? true);
    form.append('border_mode', params.border_mode ?? 'reflect');
    form.append('depth',       params.depth       ?? -1);
    return api.post('/process/blur/custom', form, {
      headers:      { 'Content-Type': 'multipart/form-data' },
      responseType: 'blob',
    });
  },
};
// ─────────── Edge ───────────

export const edgeService = {
  /**
   * Sends the image file + params as FormData to the correct endpoint.
   *
   * @param {string}   method    - e.g. 'sobel', 'canny', 'laplacien'
   * @param {FormData} formData  - must contain 'file' + any extra params
   * @returns {Promise<{ data: { image: string } }>}  base64 PNG
   */
  detectEdges: (method, formData) =>
    api.post(`/edges/${method}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ─────────── Adjustments ───────────
export const adjustmentService = {
  /** brightness: -100..100, contrast: -100..100, luminosity: -100..100 */
  adjust: (imageUrl, brightness, contrast, luminosity) =>
    api.post('/adjust/bcl', { image_url: imageUrl, brightness, contrast, luminosity }),
};

// ─────────── Histogram ───────────
export const histogramService = {

  getHistoFromImage: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/histogram/", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  },

  cumulativeFromImage: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/histogram/cumulative", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  },

  equalizeFromImage: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/histogram/equalize", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  },

  rotateImage: (file, angle) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("angle", angle); 
    return api.post("/histogram/rotate", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      responseType: "blob",
    });
  },
  

  cropImage: (file, cropData) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("x", cropData.x);
    formData.append("y", cropData.y);
    formData.append("width", cropData.width);
    formData.append("height", cropData.height);
    return api.post("/histogram/crop", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      responseType: "blob",
    });
  }
};


// ─────────── Geometry ───────────
export const geometryService = {
  /** angle in degrees */
  rotate: (imageId, angle) =>
    api.post('/geometry/rotate', { image_id: imageId, angle }),

  /** x, y, width, height in pixels */
  crop: (imageId, x, y, width, height) =>
    api.post('/geometry/crop', { image_id: imageId, x, y, width, height }),

  resize: (imageId, width, height) =>
    api.post('/geometry/resize', { image_id: imageId, width, height }),
};

// services/api.js  — SECTION À AJOUTER/REMPLACER

// ─────────── History ───────────
export const historyService = {

  /**
   * Upload l'image originale et crée une entrée historique.
   * Remplace votre imageService.upload() existant.
   * Retourne une entrée HistoryOut (avec id, original_url, etc.)
   */
  upload: (file, width, height) => {
    const form = new FormData();
    form.append('file', file);
    if (width)  form.append('width',  width);
    if (height) form.append('height', height);
    return api.post('/history/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  /**
   * Sauvegarde le résultat après un traitement.
   * Appelé par chaque NoiseSidebar / BlurSidebar / etc. après avoir reçu l'image traitée.
   *
   * @param {string} historyId   - id retourné par historyService.upload()
   * @param {Blob}   resultBlob  - image résultante en Blob
   * @param {string} feature     - "noise" | "blur" | "edge" | "convolution"
   * @param {object} params      - paramètres du traitement (objet JS)
   */
  saveResult: (historyId, resultBlob, feature, params = {}) => {
    const form = new FormData();
    form.append('result_file', resultBlob, `result_${historyId}.png`);
    form.append('feature', feature);
    form.append('params', JSON.stringify(params));
    return api.patch(`/history/${historyId}/result`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  /**
   * Récupère l'historique paginé de l'utilisateur connecté.
   * Retourne { images: [], total, page, limit }
   */
  list: (page = 1, limit = 20) =>
    api.get('/history', { params: { page, limit } }),

  /**
   * Récupère une entrée spécifique.
   */
  get: (historyId) =>
    api.get(`/history/${historyId}`),

  /**
   * Supprime une entrée + ses fichiers Supabase.
   */
  delete: (historyId) =>
    api.delete(`/history/${historyId}`),
};

export default api;