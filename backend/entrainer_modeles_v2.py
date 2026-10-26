"""
NutriPredict — Entraînement expérimental V2.

Ce script :
- travaille à partir des données brutes ;
- réserve un jeu de test avant le prétraitement ;
- applique SMOTE uniquement aux données d'entraînement biologiques ;
- évalue les modèles avec plusieurs métriques ;
- sauvegarde les candidats sous de nouveaux noms.

ATTENTION :
Les modèles produits ici sont expérimentaux et ne remplacent pas
les modèles utilisés par l'application.
"""

from pathlib import Path
import json
import warnings

import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
)

from imblearn.pipeline import Pipeline as ImbPipeline
from imblearn.over_sampling import SMOTE


BASE = Path(__file__).resolve().parent
DATA = BASE / "data"
MODELS = BASE / "models"
RAPPORTS = BASE / "rapports_evaluation_v2"

MODELS.mkdir(parents=True, exist_ok=True)
RAPPORTS.mkdir(parents=True, exist_ok=True)

RANDOM_STATE = 42


def calculer_metriques(y_test, y_pred, nom, classes):
    """Calcule et enregistre des métriques de classification."""

    rapport = classification_report(
        y_test,
        y_pred,
        labels=classes,
        output_dict=True,
        zero_division=0,
    )

    resultat = {
        "modele": nom,
        "nombre_test": int(len(y_test)),
        "exactitude": float(accuracy_score(y_test, y_pred)),
        "exactitude_equilibree": float(
            balanced_accuracy_score(y_test, y_pred)
        ),
        "precision_macro": float(
            precision_score(
                y_test, y_pred, average="macro", zero_division=0
            )
        ),
        "rappel_macro": float(
            recall_score(
                y_test, y_pred, average="macro", zero_division=0
            )
        ),
        "f1_macro": float(
            f1_score(
                y_test, y_pred, average="macro", zero_division=0
            )
        ),
        "f1_pondere": float(
            f1_score(
                y_test, y_pred, average="weighted", zero_division=0
            )
        ),
        "rapport_par_classe": rapport,
        "matrice_confusion": confusion_matrix(
            y_test, y_pred, labels=classes
        ).tolist(),
    }

    return resultat


def afficher_metriques(resultat):
    print(f"\n--- {resultat['modele']} ---")
    print("Nombre d'observations de test :", resultat["nombre_test"])
    print(f"Exactitude                 : {resultat['exactitude']:.3f}")
    print(
        "Exactitude équilibrée     : "
        f"{resultat['exactitude_equilibree']:.3f}"
    )
    print(f"Précision macro            : {resultat['precision_macro']:.3f}")
    print(f"Rappel macro               : {resultat['rappel_macro']:.3f}")
    print(f"F1 macro                   : {resultat['f1_macro']:.3f}")
    print(f"F1 pondéré                 : {resultat['f1_pondere']:.3f}")

    print("\nPerformances par classe :")
    for classe, valeurs in resultat["rapport_par_classe"].items():
        if isinstance(valeurs, dict) and "f1-score" in valeurs:
            print(
                f"  {classe}: "
                f"rappel={valeurs['recall']:.3f}, "
                f"F1={valeurs['f1-score']:.3f}, "
                f"support={int(valeurs['support'])}"
            )


def enregistrer_resultats(nom_fichier, resultats):
    chemin = RAPPORTS / nom_fichier

    with chemin.open("w", encoding="utf-8") as fichier:
        json.dump(
            resultats,
            fichier,
            ensure_ascii=False,
            indent=2,
        )

    print(f"\nRapport enregistré : {chemin}")


# ============================================================
# 1. MODÈLE BIOLOGIQUE
# ============================================================

def entrainer_modele_biologique():
    print("\n" + "=" * 65)
    print("1. MODÈLE BIOLOGIQUE — ÉVALUATION EXPÉRIMENTALE")
    print("=" * 65)

    chemin = DATA / "donnees_biologiques_brutes.csv"

    if not chemin.exists():
        raise FileNotFoundError(f"Fichier introuvable : {chemin}")

    df = pd.read_csv(chemin)

    colonnes = [
        "WBC", "LYMp", "NEUTp", "LYMn", "NEUTn",
        "RBC", "HGB", "HCT", "MCV", "MCH",
        "MCHC", "PLT", "PDW", "PCT",
    ]

    attendues = colonnes + ["Diagnosis"]
    absentes = [c for c in attendues if c not in df.columns]

    if absentes:
        raise ValueError(
            f"Colonnes absentes du fichier biologique : {absentes}"
        )

    df = df[attendues].copy()

    for colonne in colonnes:
        df[colonne] = pd.to_numeric(
            df[colonne], errors="coerce"
        )

    df = df.replace([np.inf, -np.inf], np.nan)
    df = df.dropna(subset=attendues)

    avant = len(df)
    df = df.drop_duplicates()
    doublons_supprimes = avant - len(df)

    print("Observations exploitables :", len(df))
    print("Doublons exacts supprimés :", doublons_supprimes)
    print("Nombre de classes :", df["Diagnosis"].nunique())

    print("\nRépartition avant séparation :")
    print(df["Diagnosis"].value_counts().to_string())

    X = df[colonnes]
    y = df["Diagnosis"].astype(str)

    effectifs = y.value_counts()

    if len(effectifs) < 2 or effectifs.min() < 2:
        raise ValueError(
            "Impossible de séparer les classes de façon stratifiée : "
            "au moins une classe contient moins de deux observations."
        )

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.25,
        random_state=RANDOM_STATE,
        stratify=y,
    )

    print("\nObservations d'entraînement :", len(X_train))
    print("Observations de test :", len(X_test))

    effectifs_train = y_train.value_counts()
    plus_petite_classe = int(effectifs_train.min())

    etapes = [
        ("normalisation", StandardScaler()),
    ]

    if plus_petite_classe >= 3:
        voisins = min(2, plus_petite_classe - 1)
        print(f"\nSMOTE activé uniquement sur l'entraînement.")
        print("Nombre de voisins SMOTE :", voisins)
        etapes.append(
            ("reequilibrage", SMOTE(
                random_state=RANDOM_STATE,
                k_neighbors=voisins,
            ))
        )
    else:
        print(
            "\nAVERTISSEMENT : classe trop petite pour SMOTE. "
            "SMOTE ne sera pas appliqué."
        )

    etapes.append(
        (
            "classifieur",
            LogisticRegression(
                max_iter=5000,
                C=1.0,
                class_weight="balanced",
                random_state=RANDOM_STATE,
            ),
        )
    )

    modele = ImbPipeline(etapes)

    with warnings.catch_warnings(record=True) as avertissements:
        warnings.simplefilter("always")
        modele.fit(X_train, y_train)

        for avertissement in avertissements:
            print(
                "AVERTISSEMENT ENTRAÎNEMENT :",
                str(avertissement.message),
            )

    predictions = modele.predict(X_test)
    classes = sorted(y.unique())

    resultat = calculer_metriques(
        y_test,
        predictions,
        "Régression logistique biologique V2",
        classes,
    )

    afficher_metriques(resultat)

    modele_path = MODELS / "candidat_biologique_v2.joblib"
    joblib.dump(modele, modele_path)

    print(f"\nModèle candidat sauvegardé : {modele_path}")
    print("Le modèle biologique actuellement utilisé est conservé.")

    return resultat


# ============================================================
# 2. MODÈLE NUTRITIONNEL
# ============================================================

def creer_diagnostic_nutritionnel(df):
    """
    Reproduit les règles nutritionnelles du projet actuel.

    Ces étiquettes représentent les règles appliquées aux apports.
    Elles ne constituent pas des diagnostics médicaux confirmés.
    """

    fer = df["Iron Intake (mg/day)"] < 8
    vitamine_a = df["Vitamin A Intake (mg/day)"] < 0.7
    calcium = df["Calcium Intake (mg/day)"] < 800

    resultats = []

    for manque_fer, manque_a, manque_calcium in zip(
        fer, vitamine_a, calcium
    ):
        carences = []

        if manque_fer:
            carences.append("Carence en fer")

        if manque_a:
            carences.append("Carence en vitamine A")

        if manque_calcium:
            carences.append("Carence en calcium")

        resultats.append(" + ".join(carences) if carences else "Normal")

    return pd.Series(resultats, index=df.index, name="Diagnostic")


def entrainer_modele_nutritionnel():
    print("\n" + "=" * 65)
    print("2. MODÈLE NUTRITIONNEL — ÉVALUATION EXPÉRIMENTALE")
    print("=" * 65)

    chemin = DATA / "donnees_symptomes_brutes.xlsx"

    if not chemin.exists():
        raise FileNotFoundError(f"Fichier introuvable : {chemin}")

    df = pd.read_excel(chemin)

    colonnes_numeriques = [
        "Age",
        "Height (cm)",
        "Weight (kg)",
        "Caloric Intake (kcal/day)",
        "Vitamin A Intake (mg/day)",
        "Iron Intake (mg/day)",
        "Calcium Intake (mg/day)",
    ]

    colonnes_categorielles = ["Gender", "Activity Level"]

    attendues = (
        colonnes_numeriques
        + colonnes_categorielles
    )

    absentes = [c for c in attendues if c not in df.columns]

    if absentes:
        raise ValueError(
            f"Colonnes absentes du fichier nutritionnel : {absentes}"
        )

    df = df[attendues].copy()

    for colonne in colonnes_numeriques:
        df[colonne] = pd.to_numeric(
            df[colonne], errors="coerce"
        )

    df = df.replace([np.inf, -np.inf], np.nan)
    df = df.dropna(subset=attendues)

    df["Diagnostic"] = creer_diagnostic_nutritionnel(df)

    print("Observations exploitables :", len(df))
    print("\nRépartition des étiquettes :")
    print(df["Diagnostic"].value_counts().to_string())

    X = df[attendues]
    y = df["Diagnostic"].astype(str)

    effectifs = y.value_counts()

    if len(effectifs) < 2 or effectifs.min() < 2:
        raise ValueError(
            "Impossible de séparer les classes nutritionnelles "
            "de façon stratifiée."
        )

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.25,
        random_state=RANDOM_STATE,
        stratify=y,
    )

    print("\nObservations d'entraînement :", len(X_train))
    print("Observations de test :", len(X_test))

    # Les variables catégorielles sont encodées dans un candidat
    # distinct ; aucun encodage appris à partir du jeu de test.
    from sklearn.compose import ColumnTransformer
    from sklearn.preprocessing import OneHotEncoder

    preprocesseur = ColumnTransformer(
        transformers=[
            ("numeriques", StandardScaler(), colonnes_numeriques),
            (
                "categories",
                OneHotEncoder(handle_unknown="ignore"),
                colonnes_categorielles,
            ),
        ]
    )

    modele = Pipeline(
        steps=[
            ("pretraitement", preprocesseur),
            (
                "classifieur",
                RandomForestClassifier(
                    n_estimators=300,
                    min_samples_leaf=2,
                    class_weight="balanced",
                    random_state=RANDOM_STATE,
                    n_jobs=-1,
                ),
            ),
        ]
    )

    with warnings.catch_warnings(record=True) as avertissements:
        warnings.simplefilter("always")
        modele.fit(X_train, y_train)

        for avertissement in avertissements:
            print(
                "AVERTISSEMENT ENTRAÎNEMENT :",
                str(avertissement.message),
            )

    predictions = modele.predict(X_test)
    classes = sorted(y.unique())

    resultat = calculer_metriques(
        y_test,
        predictions,
        "Random Forest nutritionnel V2",
        classes,
    )

    afficher_metriques(resultat)

    modele_path = MODELS / "candidat_nutritionnel_v2.joblib"
    joblib.dump(modele, modele_path)

    print(f"\nModèle candidat sauvegardé : {modele_path}")
    print("Le modèle nutritionnel actuellement utilisé est conservé.")

    resultat["nature_des_etiquettes"] = (
        "Étiquettes générées par seuils d'apports alimentaires ; "
        "elles ne représentent pas des diagnostics médicaux confirmés."
    )

    return resultat


def main():
    resultats = {}

    try:
        resultats["biologique"] = entrainer_modele_biologique()
    except Exception as erreur:
        print("\nÉCHEC DU MODÈLE BIOLOGIQUE :", repr(erreur))
        resultats["biologique"] = {
            "erreur": str(erreur)
        }

    try:
        resultats["nutritionnel"] = entrainer_modele_nutritionnel()
    except Exception as erreur:
        print("\nÉCHEC DU MODÈLE NUTRITIONNEL :", repr(erreur))
        resultats["nutritionnel"] = {
            "erreur": str(erreur)
        }

    enregistrer_resultats("resultats_v2.json", resultats)

    print("\n" + "=" * 65)
    print("ÉVALUATION V2 TERMINÉE")
    print("=" * 65)
    print("Les modèles de production n'ont pas été remplacés.")
    print("Consulte le rapport avant toute intégration.")


if __name__ == "__main__":
    main()
