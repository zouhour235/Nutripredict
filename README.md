# NutriPredict

**Système de diagnostic prédictif des carences nutritionnelles par intelligence artificielle dans les zones rurales à faibles ressources**

Projet de fin d'études — Licence en Informatique, ENASTIC (N'Djaména, Tchad), année universitaire 2025–2026.
Réalisé par **Zara Abdeldjelil Haroun**, sous la direction du **Dr Mouaz Mikail**.

> ⚠️ **Avertissement** : NutriPredict est un **prototype de recherche**. Il fournit une **aide au pré-dépistage** et oriente vers un professionnel de santé. Il ne pose pas de diagnostic médical, ne prescrit aucun traitement et n'a fait l'objet d'aucune validation clinique.

---

## Présentation

Au Tchad, plus de 70 % de la population vit en zone rurale, loin des laboratoires d'analyses. Les carences en micronutriments (fer, vitamine A, iode, zinc, acide folique, vitamine D, calcium) y passent souvent inaperçues.

NutriPredict est une application mobile qui aide un agent de santé communautaire à repérer une carence probable à partir de trois sources de données, chacune utilisable seule :

| Module | Données d'entrée | Modèle |
|---|---|---|
| Symptômes | Questionnaire de symptômes cliniques | Random Forest |
| Biologie | Hémoglobine, ferritine, zinc… (valeurs manquantes imputées) | Régression logistique |
| Image | Photo de la conjonctive, de la peau ou des ongles | CNN MobileNetV2 (transfer learning) |

Chaque résultat indique la carence probable, un niveau de confiance et des recommandations fondées sur des aliments disponibles localement.

## Architecture

Architecture client-serveur à trois couches :

```
Application mobile (React Native)  ──HTTPS──▶  API REST (FastAPI)  ──SQL──▶  PostgreSQL
                                               ├─ Validation (Pydantic)
                                               ├─ Imputation (médiane / MICE)
                                               └─ Modèles RF · LR · CNN
```

## Technologies

- **Backend** : Python 3.12, FastAPI, Uvicorn, Pydantic, PostgreSQL (psycopg2)
- **Intelligence artificielle** : scikit-learn, TensorFlow / Keras, Pandas, NumPy, imbalanced-learn (SMOTE)
- **Sécurité et rapports** : bcrypt, JWT (python-jose), ReportLab, Matplotlib, Plotly, Pillow
- **Application mobile** : React Native (Android)
- **Entraînement** : Google Colab (Random Forest, régression logistique), Kaggle (CNN)
- **Tests** : pytest, HTTPX, Locust, Swagger UI

## Structure du dépôt

```
NutriPredict/
├── backend/
│   ├── main.py                      # point d'entrée de l'API FastAPI
│   ├── security.py                  # mots de passe (bcrypt) et jetons JWT
│   ├── routes/                      # routes de l'API (authentification, diagnostic, administration)
│   ├── database/                    # connexion PostgreSQL
│   ├── modeles_ia.py                # chargement et prédiction des modèles
│   ├── modele_cnn.py                # réseau convolutif MobileNetV2
│   ├── pretraitement_donnees.py     # nettoyage, imputation, normalisation
│   ├── entrainer_modeles_v2.py      # entraînement et évaluation des modèles
│   ├── rapports_evaluation_v2/      # métriques et rapports d'évaluation
│   ├── models/                      # modèles entraînés (.pkl, .joblib, .h5)
│   └── requirements.txt
└── frontend/
    └── NutriPredictApp/             # application mobile React Native (Android)
```

## Installation

### Prérequis
- Python 3.12, Node.js et npm, PostgreSQL, Android Studio (émulateur)

### 1. Base de données
```bash
sudo apt install postgresql -y
sudo -u postgres psql -c "CREATE DATABASE nutrition_db;"
```

### 2. Backend
```bash
cd nutrition_app/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # puis renseigner les variables (voir ci-dessous)
uvicorn main:app --reload
```
La documentation interactive de l'API est alors disponible sur http://localhost:8000/docs (Swagger UI).

### 3. Application mobile
```bash
cd nutrition_app/frontend
npm install
npx react-native run-android
```

### Variables d'environnement (`.env`)
```
DATABASE_URL=postgresql://utilisateur:mot_de_passe@localhost:5432/nutrition_db
JWT_SECRET=une_longue_chaine_aleatoire
```
Le fichier `.env` n'est **jamais** publié sur GitHub.

## Données

Les modèles ont été entraînés sur des jeux de données publics. Ils ne sont **pas redistribués dans ce dépôt** : téléchargez-les depuis leur source, dans le respect de leur licence.

| Module | Jeu de données | Source |
|---|---|---|
| Symptômes | Nutritional Dataset for Deficiency | Kaggle |
| Biologie | Anemia Types Classification ; AnaDetect | Kaggle ; *Data in Brief* (2024) |
| Image | DermNet (signes cutanés) ; AneRBC | Kaggle ; *Database* (Oxford, 2024) |

Les rapports de l'OMS, de la FAO, de l'UNICEF et l'enquête SMART 2024 ont servi de références pour les seuils et le contexte.

## Résultats (jeu de test, 20 % des données)

| Modèle | Module | Accuracy | F1 macro |
|---|---|---|---|
| Random Forest | Symptômes | 72,25 % | 0,72 |
| CNN MobileNetV2 | Images | 70,51 % | 0,72 |
| Régression logistique | Biologie | 67,50 % | 0,67 |

Ces résultats, obtenus sur des données internationales, ne constituent pas une validation clinique.

## Limites et perspectives

- Performances encore inférieures à la cible de 80 %
- Données d'entraînement non tchadiennes ; collecte locale prévue (500 à 1 000 patients)
- Interface en français uniquement ; arabe tchadien et sara prévus
- Mode hors ligne (TensorFlow Lite / ONNX) et validation clinique à venir

## Auteure

**Zara Abdeldjelil Haroun** — Licence 3 Informatique, ENASTIC
Encadrant : **Dr Mouaz Mikail**

## Licence

Code publié sous licence MIT (voir le fichier `LICENSE`). Les jeux de données restent soumis à leurs licences respectives.
