import cv2
import numpy as np
import base64



def brightness(image_bytes, alpha):
    # Décoder l'image en couleur et la convertir en float32 pour les calculs
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR).astype(np.float32)

    # Obtenir les dimensions (hauteur, largeur, canaux)
    M, N, _ = img.shape

    # Calculer la luminosité moyenne en tenant compte des 3 canaux
    Br = np.sum(img) / (M * N * 3)

    # Ajuster la luminosité
    result = img + alpha * Br
    result = np.clip(result, 0, 255).astype(np.uint8)

    # Encoder l'image en PNG et la convertir en base64
    _, buffer = cv2.imencode('.png', result)
    b64 = base64.b64encode(buffer).decode()
    return f"data:image/png;base64,{b64}"


def contrast(image_bytes, C0):
    # Décoder l'image en couleur et la convertir en float32
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR).astype(np.float32)

    # Trouver les valeurs min et max de l'image
    Min = np.min(img)
    Max = np.max(img)

    # Si l'image a une seule valeur, la retourner telle quelle
    if Max == Min:
        _, buffer = cv2.imencode('.png', img.astype(np.uint8))
        b64 = base64.b64encode(buffer).decode()
        return f"data:image/png;base64,{b64}"

    # Normaliser l'image entre 0 et 1
    y = (img - Min) / (Max - Min)
    # Appliquer le facteur de contraste
    result = C0 * y * 255
    result = np.clip(result, 0, 255).astype(np.uint8)

    # Encoder l'image en PNG et la convertir en base64
    _, buffer = cv2.imencode('.png', result)
    b64 = base64.b64encode(buffer).decode()
    return f"data:image/png;base64,{b64}"