import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import (accuracy_score, precision_score,
                             recall_score, f1_score)
import pickle

# ============================================================
# MODULE 1 — RANDOM FOREST (Symptômes nutritionnels)
# ============================================================

print("=" * 60)
print("MODULE 1 — RANDOM FOREST : Symptômes nutritionnels")
print("=" * 60)

df2 = pd.read_csv("data/dataset2_symptomes_traite.csv")

colonnes = ['Age', 'Taille_cm', 'Poids_kg', 'Apport_calorique',
            'Apport_vitamine_A', 'Apport_fer', 'Apport_calcium',
            'Sexe_code', 'Activite_code']

X = df2[colonnes]
y = df2['Diagnostic_code']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.30, random_state=42)

# Entraînement
print("\nEntraînement en cours...")
rf_modele = RandomForestClassifier(
    n_estimators=200,
    max_depth=20,
    min_samples_split=5,
    random_state=42
)
rf_modele.fit(X_train, y_train)

# Évaluation
y_pred = rf_modele.predict(X_test)

print(f"\nRésultats Random Forest :")
print(f"  Exactitude  : {accuracy_score(y_test, y_pred)*100:.2f}%")
print(f"  Précision   : {precision_score(y_test, y_pred, average='weighted')*100:.2f}%")
print(f"  Rappel      : {recall_score(y_test, y_pred, average='weighted')*100:.2f}%")
print(f"  Score F1    : {f1_score(y_test, y_pred, average='weighted')*100:.2f}%")

# Sauvegarde
with open("models/modele_random_forest.pkl", "wb") as f:
    pickle.dump(rf_modele, f)
print("\n✅ Modèle Random Forest sauvegardé !")

# ============================================================
# MODULE 2 — RÉGRESSION LOGISTIQUE AMÉLIORÉE
# ============================================================

print("\n" + "=" * 60)
print("MODULE 2 — RÉGRESSION LOGISTIQUE : Données biologiques")
print("=" * 60)

from imblearn.over_sampling import SMOTE
from sklearn.preprocessing import StandardScaler

df1 = pd.read_csv("data/dataset1_biologique_traite.csv")

colonnes_bio = ['WBC', 'LYMp', 'NEUTp', 'LYMn', 'NEUTn',
                'RBC', 'HGB', 'HCT', 'MCV', 'MCH',
                'MCHC', 'PLT', 'PDW', 'PCT']

X_bio = df1[colonnes_bio]
y_bio = df1['Diagnostic_code']

# Application SMOTE pour équilibrer les classes
print("\nApplication de SMOTE...")
smote = SMOTE(random_state=42, k_neighbors=2)
X_bio_smote, y_bio_smote = smote.fit_resample(X_bio, y_bio)
print(f"Données après SMOTE : {X_bio_smote.shape[0]} lignes")

# Division
X_bio_train, X_bio_test, y_bio_train, y_bio_test = train_test_split(
    X_bio_smote, y_bio_smote, test_size=0.30, random_state=42)

# Entraînement amélioré
print("\nEntraînement en cours...")
rl_modele = LogisticRegression(
    solver='saga',
    max_iter=5000,
    C=10,
    random_state=42
)
rl_modele.fit(X_bio_train, y_bio_train)

# Évaluation
y_bio_pred = rl_modele.predict(X_bio_test)

print(f"\nRésultats Régression Logistique améliorée :")
print(f"  Exactitude  : {accuracy_score(y_bio_test, y_bio_pred)*100:.2f}%")
print(f"  Précision   : {precision_score(y_bio_test, y_bio_pred, average='weighted', zero_division=0)*100:.2f}%")
print(f"  Rappel      : {recall_score(y_bio_test, y_bio_pred, average='weighted')*100:.2f}%")
print(f"  Score F1    : {f1_score(y_bio_test, y_bio_pred, average='weighted')*100:.2f}%")

# Sauvegarde
with open("models/modele_regression_logistique.pkl", "wb") as f:
    pickle.dump(rl_modele, f)
print("\n✅ Modèle Régression Logistique amélioré et sauvegardé !")

print("\n" + "=" * 60)
print("✅ ENTRAÎNEMENT TERMINÉ AVEC SUCCÈS !")
print("=" * 60)