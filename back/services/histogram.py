import cv2
import numpy as np


def histogram(image_bytes):

    # Convertir les bytes en image OpenCV
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Convertir en niveaux de gris pour l'histogramme
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Calculer l'histogramme en niveaux de gris
    hist_gray = cv2.calcHist([gray], [0], None, [256], [0,256])
    hist_gray = hist_gray.flatten().tolist()

    # Calculer les histogrammes pour chaque canal RGB
    hist_r = cv2.calcHist([img], [2], None, [256], [0,256]).flatten().tolist()
    hist_g = cv2.calcHist([img], [1], None, [256], [0,256]).flatten().tolist()
    hist_b = cv2.calcHist([img], [0], None, [256], [0,256]).flatten().tolist()

    return {
        "gray": hist_gray,
        "r": hist_r,
        "g": hist_g,
        "b": hist_b
    }


def cumulative_histogram(image_bytes):
    """
    Calcule l'histogramme cumulé pour voir la distribution cumulée des niveaux de gris.
    """
    # Récupérer l'histogramme normal en niveaux de gris
    hist = histogram(image_bytes)['gray']
    # Convertir en tableau NumPy et calculer la somme cumulative
    hist_array = np.array(hist, dtype=np.int64)
    cumulative = np.cumsum(hist_array)
    return cumulative.tolist()




def equalize_histogram(image_bytes):
    # Décoder l'image en niveaux de gris
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)

    # Appliquer l'égalisation d'histogramme pour améliorer le contraste
    eq = cv2.equalizeHist(img)

    # Calculer l'histogramme de l'image égalisée
    hist = cv2.calcHist([eq], [0], None, [256], [0,256]).flatten()

    return hist.tolist()




def rotate_image(image_bytes, angle):
    # Décoder l'image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Obtenir les dimensions de l'image
    h, w = img.shape[:2]
    center = (w // 2, h // 2)

    # Créer la matrice de rotation
    M = cv2.getRotationMatrix2D(center, angle, 1.0)

    # Calculer les nouvelles dimensions pour ne pas couper l'image
    cos = np.abs(M[0, 0])
    sin = np.abs(M[0, 1])

    new_w = int(h * sin + w * cos)
    new_h = int(h * cos + w * sin)

    # Ajuster la matrice pour centrer l'image dans les nouvelles dimensions
    M[0, 2] += (new_w / 2) - center[0]
    M[1, 2] += (new_h / 2) - center[1]

    # Appliquer la transformation avec les nouvelles dimensions
    rotated = cv2.warpAffine(img, M, (new_w, new_h))

    success, buffer = cv2.imencode(".png", rotated)
    return buffer.tobytes()


def imcrop_python(image_bytes, x, y, width, height):
    # Décoder l'image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Image invalide")

    # Obtenir les dimensions de l'image
    H, W = img.shape[:2]

    # Vérifier que les coordonnées sont valides
    x = max(0, min(x, W - 1))
    y = max(0, min(y, H - 1))
    width = max(1, min(width, W - x))
    height = max(1, min(height, H - y))

    cropped = img[y:y+height, x:x+width]

    success, buffer = cv2.imencode(".png", cropped)
    if not success:
        raise ValueError("Erreur encodage")

    return buffer.tobytes()