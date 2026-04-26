import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('imagelab_user');
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);


const login = async (email, password) => {
  try {
    // 1. Authentification
    const res = await authService.login(email, password);

    const token = res?.data?.access_token;
    if (!token) {
      throw new Error("Token non reçu");
    }

    // IMPORTANT : stocker le token AVANT profile()
    localStorage.setItem('imagelab_user', JSON.stringify({ token }));

    // 2. Récupérer les infos utilisateur
    const meRes = await authService.profile();

    const user = {
      ...meRes.data,
      token
    };

    // 3. Stockage final
    setUser(user);
    localStorage.setItem('imagelab_user', JSON.stringify(user));

    return user;

  } catch (error) {
    console.error("Erreur lors du login :", error);

    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }

    throw new Error("Email ou mot de passe incorrect");
  }
};

  // const login = async (email, password) => {
  //   const res = await authService.login(email, password);
  //   // ton backend retourne { access_token, token_type }
  //   const token = res.data.access_token;

  //   // récupérer les infos user
  //   const meRes = await api.get('/users/me', {
  //     headers: { Authorization: `Bearer ${token}` }
  //   });
  //   const user = { ...meRes.data, token };

  //   setUser(user);
  //   localStorage.setItem('imagelab_user', JSON.stringify(user));
  //   return user;
  // };

  // const register = async (name, email, password) => {
  //   // créer le compte
  //   await authService.register(name, email, password);
  //   // puis connecter directement
  //   // return login(email, password);
  // };

  const register = async (name, email, password) => {
  try {
    // Création du compte
    const response = await authService.register(name, email, password);

    // Optionnel : auto-login après inscription
    // const loginResponse = await login(email, password);
    console.log(response)

    return response;

  } catch (error) {
    console.error("Erreur lors de l'inscription :", error);

    // Gestion propre du message d'erreur backend
    if (error.response && error.response.data) {
      throw new Error(error.response.data.detail || "Erreur lors de l'inscription");
    }

    throw new Error("Erreur serveur");
  }
};

  const logout = () => {
    setUser(null);
    localStorage.removeItem('imagelab_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
