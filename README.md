# Image Lab - Traitement d'Images

Application web pour le traitement et l'analyse d'images avec un backend FastAPI et un frontend React.

## 📋 Prérequis

- **Python 3.8+**
- **Node.js 16+**
- **npm** (inclus avec Node.js)
- **Git**

---

## 🚀 Installation et Démarrage

### **1️⃣ Backend - Python (FastAPI)**

#### Créer et activer l'environnement virtuel

```bash
# Naviguez au dossier backend
cd back

# Créer l'environnement virtuel nommé 'image'
python -m venv image

# Activer l'environnement (Windows - PowerShell)
.\image\Scripts\Activate

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

**Vérification:** Allez sur `http://localhost:8000/docs` pour voir la documentation Swagger

---

### **2️⃣ Frontend - React**

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

## ⚙️ Configuration Backend

Avant de lancer le backend, assurez-vous que le fichier `.env` est configuré:

```bash
# Dans le dossier 'back', créez un fichier .env avec:
SECRET_KEY=votre_cle_secrete_ici
DATABASE_URL=postgresql://user:password@localhost:5432/imagelab
SUPABASE_URL=votre_url_supabase
SUPABASE_KEY=votre_cle_supabase
```

---

## 📁 Structure du Projet

```
projet_traitement_image/
├── back/                          # Backend FastAPI
│   ├── image/                     # Environnement virtuel Python
│   ├── requirements.txt           # Dépendances Python
│   ├── main.py                    # Application principale
│   ├── routers/                   # Routes API
│   ├── services/                  # Logique métier
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

## 🔧 Commandes Utiles

### Backend

```bash
# Activer l'environnement
cd back
.\image\Scripts\Activate

# Installer les dépendances
pip install -r requirements.txt

# Lancer le serveur
uvicorn main:app --reload

# Désactiver l'environnement
deactivate
```

### Frontend

```bash
# Installer les dépendances
cd image-lab
npm install

# Lancer le serveur (développement)
npm start

# Construire pour la production
npm run build
```

---

## 🌐 Accès à l'Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs (Swagger):** http://localhost:8000/docs

---

## 📝 Fonctionnalités Principales

- ✅ Traitement de bruits (gaussien, speckle, poivre & sel)
- ✅ Détection de contours (Sobel, Canny, Laplacien, etc.)
- ✅ Filtrage et restauration d'images
- ✅ Convolution et déconvolution
- ✅ Histogrammes et égalisation
- ✅ Ajustement de luminosité et contraste
- ✅ Gestion d'utilisateurs avec authentification
- ✅ Historique des images traitées

---

## 🐛 Dépannage

### Le backend ne démarre pas

```bash
# Vérifier que l'env est activé
# Vérifier les requirements
pip install -r requirements.txt --upgrade

# Vérifier les variables d'environnement
echo $env:SECRET_KEY  # PowerShell
```

### Le frontend ne se lance pas

```bash
# Nettoyer et réinstaller
rm -r node_modules
npm install
npm start
```

### Port déjà utilisé

```bash
# Backend sur un autre port
uvicorn main:app --reload --port 8001

# Frontend sur un autre port
PORT=3001 npm start
```

---

## 📚 Documentation

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [React Docs](https://react.dev/)
- [OpenCV Python](https://docs.opencv.org/master/index.html)

---

## 👤 Auteur

Projet de traitement d'images - 2026

---

## 📄 Licence

MIT License
