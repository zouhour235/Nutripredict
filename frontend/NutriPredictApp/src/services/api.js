import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================
// CONFIGURATION DE L'API
// ============================================================

// Adresse configurable pour l'émulateur et le téléphone Android.
// Modifier cette valeur selon l'appareil utilisé.
// Émulateur Android : http://10.0.2.2:8000
// Téléphone Android : http://192.168.100.54:8000
// Adapter cette adresse à l'appareil utilisé.
const API_URL = 'http://10.0.2.2:8000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Envoyer uniquement le jeton correspondant au mode actif.
api.interceptors.request.use(async config => {
  const mode = await AsyncStorage.getItem('nutripredict_mode');
  config.headers = config.headers || {};

  delete config.headers.Authorization;
  delete config.headers['X-Anonyme-Token'];

  if (mode === 'compte') {
    const jeton = await AsyncStorage.getItem('nutripredict_access_token');
    if (jeton) config.headers.Authorization = `Bearer ${jeton}`;
  } else if (mode === 'anonyme') {
    const jeton = await AsyncStorage.getItem('nutripredict_jeton_anonyme');
    if (jeton) config.headers['X-Anonyme-Token'] = jeton;
  }

  return config;
});

// ============================================================
// SERVICES AUTHENTIFICATION
// ============================================================

export const inscription = async (donnees) => {
  const reponse = await api.post('/auth/inscription', donnees);
  return reponse.data;
};

export const connexion = async (donnees) => {
  const reponse = await api.post('/auth/connexion', donnees);
  return reponse.data;
};

// ============================================================
// SERVICES DIAGNOSTIC
// ============================================================

export const diagnosticSymptomes = async (donnees) => {
  const reponse = await api.post('/diagnostic/symptomes', donnees);
  return reponse.data;
};

export const diagnosticBiologique = async (donnees) => {
  const reponse = await api.post('/diagnostic/biologique', donnees);
  return reponse.data;
};

export const historiquePatient = async (patientId) => {
  const reponse = await api.get(`/diagnostic/historique/${patientId}`);
  return reponse.data;
};

// Historique de l'utilisateur connecté.
export const historiqueUtilisateur = async (utilisateurId) => {
  const reponse = await api.get(
    `/diagnostic/historique-utilisateur/${utilisateurId}`,
  );
  return reponse.data;
};

// Suppression d'un diagnostic précis.
export const supprimerDiagnostic = async (patientId, diagnosticId) => {
  const reponse = await api.delete(
    `/diagnostic/historique/${patientId}/${diagnosticId}`,
  );
  return reponse.data;
};

// ============================================================
// SERVICES ADMINISTRATION
// ============================================================

export const tableauDeBord = async () => {
  const reponse = await api.get('/admin/tableau-de-bord');
  return reponse.data;
};

export default api;