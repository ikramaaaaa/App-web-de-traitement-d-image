import numpy as np
import cv2
from PIL import Image
import io, base64
from skimage.metrics import peak_signal_noise_ratio as psnr
from skimage.metrics import structural_similarity as ssim

# Fonctions utilitaires pour lire et encoder les images

def _read_image(file_bytes):
    img = np.array(Image.open(io.BytesIO(file_bytes)).convert("RGB"))
    return img
 
def _encode_image(img_array):
    img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
    _, buffer = cv2.imencode('.png', img_bgr)
    return base64.b64encode(buffer).decode('utf-8')
 
# Ajouter différents types de bruits à une image

def apply_noise(img_bytes, noise_type: str, intensity: int):
    img = _read_image(img_bytes)
 
    # Bruit gaussien: valeurs aléatoires normales ajoutées à l'image
    if noise_type in ["gaussien", "additif"]:
        noise = np.random.normal(0, intensity, img.shape).astype(np.float32)
        noisy = np.clip(img.astype(np.float32) + noise, 0, 255).astype(np.uint8)
 
    # Bruit speckle: valeurs aléatoires multipliées avec l'image
    elif noise_type in ["speckle", "multiplicatif"]:
        noise = np.random.randn(*img.shape).astype(np.float32)
        coeff = intensity / 100.0
        noisy = np.clip(img + img * noise * coeff, 0, 255).astype(np.uint8)
 
    # Bruit poivre et sel: pixels aléatoires deviennent noirs (0) ou blancs (255)
    elif noise_type == "poivre_sel":
        noisy = img.copy()
        prob  = intensity / 100.0
        rnd   = np.random.random(img.shape[:2])
        noisy[rnd < prob / 2]     = 0    # poivre (noir)
        noisy[rnd > 1 - prob / 2] = 255  # sel (blanc)
 
    else:
        noisy = img
 
    # Calculer les métriques de qualité PSNR et SSIM
    psnr_val = round(psnr(img, noisy, data_range=255), 2)
    ssim_val = round(ssim(img, noisy, channel_axis=2, data_range=255), 4)
 
    return {
        "image": f"data:image/png;base64,{_encode_image(noisy)}",
        "psnr":  psnr_val,
        "ssim":  ssim_val,
        "stage": "bruit"
    }
 
# Restaurer une image bruitée en utilisant différents filtres

def apply_filter(original_bytes, noisy_bytes, filter_type: str, kernel_size: int = 3):
    original = _read_image(original_bytes)
    noisy    = _read_image(noisy_bytes)
 
    # S'assurer que kernel_size est impair (c'est requis par OpenCV)
    k = kernel_size if kernel_size % 2 == 1 else kernel_size + 1
 
    # Filtre moyenne: passe-bas qui lisse l'image
    if filter_type == "moyenne":
        restored = cv2.blur(noisy, (k, k))
 
    # Filtre gaussien: passe-bas avec pondération gaussienne
    elif filter_type == "gaussien":
        restored = cv2.GaussianBlur(noisy, (k, k), 0)
 
    # Filtre binomial: cas particulier du filtre gaussien
    elif filter_type == "binomial":
        restored = cv2.GaussianBlur(noisy, (k, k), 0.85)
 
    # Filtre médian: remplace chaque pixel par la médiane de ses voisins
    elif filter_type == "median":
        restored = cv2.medianBlur(noisy, k)
 

 
    else:
        restored = noisy
 
    # Calculer les métriques de qualité de la restauration
    psnr_val = round(psnr(original, restored, data_range=255), 2)
    ssim_val = round(ssim(original, restored, channel_axis=2, data_range=255), 4)
 
    return {
        "image": f"data:image/png;base64,{_encode_image(restored)}",
        "psnr":  psnr_val,
        "ssim":  ssim_val,
        "stage": "restauration"
    }