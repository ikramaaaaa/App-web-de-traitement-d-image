# TswirTi - Traitement d'Images

Application web pour le traitement et l'analyse d'images avec un backend FastAPI et un frontend React.

## Prérequis

- **Python 3.8+**
- **Node.js 16+**
- **npm** (inclus avec Node.js)

---

##  Installation et Démarrage

### **1️ Backend - Python (FastAPI)**

#### Créer et activer l'environnement virtuel

```bash
# Naviguez au dossier backend
cd back

# Créer l'environnement virtuel nommé 'image'
python -m venv image

# Activer l'environnement (Windows - PowerShell)
.\image\Scripts\Activate
```
```bash

# Activer l'environnement (Windows - Command Prompt)
image\Scripts\activate.bat

# Activer l'environnement (macOS/Linux)
source image/bin/activate
```

#### Installer les dépendances

```bash
# S'assurer que vous êtes dans le dossier 'back' et l'env est activé
pip install -r requirements.txt
```

#### Lancer le serveur backend

```bash
# Le serveur démarre sur http://localhost:8000
uvicorn main:app --reload
```

**Vérification:** Allez sur `http://localhost:8000/`, si vous trouvez : {"message":"API running"} donc tout est bien.

---

### **2️ Frontend - React**

#### Installer les dépendances

```bash
# Naviguez au dossier frontend
cd image-lab

# Installer les packages
npm install
```

#### Lancer le serveur frontend

```bash
# Le serveur démarre sur http://localhost:3000
npm start
```

**Remarque:** Le navigateur s'ouvrira automatiquement. Si ce n'est pas le cas, allez sur `http://localhost:3000`

---


##  Structure du Projet

```
projet_traitement_image/
├── back/                          # Backend FastAPI
│   ├── image/                     # Environnement virtuel Python
│   ├── requirements.txt           # Dépendances Python
│   ├── main.py                    # Application principale
│   ├── routers/                   # Routes API
│   ├── services/                  # Logique métier et fonctions de traitement
│   ├── models.py                  # Modèles SQLAlchemy
│   └── ...
│
├── image-lab/                     # Frontend React
│   ├── node_modules/              # Dépendances npm
│   ├── package.json               # Configuration npm
│   ├── src/
│   │   ├── components/            # Composants React
│   │   ├── pages/                 # Pages
│   │   ├── services/              # Services API
│   │   ├── context/               # Context React
│   │   └── App.jsx
│   └── ...
│
└── README.md                      # Ce fichier
```



---

##  Fonctionnalités Principales

-  Traitement de bruits (gaussien, speckle, poivre & sel)
-  Détection de contours (Sobel, Canny, Laplacien, etc.)
-  Filtrage et restauration d'images
-  Convolution et déconvolution
-  Histogrammes et égalisation
-  Ajustement de luminosité et contraste
-  Gestion d'utilisateurs avec authentification
-  Historique des images traitées
-  Zoom in, zoom out et crop

---


## Le projet est réalisé par :

- KHAYATI Meryem
- ERREGUIG Halima
- ALAMI OURIAGLI Omayma
- KARFI Aya
- BELHIMER Ikram
- ACHTOUK Fatine

---

