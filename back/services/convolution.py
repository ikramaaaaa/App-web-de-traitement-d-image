import cv2
import numpy as np
import base64


def _to_data_url(img: np.ndarray) -> str:
    img = np.clip(img, 0, 255).astype(np.uint8)
    _, buf = cv2.imencode('.png', img)
    b64 = base64.b64encode(buf).decode()
    return f"data:image/png;base64,{b64}"


def _decode_base64_image(image_base64: str) -> np.ndarray:
    if ',' in image_base64:
        image_base64 = image_base64.split(',')[1]
    img_bytes = base64.b64decode(image_base64)
    nparr = np.frombuffer(img_bytes, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)


def apply_convolution(image_base64: str, kernel_size: int) -> str:

    img = _decode_base64_image(image_base64)
    
    # Créer un noyau de convolution avec des 1
    kernel = np.ones((kernel_size, kernel_size), dtype=np.float32)
    # Normaliser le noyau pour que la somme fasse 1
    kernel = kernel / (kernel_size * kernel_size)

    # Appliquer la convolution à l'image
    result = cv2.filter2D(img, -1, kernel)
    return _to_data_url(result)


def apply_deconvolution(image_base64: str, kernel_size: int) -> str:
    
    # Lire l'image et la normaliser entre 0 et 1
    img = _decode_base64_image(image_base64).astype(np.float64) / 255.0

    h, w = img.shape[:2]
    epsilon = 1e-3

    # Créer le noyau de flou (même noyau que pour la convolution)
    psf = np.ones((kernel_size, kernel_size), dtype=np.float64)
    psf = psf / (kernel_size * kernel_size)

    # Traiter chaque canal de couleur séparément (R, G, B)
    channels = []
    for c in range(3):
        # Transformer l'image et le PSF dans le domaine fréquentiel
        G = np.fft.fft2(img[:, :, c])
        H = np.fft.fft2(psf, s=(h, w))

        # Appliquer le filtre de Wiener (simple) pour inverser le flou
        H_conj = np.conj(H)
        K = 0.01
        F_est = (H_conj / (np.abs(H)**2 + K)) * G
        # Transformer le résultat inverse dans le domaine spatial
        f_rec = np.real(np.fft.ifft2(F_est))
        channels.append(f_rec)

    # Combiner les trois canaux de couleur
    result = np.stack(channels, axis=2)
    result = np.clip(result * 255, 0, 255)
    return _to_data_url(result)