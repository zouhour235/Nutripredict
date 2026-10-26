import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split

# ============================================================
# DATASET 1 — Données biologiques (Anémie)
# ============================================================

print("=" * 60)
print("PRÉTRAITEMENT — DATASET 1 : Données biologiques")
print("=" * 60)

df1 = pd.read_csv("data/donnees_biologiques_brutes.csv")

# Traduction des diagnostics en français
traduction = {
    'Iron deficiency anemia': 'Carence en fer',
    'Normocytic hypochromic anemia': 'Anémie hypochrome normocytaire',
    'Macrocytic anemia': 'Anémie macrocytaire',
    'Microcytic hypochromic anemia': 'Anémie microcytaire hypochrome',
    'Normocytic normochromic anemia': 'Anémie normochrome normocytaire',
    'Other microcytic anemia': 'Autre anémie microcytaire',
    'Thrombocytopenia': 'Thrombocytopénie',
    'Leukemia': 'Leucémie',
    'Leukemia with thrombocytopenia': 'Leucémie avec thrombocytopénie',
    'Healthy': 'Normal',
    'Normal': 'Normal',
    'Other': 'Autre'
}
df1['Diagnostic'] = df1['Diagnosis'].map(traduction).fillna(df1['Diagnosis'])
df1 = df1.drop(columns=['Diagnosis'])

# Encodage de la colonne cible
encodeur1 = LabelEncoder()
df1['Diagnostic_code'] = encodeur1.fit_transform(df1['Diagnostic'])

print(f"Classes détectées : {list(encodeur1.classes_)}")
print(f"Distribution des diagnostics :\n{df1['Diagnostic'].value_counts()}")

# Normalisation des variables numériques
colonnes_numeriques1 = ['WBC', 'LYMp', 'NEUTp', 'LYMn', 'NEUTn',
                         'RBC', 'HGB', 'HCT', 'MCV', 'MCH',
                         'MCHC', 'PLT', 'PDW', 'PCT']

scaler1 = StandardScaler()
df1[colonnes_numeriques1] = scaler1.fit_transform(df1[colonnes_numeriques1])

# Division train/validation/test (70% / 15% / 15%)
X1 = df1[colonnes_numeriques1]
y1 = df1['Diagnostic_code']

X1_train, X1_temp, y1_train, y1_temp = train_test_split(
    X1, y1, test_size=0.30, random_state=42)
X1_val, X1_test, y1_val, y1_test = train_test_split(
    X1_temp, y1_temp, test_size=0.50, random_state=42)

print(f"\nDivision des données :")
print(f"  Entraînement : {X1_train.shape[0]} lignes")
print(f"  Validation   : {X1_val.shape[0]} lignes")
print(f"  Test         : {X1_test.shape[0]} lignes")

# Sauvegarde
df1.to_csv("data/dataset1_biologique_traite.csv", index=False)
print("\n✅ Dataset 1 prétraité et sauvegardé !")

# ============================================================
# DATASET 2 — Symptômes nutritionnels
# ============================================================

print("\n" + "=" * 60)
print("PRÉTRAITEMENT — DATASET 2 : Symptômes nutritionnels")
print("=" * 60)

df2 = pd.read_excel("data/donnees_symptomes_brutes.xlsx")

# Création de la colonne cible selon seuils OMS
def diagnostiquer_carence(row):
    carences = []

    # Carence en fer (OMS : < 8mg/j)
    if row['Iron Intake (mg/day)'] < 8:
        carences.append('Carence en fer')

    # Carence en vitamine A (OMS : < 0.7 mg/j)
    if row['Vitamin A Intake (mg/day)'] < 0.7:
        carences.append('Carence en vitamine A')

    # Carence en calcium (OMS : < 800 mg/j)
    if row['Calcium Intake (mg/day)'] < 800:
        carences.append('Carence en calcium')

    if len(carences) == 0:
        return 'Normal'
    return ' + '.join(carences)

df2['Diagnostic'] = df2.apply(diagnostiquer_carence, axis=1)

print(f"Distribution des diagnostics :\n{df2['Diagnostic'].value_counts()}")

# Traduction des colonnes en français
df2 = df2.rename(columns={
    'User ID': 'ID_patient',
    'Age': 'Age',
    'Gender': 'Sexe',
    'Height (cm)': 'Taille_cm',
    'Weight (kg)': 'Poids_kg',
    'Activity Level': 'Niveau_activite',
    'Caloric Intake (kcal/day)': 'Apport_calorique',
    'Vitamin A Intake (mg/day)': 'Apport_vitamine_A',
    'Iron Intake (mg/day)': 'Apport_fer',
    'Calcium Intake (mg/day)': 'Apport_calcium'
})

# Encodage du sexe
df2['Sexe'] = df2['Sexe'].map({'Male': 'Homme', 'Female': 'Femme'})
encodeur_sexe = LabelEncoder()
df2['Sexe_code'] = encodeur_sexe.fit_transform(df2['Sexe'])

# Encodage du niveau d'activité
encodeur_activite = LabelEncoder()
df2['Activite_code'] = encodeur_activite.fit_transform(
    df2['Niveau_activite'])

# Encodage du diagnostic
encodeur2 = LabelEncoder()
df2['Diagnostic_code'] = encodeur2.fit_transform(df2['Diagnostic'])

print(f"\nClasses détectées : {list(encodeur2.classes_)}")

# Normalisation
colonnes_numeriques2 = ['Age', 'Taille_cm', 'Poids_kg',
                         'Apport_calorique', 'Apport_vitamine_A',
                         'Apport_fer', 'Apport_calcium']

scaler2 = StandardScaler()
df2[colonnes_numeriques2] = scaler2.fit_transform(df2[colonnes_numeriques2])

# Division train/validation/test
X2 = df2[colonnes_numeriques2 + ['Sexe_code', 'Activite_code']]
y2 = df2['Diagnostic_code']

X2_train, X2_temp, y2_train, y2_temp = train_test_split(
    X2, y2, test_size=0.30, random_state=42)
X2_val, X2_test, y2_val, y2_test = train_test_split(
    X2_temp, y2_temp, test_size=0.50, random_state=42)

print(f"\nDivision des données :")
print(f"  Entraînement : {X2_train.shape[0]} lignes")
print(f"  Validation   : {X2_val.shape[0]} lignes")
print(f"  Test         : {X2_test.shape[0]} lignes")

# Sauvegarde
df2.to_csv("data/dataset2_symptomes_traite.csv", index=False)
print("\n✅ Dataset 2 prétraité et sauvegardé !")

print("\n" + "=" * 60)
print("✅ PRÉTRAITEMENT TERMINÉ AVEC SUCCÈS !")
print("=" * 60)