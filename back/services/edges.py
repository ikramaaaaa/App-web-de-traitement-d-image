import io
import base64
import numpy as np
import cv2
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from skimage.filters import threshold_otsu


# Fonctions utilitaires pour décoder et traiter les images

def _decode(image_bytes: bytes, grayscale: bool = True) -> np.ndarray:
    arr  = np.frombuffer(image_bytes, dtype=np.uint8)
    flag = cv2.IMREAD_GRAYSCALE if grayscale else cv2.IMREAD_COLOR
    img  = cv2.imdecode(arr, flag)
    if img is None:
        raise ValueError("Impossible de décoder l'image.")
    return img


def _fig_to_base64() -> str:
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', dpi=100)
    plt.close('all')
    buf.seek(0)
    return base64.b64encode(buf.read()).decode('utf-8')


def _single(img: np.ndarray, title: str) -> dict:
    success, buf = cv2.imencode(".png", img)
    if not success:
        raise ValueError("Echec encodage PNG")
    return {"image": base64.b64encode(buf.tobytes()).decode('utf-8')}


# Fonctions de détection des contours et des bords

def gradient_directionnel(image_bytes: bytes) -> dict:
    # Décoder l'image en niveaux de gris
    u = _decode(image_bytes, grayscale=True)

    # Créer les noyaux pour calculer les dérivées X et Y
    hx = np.array([[0, -1, 0], [0, 1, 0], [0, 0, 0]])
    hy = np.array(list(zip(*hx)))

    # Calculer les dérivées partielles
    dxu = cv2.filter2D(u, -1, hx)
    dyu = cv2.filter2D(u, -1, hy)
    # Calculer la magnitude du gradient
    ndu = np.sqrt(dxu.astype(float)**2 + dyu.astype(float)**2)

    return _single(ndu.astype(np.uint8), 'Gradient directionnel')


def roberts(image_bytes: bytes) -> dict:
    # Décoder l'image
    u = _decode(image_bytes, grayscale=True)

    # Noyaux de Roberts (détection des contours en diagonale)
    hox = np.array([[0, 0, 0], [0, 0, 1], [0, -1, 0]])
    hoy = np.array([[0, 0, 0], [0, -1, 0], [0, 0, 1]])

    # Appliquer les filtres
    dxu = cv2.filter2D(u, -1, hox)
    dyu = cv2.filter2D(u, -1, hoy)
    # Calculer la magnitude du gradient
    ndu = np.sqrt(dxu.astype(float)**2 + dyu.astype(float)**2)

    return _single(ndu.astype(np.uint8), 'Roberts')


def prewitt(image_bytes: bytes) -> dict:
    # Décoder l'image
    u = _decode(image_bytes, grayscale=True)

    # Noyaux de Prewitt normalisés par 3
    hx = np.array([[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]]) / 3
    hy = np.array([[-1, -1, -1], [0, 0, 0], [1, 1, 1]]) / 3

    # Appliquer les filtres
    dxu = cv2.filter2D(u, -1, hx)
    dyu = cv2.filter2D(u, -1, hy)
    # Calculer la magnitude du gradient
    ndu = np.sqrt(dxu.astype(float)**2 + dyu.astype(float)**2)

    return _single(ndu.astype(np.uint8), 'Prewitt')


def sobel(image_bytes: bytes) -> dict:
    # Décoder l'image
    u = _decode(image_bytes, grayscale=True)

    # Noyaux de Sobel avec pondération du centre (plus important)
    hsx = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]) / 4
    hsy = np.array([[-1, -2, -1], [0, 0, 0], [1, 2, 1]]) / 4

    # Appliquer les filtres
    dxu = cv2.filter2D(u, -1, hsx)
    dyu = cv2.filter2D(u, -1, hsy)
    # Calculer la magnitude du gradient
    ndu = np.sqrt(dxu.astype(float)**2 + dyu.astype(float)**2)

    return _single(ndu.astype(np.uint8), 'Sobel')


def laplacien(image_bytes: bytes, kernel: str = "4") -> dict:
    """
    Détecte les contours avec le Laplacien.
    kernel="4" : utilise la matrice de 4
    kernel="8" : utilise la matrice de 8
    """
    # Décoder l'image
    I = _decode(image_bytes, grayscale=True)

    # Choisir le noyau en fonction du paramètre
    if kernel == "8":
        D = np.array([[1, 1, 1], [1, -8, 1], [1, 1, 1]], dtype=np.float32)
        title = 'Laplacien 8'
    else:
        D = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]], dtype=np.float32)
        title = 'Laplacien 4'

    Ilap = cv2.filter2D(I, -1, D)
    return _single(Ilap, title)


def seuillage_gradient(image_bytes: bytes) -> dict:
    # Décoder et normaliser l'image
    u = _decode(image_bytes, grayscale=True)
    u = u.astype(np.float64) / 255.0

    # Noyaux de Sobel
    hx = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]) / 4
    hy = np.array([[-1, -2, -1], [0, 0, 0], [1, 2, 1]]) / 4

    # Calculer les dérivées partielles
    dxu = cv2.filter2D(u, -1, hx, borderType=cv2.BORDER_REPLICATE)
    dyu = cv2.filter2D(u, -1, hy, borderType=cv2.BORDER_REPLICATE)
    # Magnitude du gradient
    ndu = np.sqrt(dxu**2 + dyu**2)

    # Appliquer un seuil automatique (Otsu) pour détecter les contours
    seuil = threshold_otsu(ndu)
    Su    = ndu > seuil

    return _single(Su.astype(np.uint8) * 255, 'Seuillage du gradient')


def seuillage_laplacien(image_bytes: bytes) -> dict:
    # Décoder et normaliser l'image
    u = _decode(image_bytes, grayscale=True)
    u = u.astype(np.float64) / 255.0

    # Noyau Laplacien 4-voisins
    D  = np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]], dtype=np.float64)
    Du = cv2.filter2D(u, -1, D)

    # Utiliser le seuil d'Otsu pour trouver les contours positifs et négatifs
    eps   = threshold_otsu(Du)
    # Classer les pixels en trois catégories: positif, négatif, zéro
    v     = np.where(Du > eps, 1.0, np.where(Du < -eps, -1.0, 0.0))
    seuil = threshold_otsu(v)
    Su    = v > seuil

    return _single(Su.astype(np.uint8) * 255, 'Annulation du Laplacien')


def canny(image_bytes: bytes, threshold1: int = 100, threshold2: int = 200) -> dict:
    # Décoder l'image en couleur et la convertir en niveaux de gris
    img  = _decode(image_bytes, grayscale=False)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # Appliquer l'algorithme de Canny
    Bw   = cv2.Canny(gray, threshold1, threshold2)

    return _single(Bw, 'Canny Edge')


def lignes_contours(image_bytes: bytes, levels: int = 3) -> dict:
    # Décoder l'image
    u = _decode(image_bytes, grayscale=True)
    
    # Créer une image vide pour dessiner les contours
    result = np.zeros_like(u)
    # Calculer l'espacement entre les niveaux
    step = 256 // (levels + 1)
    
    # Pour chaque niveau d'intensité, extraire et dessiner les contours
    for i in range(1, levels + 1):
        # Créer une image binaire pour ce niveau
        thresh = i * step
        binary = ((u >= thresh - 8) & (u <= thresh + 8)).astype(np.uint8) * 255
        # Trouver et dessiner les contours
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(result, contours, -1, 255, 1)
    
    return _single(result, '')