from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict
from database.db import get_connection
import pickle
import joblib
import json
import numpy as np
import pandas as pd
from pathlib import Path

routeur = APIRouter()

# ============================================================
# CHARGEMENT DES MODÈLES IA
# ============================================================

DOSSIER_MODELES = Path(__file__).resolve().parents[1] / "models"

with open(DOSSIER_MODELES / "modele_random_forest.pkl", "rb") as f:
    modele_rf = pickle.load(f)

with open(DOSSIER_MODELES / "modele_regression_logistique.pkl", "rb") as f:
    modele_rl = pickle.load(f)

with open(DOSSIER_MODELES / "scaler_symptomes.pkl", "rb") as f:
    scaler_symptomes = pickle.load(f)

with open(DOSSIER_MODELES / "scaler_biologique.pkl", "rb") as f:
    scaler_biologique = pickle.load(f)

# Modèles V2 : leurs pipelines réalisent eux-mêmes le prétraitement.
modele_nutritionnel_v2 = joblib.load(
    DOSSIER_MODELES / "candidat_nutritionnel_v2.joblib"
)
modele_biologique_v2 = joblib.load(
    DOSSIER_MODELES / "candidat_biologique_v2.joblib"
)

# ============================================================
# SEUILS NUTRITIONNELS OMS PAR SEXE ET ÂGE
# ============================================================

SEUILS_OMS = {
    'fer': {
        'femme_enfant':  {'min': 8,  'max': 18},
        'femme_jeune':   {'min': 18, 'max': 45},
        'femme_adulte':  {'min': 18, 'max': 45},
        'femme_senior':  {'min': 8,  'max': 18},
        'homme_enfant':  {'min': 8,  'max': 18},
        'homme_jeune':   {'min': 8,  'max': 18},
        'homme_adulte':  {'min': 8,  'max': 18},
        'homme_senior':  {'min': 8,  'max': 18},
    },
    'vitamine_a': {
        'femme_enfant':  {'min': 0.4, 'max': 2.0},
        'femme_jeune':   {'min': 0.6, 'max': 3.0},
        'femme_adulte':  {'min': 0.6, 'max': 3.0},
        'femme_senior':  {'min': 0.6, 'max': 3.0},
        'homme_enfant':  {'min': 0.4, 'max': 2.0},
        'homme_jeune':   {'min': 0.7, 'max': 3.0},
        'homme_adulte':  {'min': 0.7, 'max': 3.0},
        'homme_senior':  {'min': 0.7, 'max': 3.0},
    },
    'calcium': {
        'femme_enfant':  {'min': 700,  'max': 2500},
        'femme_jeune':   {'min': 1000, 'max': 2500},
        'femme_adulte':  {'min': 1000, 'max': 2500},
        'femme_senior':  {'min': 1200, 'max': 2500},
        'homme_enfant':  {'min': 700,  'max': 2500},
        'homme_jeune':   {'min': 1000, 'max': 2500},
        'homme_adulte':  {'min': 1000, 'max': 2500},
        'homme_senior':  {'min': 1200, 'max': 2500},
    },
}

# ============================================================
# ALIMENTS LOCAUX TCHADIENS PAR CARENCE
# ============================================================

ALIMENTS_TCHAD = {
    'fer': [
        "🥩 Foie de bœuf ou de mouton — très riche en fer",
        "🥩 Viande rouge locale (bœuf, mouton, chèvre)",
        "🫘 Haricots niébé et lentilles locales",
        "🌿 Feuilles de moringa séchées (très riches en fer)",
        "🌾 Mil et sorgho (céréales locales du Tchad)",
        "🥬 Épinards sauvages et légumes verts feuillus",
        "🐟 Poisson séché (sardines, capitaine, silure)",
    ],
    'vitamine_a': [
        "🍠 Patate douce orange (facilement disponible au Tchad)",
        "🥕 Carottes fraîches ou séchées",
        "🥭 Mangue mûre de saison",
        "🌴 Huile de palme rouge locale",
        "🌿 Feuilles de baobab (très nutritives et locales)",
        "🍈 Papaye mûre",
        "🥬 Feuilles de patate douce",
    ],
    'calcium': [
        "🥛 Lait de vache ou de chamelle (disponible localement)",
        "🧀 Fromage peul local (wagashi)",
        "🐟 Poisson séché avec arêtes (sardines, capitaine, silure)",
        "🌿 Feuilles de baobab séchées",
        "🫘 Haricots blancs et niébé",
        "🌱 Graines de sésame",
        "🥬 Amarante (légume local riche en calcium)",
    ],
    'multiple': [
        "🌿 Feuilles de moringa (riches en fer, calcium et vitamines)",
        "🌿 Feuilles de baobab (calcium, vitamine C, fer)",
        "🫘 Niébé (haricots locaux, fer et calcium)",
        "🐟 Poisson frais ou sec (sardines, capitaine, silure) — protéines et minéraux",
        "🥩 Abats (foie, rognons) — multiples nutriments",
    ],
}

# ============================================================
# CONSEILS PAR CARENCE ADAPTÉS AU CONTEXTE TCHADIEN
# ============================================================

CONSEILS_TCHAD = {
    'fer': """🩸 CARENCE EN FER DÉTECTÉE

Votre organisme manque de fer. Voici ce que vous devez faire :

🍽️ Alimentation :
- Mangez du foie ou de la viande rouge au moins 3 fois par semaine
- Consommez des haricots niébé ou des lentilles tous les jours
- Ajoutez des feuilles de moringa séchées à vos repas (une cuillère suffit)
- Buvez du jus de citron ou mangez du tamarin avec vos repas (aide à absorber le fer)

⛔ À éviter :
- Ne buvez pas de thé ou café pendant les repas — ils bloquent l'absorption du fer
- Évitez de manger du pain avec de la viande (le blé réduit l'absorption)

⚠️ Attention particulière :
- Les femmes enceintes et les enfants sont particulièrement à risque 

🏥 Si les symptômes persistent plus de 2 semaines, consultez le centre de santé le plus proche.""",

    'vitamine_a': """👁️ CARENCE EN VITAMINE A DÉTECTÉE

Votre organisme manque de vitamine A. Voici ce que vous devez faire :

🍽️ Alimentation :
- Mangez de la patate douce orange ou des carottes chaque jour
- Consommez de la mangue ou de la papaye quand elles sont de saison
- Utilisez l'huile de palme rouge pour cuisiner (très riche en vitamine A)
- Ajoutez des feuilles de baobab à votre sauce

🔑 Conseil important :
- Mangez ces aliments avec un peu d'huile ou de matière grasse — la vitamine A ne s'absorbe qu'avec les graisses
- Allaitez votre bébé si possible — le lait maternel est riche en vitamine A

⚠️ Signes graves à surveiller :
- Si votre enfant ne voit plus bien la nuit → urgence médicale
- Si vos yeux sont très secs et douloureux → consultez immédiatement

🏥 La carence en vitamine A est très fréquente au Tchad. Consultez le centre de santé pour une supplémentation gratuite.""",

    'calcium': """🦴 CARENCE EN CALCIUM DÉTECTÉE

Votre organisme manque de calcium. Voici ce que vous devez faire :

🍽️ Alimentation :
- Buvez du lait (vache ou chamelle) ou mangez du wagashi chaque jour
- Mangez du poisson séché avec les arêtes — les arêtes sont riches en calcium
- Ajoutez des graines de sésame à vos plats
- Consommez des feuilles de baobab et d'amarante régulièrement

☀️ Vitamine D :
- Exposez-vous au soleil le matin (30 minutes) — le soleil aide votre corps à absorber le calcium
- C'est gratuit et disponible partout au Tchad !

⚠️ Attention :
- Les crampes et douleurs osseuses sont des signes sérieux
- Les enfants carencés en calcium peuvent avoir des déformations des os

🏥 Consultez un agent de santé si les douleurs persistent.""",

    'multiple': """🚨 PLUSIEURS CARENCES NUTRITIONNELLES DÉTECTÉES

Votre organisme présente des carences multiples. C'est une situation sérieuse.

🍽️ Ce que vous devez manger CHAQUE JOUR :
- Matin : Bouillie de mil avec des feuilles de moringa séchées
- Midi : Riz ou sorgho avec sauce de légumes verts et viande ou poisson
- Soir : Haricots niébé ou lentilles avec légumes feuillus

🌟 Aliments miracle disponibles au Tchad :
- Feuilles de MORINGA → fer + calcium + vitamines (le plus complet)
- Feuilles de BAOBAB → calcium + vitamine C + fer
- NIÉBÉ (haricots) → protéines + fer + calcium

⚠️ C'est urgent :
- Plusieurs carences ensemble affaiblissent votre système immunitaire
- Vous êtes plus vulnérable aux infections et maladies
- Vos enfants risquent des retards de développement

🏥 CONSULTEZ UN AGENT DE SANTÉ DÈS QUE POSSIBLE pour :
- Un bilan nutritionnel complet
- Des suppléments vitaminiques si nécessaire
- Un suivi régulier de votre état de santé""",

    'normal': """ℹ️ RÉSULTAT À INTERPRÉTER AVEC PRUDENCE

Le modèle n'a pas identifié de carence majeure à partir des informations fournies. Cela ne confirme pas l'absence de carence ou de maladie.

🍽️ Conseils généraux :
- Privilégiez une alimentation variée : céréales, légumineuses, légumes et sources de protéines selon vos possibilités.
- Buvez suffisamment d'eau, particulièrement par temps chaud.
- Ne prenez pas de supplément nutritionnel ou de médicament sans conseil adapté.

🏥 Si vous avez des symptômes persistants, si vous êtes enceinte ou si vous vous inquiétez pour la santé d'un enfant, demandez conseil à un agent de santé. Une évaluation clinique peut être nécessaire.""",
}


# ============================================================
# MOTEUR DE RÈGLES INTELLIGENT — CAS INATTENDUS
# ============================================================

def analyser_cas_inattendus(commentaire: str,
                             symptomes: dict,
                             sexe_code: int,
                             tranche_age: str) -> dict:
    """
    Analyse intelligente des cas inattendus et situations
    spéciales à partir du commentaire libre et des symptômes
    """
    alertes = []
    conseils_urgents = []
    orientations = []
    commentaire_lower = commentaire.lower() if commentaire else ''

    # ── CAS 1 : Fièvre
    mots_fievre = ['fièvre', 'fievre', 'température', 'chaud',
                   'frisson', 'chaleur', 'brûle', 'brule']
    if any(mot in commentaire_lower for mot in mots_fievre):
        alertes.append('🌡️ Fièvre signalée')
        conseils_urgents.append(
            "⚠️ La fièvre peut indiquer une infection ou le paludisme — "
            "très fréquent au Tchad. Consultez un agent de santé dans "
            "les 24 heures. En attendant, buvez beaucoup d'eau et restez "
            "à l'ombre."
        )
        orientations.append('centre_sante_urgent')

    # ── CAS 2 : Grossesse
    mots_grossesse = ['enceinte', 'grossesse', 'bébé', 'bebe',
                      'accoucher', 'maternité', 'maternite',
                      'mois de grossesse', 'ventre']
    if any(mot in commentaire_lower for mot in mots_grossesse) or \
       symptomes.get('enceinte') == 'oui':
        alertes.append('🤰 Grossesse détectée')
        conseils_urgents.append(
            "🤰 FEMME ENCEINTE : Vos besoins nutritionnels sont "
            "deux fois plus élevés. Vous avez besoin de fer, d'acide "
            "folique et de calcium en priorité. Consultez IMMÉDIATEMENT "
            "un centre de santé maternelle pour un suivi prénatal gratuit."
        )
        orientations.append('maternite')

    # ── CAS 3 : Bébé / Enfant qui ne grandit pas
    mots_bebe = ['bébé', 'bebe', 'nourrisson', 'enfant maigre',
                 'ne grossit pas', 'ne grandit pas', 'allaitement',
                 'allaite', 'biberon', 'maigre']
    if any(mot in commentaire_lower for mot in mots_bebe) or \
       symptomes.get('enfant_croissance') == 'oui':
        alertes.append('👶 Problème de croissance enfant détecté')
        conseils_urgents.append(
            "👶 ENFANT MALNUTRI : Un enfant qui ne grandit pas "
            "normalement souffre peut-être de malnutrition aiguë. "
            "C'est une URGENCE médicale au Tchad. Rendez-vous "
            "IMMÉDIATEMENT au centre de santé le plus proche pour "
            "un test MUAC (mesure du bras) gratuit. Des aliments "
            "thérapeutiques (Plumpy'Nut) sont disponibles gratuitement."
        )
        orientations.append('centre_sante_urgent')

    # ── CAS 4 : Diarrhée / Déshydratation
    mots_diarrhee = ['diarrhée', 'diarrhee', 'selles', 'ventre',
                     'mal au ventre', 'vomissement', 'vomit',
                     'déshydraté', 'deshydrate', 'soif intense']
    if any(mot in commentaire_lower for mot in mots_diarrhee):
        alertes.append('🚽 Troubles digestifs signalés')
        conseils_urgents.append(
            "💧 DIARRHÉE / DÉSHYDRATATION : Buvez immédiatement de "
            "l'eau avec du sel et du sucre (SRO maison : 1 litre d'eau "
            "+ 6 cuillères de sucre + 1/2 cuillère de sel). "
            "La diarrhée aggrave les carences nutritionnelles. "
            "Si elle dure plus de 2 jours ou si vous voyez du sang, "
            "consultez immédiatement."
        )
        orientations.append('centre_sante')

    # ── CAS 5 : Douleurs intenses
    mots_douleur = ['douleur intense', 'très mal', 'insupportable',
                    'douleur forte', 'crise', 'urgent', 'urgence',
                    'grave', 'pire']
    if any(mot in commentaire_lower for mot in mots_douleur):
        alertes.append('🚨 Douleur intense signalée')
        conseils_urgents.append(
            "🚨 SITUATION URGENTE : Les douleurs intenses nécessitent "
            "une consultation médicale immédiate. Rendez-vous au centre "
            "de santé ou à l'hôpital le plus proche sans délai."
        )
        orientations.append('hopital_urgent')

    # ── CAS 6 : Allaitement
    mots_allaitement = ['allaite', 'allaitement', 'sein', 'lait maternel']
    if any(mot in commentaire_lower for mot in mots_allaitement):
        alertes.append('🍼 Allaitement signalé')
        conseils_urgents.append(
            "🍼 FEMME ALLAITANTE : Votre alimentation affecte "
            "directement votre bébé. Mangez du moringa, du niébé "
            "et buvez beaucoup d'eau. Vos besoins en fer et calcium "
            "sont très élevés pendant l'allaitement."
        )

    # ── CAS 7 : Personnes âgées
    if tranche_age == 'senior':
        alertes.append('👴 Senior — besoins spécifiques')
        conseils_urgents.append(
            "👴 PERSONNE ÂGÉE : Les besoins en calcium et vitamine D "
            "augmentent avec l'âge. Exposez-vous au soleil le matin "
            "et consommez du lait ou du wagashi chaque jour pour "
            "protéger vos os."
        )

    # ── CAS 8 : Enfant (moins de 15 ans)
    if tranche_age == 'enfant':
        conseils_urgents.append(
            "👶 ENFANT : Les besoins nutritionnels des enfants sont "
            "critiques pour leur développement. Un enfant carencé "
            "peut avoir des retards scolaires et physiques permanents. "
            "Consultez un agent de santé communautaire pour un suivi."
        )

    # ── CAS 9 : Paludisme / Malaria
    mots_palu = ['paludisme', 'malaria', 'moustique', 'frissons',
                 'sueurs', 'sueur', 'frisson']
    if any(mot in commentaire_lower for mot in mots_palu):
        alertes.append('🦟 Paludisme suspecté')
        conseils_urgents.append(
            "🦟 PALUDISME SUSPECTÉ : Le paludisme aggrave fortement "
            "l'anémie (carence en fer). Consultez IMMÉDIATEMENT "
            "un centre de santé pour un test de diagnostic rapide (TDR) "
            "gratuit. Dormez sous moustiquaire imprégnée."
        )
        orientations.append('centre_sante_urgent')

    # ── CAS 10 : Problème de vue / Cécité
    mots_vue = ['aveugle', 'cécité', 'cecite', 'ne voit plus',
                'vue basse', 'yeux douloureux', 'yeux gonflés',
                'yeux gonfles']
    if any(mot in commentaire_lower for mot in mots_vue):
        alertes.append('👁️ Problème visuel grave signalé')
        conseils_urgents.append(
            "👁️ PROBLÈME DE VUE GRAVE : Une perte de vision peut "
            "indiquer une carence sévère en vitamine A. C'est une "
            "URGENCE médicale — la cécité peut devenir permanente. "
            "Consultez un médecin IMMÉDIATEMENT. "
            "Des suppléments de vitamine A sont disponibles gratuitement "
            "dans les centres de santé au Tchad."
        )
        orientations.append('hopital_urgent')

        # Maux de tête / Vertiges / Migraines
    if any(m in commentaire_lower for m in
           ['maux de tête', 'maux de tete', 'mal à la tête',
            'migraine', 'vertiges', 'vertige',
            'tête qui tourne', 'mal de tête']):
        alertes.append('🤕 Maux de tête / Vertiges signalés')
        conseils_urgents.append(
            "🤕 MAUX DE TÊTE : Souvent liés à une carence "
            "en fer, une déshydratation ou une fatigue "
            "intense. Buvez beaucoup d'eau et mangez des "
            "aliments riches en fer. Si persistants plus "
            "de 3 jours → consultez un agent de santé."
        )

    # Nausées / Vomissements
    if any(m in commentaire_lower for m in
           ['nausée', 'nausee', 'vomissement', 'vomit',
            'envie de vomir', 'mal au cœur', 'mal au coeur',
            'nausées matinales']):
        alertes.append('🤢 Nausées / Vomissements signalés')
        conseils_urgents.append(
            "🤢 NAUSÉES : Peuvent indiquer une grossesse, "
            "une infection ou une carence en vitamine B. "
            "Mangez en petites quantités et souvent. "
            "Si accompagnées de fièvre → consultez "
            "immédiatement un agent de santé."
        )

    # Courbatures / Douleurs musculaires
    if any(m in commentaire_lower for m in
           ['courbature', 'douleur musculaire', 'muscles douloureux',
            'corps douloureux', 'douleur dans le corps',
            'mal partout', 'corps cassé', 'fatigue musculaire']):
        alertes.append('💪 Courbatures / Douleurs musculaires')
        conseils_urgents.append(
            "💪 COURBATURES : Peuvent indiquer une carence "
            "en magnésium, calcium ou vitamine D. "
            "Consommez des légumineuses, des feuilles de "
            "baobab et exposez-vous au soleil le matin. "
            "Si accompagnées de fièvre → paludisme possible."
        )

    # Difficultés respiratoires
    if any(m in commentaire_lower for m in
           ['essoufflement', 'difficultés à respirer',
            'respiration difficile', 'souffle court',
            'oppression', 'toux', 'bronchite', 'asthme']):
        alertes.append('😮‍💨 Difficultés respiratoires')
        conseils_urgents.append(
            "😮‍💨 DIFFICULTÉS RESPIRATOIRES : Peuvent indiquer "
            "une anémie sévère ou une infection pulmonaire. "
            "Consultez un agent de santé rapidement. "
            "En cas de difficulté grave → urgences médicales."
        )

    # Palpitations cardiaques
    if any(m in commentaire_lower for m in
           ['palpitations', 'cœur qui bat vite', 'coeur qui bat',
            'tachycardie', 'battements rapides', 'cœur irrégulier']):
        alertes.append('❤️ Palpitations cardiaques signalées')
        conseils_urgents.append(
            "❤️ PALPITATIONS : Souvent liées à une anémie "
            "sévère ou une déshydratation. "
            "Consultez un médecin dès que possible. "
            "Évitez les efforts physiques intenses."
        )

    # Insomnie / Troubles du sommeil
    if any(m in commentaire_lower for m in
           ['insomnie', 'ne dort pas', 'trouble du sommeil',
            'dormir mal', 'nuit blanche', 'difficultés à dormir']):
        alertes.append('😴 Troubles du sommeil signalés')
        conseils_urgents.append(
            "😴 TROUBLES DU SOMMEIL : Peuvent être liés à "
            "une carence en magnésium ou en fer. "
            "Consommez des feuilles de moringa et du niébé. "
            "Évitez le thé ou le café le soir."
        )

    # Gonflement / Œdème
    if any(m in commentaire_lower for m in
           ['gonflement', 'enflé', 'enfle', 'œdème', 'oedeme',
            'pieds gonflés', 'jambes gonflées', 'ventre gonflé']):
        alertes.append('🦵 Gonflement / Œdème signalé')
        conseils_urgents.append(
            "🦵 GONFLEMENT : Peut indiquer une malnutrition "
            "sévère (kwashiorkor) ou un problème rénal. "
            "C'est une situation sérieuse — consultez "
            "un agent de santé IMMÉDIATEMENT."
        )

    # Problème de peau / Démangeaisons
    if any(m in commentaire_lower for m in
           ['démangeaison', 'demange', 'gratte', 'éruption',
            'bouton', 'rougeur', 'allergie', 'urticaire']):
        alertes.append('🫀 Problème cutané signalé')
        conseils_urgents.append(
            "🫀 PROBLÈME DE PEAU : Peut indiquer une carence "
            "en vitamine A ou en zinc. "
            "Consommez de la patate douce orange, "
            "de la mangue et des feuilles de baobab."
        )

    # Diabète / Glycémie
    if any(m in commentaire_lower for m in
           ['diabète', 'diabete', 'sucre dans le sang',
            'glycémie', 'glycemie', 'soif excessive',
            'urines fréquentes']):
        alertes.append('🍬 Diabète / Glycémie signalé')
        conseils_urgents.append(
            "🍬 DIABÈTE SUSPECTÉ : Évitez les sucres "
            "raffinés et les boissons sucrées. "
            "Consultez un médecin pour une prise en "
            "charge adaptée et un test de glycémie."
        )

    # Stress / Anxiété / Dépression
    if any(m in commentaire_lower for m in
           ['stress', 'anxiété', 'anxiete', 'dépression',
            'depression', 'tristesse', 'moral bas', 'angoisse']):
        alertes.append('🧠 Stress / Anxiété signalé')
        conseils_urgents.append(
            "🧠 STRESS / ANXIÉTÉ : Le stress chronique "
            "aggrave les carences nutritionnelles. "
            "Mangez varié, dormez suffisamment et "
            "parlez à un proche ou un agent de santé."
        )
    # ── Commentaire libre non reconnu
    if commentaire and len(commentaire) > 5 and len(alertes) == 0:
        conseils_urgents.append(
            f"💬 Concernant votre message : \"{commentaire}\"\n"
            "Votre situation nécessite un avis médical "
            "personnalisé. Consultez un agent de santé "
            "ou le centre de santé le plus proche."
        )
    return {
        'alertes': alertes,
        'conseils_urgents': conseils_urgents,
        'orientations': orientations,
        'cas_detectes': len(alertes),
    }

# ============================================================
# ANALYSE BASÉE UNIQUEMENT SUR LES SYMPTÔMES
# ============================================================

def analyser_symptomes(symptomes: dict, sexe_code: int,
                        tranche_age: str) -> dict:
    """
    Analyse les symptômes déclarés et détermine les carences
    SANS inventer de chiffres — basé uniquement sur les symptômes
    """
    sexe = 'femme' if sexe_code == 0 else 'homme'
    cle_profil = f"{sexe}_{tranche_age}"

    # Scores par carence basés sur les symptômes
    score_fer = 0
    score_vitamine_a = 0
    score_calcium = 0

    # Symptômes liés au fer
    symptomes_fer = {
        'fatigue_extreme': 4, 'essoufflement': 3,
        'faiblesse_generale': 3, 'yeux_paleur': 4,
        'paleur_visage': 4, 'chute_cheveux': 3,
        'ongles_fragiles': 3, 'maux_tete': 2,
        'concentration': 2, 'irritabilite': 2,
        'enceinte': 5, 'regles_abondantes': 4,
    }

    # Symptômes liés à la vitamine A
    symptomes_vitamine_a = {
        'vision_nuit': 5, 'yeux_secs': 4,
        'peau_seche': 3, 'plaies_lentes': 3,
        'peau_boutons': 2, 'cheveux_secs': 2,
    }

    # Symptômes liés au calcium
    symptomes_calcium = {
        'crampes': 4, 'douleurs_os': 4,
        'dents_fragiles': 3, 'engourdissements': 3,
        'enfant_croissance': 4,
    }

    symptomes_detectes_fer = []
    symptomes_detectes_va = []
    symptomes_detectes_ca = []

    for symptome, reponse in symptomes.items():
        if reponse == 'oui':
            if symptome in symptomes_fer:
                score_fer += symptomes_fer[symptome]
                symptomes_detectes_fer.append(symptome)
            if symptome in symptomes_vitamine_a:
                score_vitamine_a += symptomes_vitamine_a[symptome]
                symptomes_detectes_va.append(symptome)
            if symptome in symptomes_calcium:
                score_calcium += symptomes_calcium[symptome]
                symptomes_detectes_ca.append(symptome)

    # Détermination des carences
    seuil_carence = 4  # score minimum pour déclarer une carence

    carence_fer = score_fer >= seuil_carence
    carence_vitamine_a = score_vitamine_a >= seuil_carence
    carence_calcium = score_calcium >= seuil_carence

    # Niveau de sévérité par carence
    def niveau_severite(score):
        if score >= 10: return 'Sévère'
        elif score >= 6: return 'Modérée'
        elif score >= 4: return 'Légère'
        return 'Normale'

    # Construction des analyses à afficher
    analyses = []

    seuils_fer = SEUILS_OMS['fer'].get(cle_profil,
                 SEUILS_OMS['fer']['femme_adulte'])
    seuils_va = SEUILS_OMS['vitamine_a'].get(cle_profil,
                SEUILS_OMS['vitamine_a']['femme_adulte'])
    seuils_ca = SEUILS_OMS['calcium'].get(cle_profil,
                SEUILS_OMS['calcium']['femme_adulte'])

    analyses.append({
        'nutriment': 'Fer',
        'statut': 'carence' if carence_fer else 'normal',
        'icone': '🔴' if carence_fer else '🟢',
        'severite': niveau_severite(score_fer),
        'score_symptomes': score_fer,
        'seuil_normal': f"{seuils_fer['min']} - {seuils_fer['max']} mg/jour",
        'symptomes_detectes': len(symptomes_detectes_fer),
        'message': f"{len(symptomes_detectes_fer)} symptôme(s) de carence en fer détecté(s)"
                   if carence_fer else "Aucun symptôme significatif de carence en fer",
    })

    analyses.append({
        'nutriment': 'Vitamine A',
        'statut': 'carence' if carence_vitamine_a else 'normal',
        'icone': '🔴' if carence_vitamine_a else '🟢',
        'severite': niveau_severite(score_vitamine_a),
        'score_symptomes': score_vitamine_a,
        'seuil_normal': f"{seuils_va['min']} - {seuils_va['max']} mg/jour",
        'symptomes_detectes': len(symptomes_detectes_va),
        'message': f"{len(symptomes_detectes_va)} symptôme(s) de carence en vitamine A détecté(s)"
                   if carence_vitamine_a else "Aucun symptôme significatif de carence en vitamine A",
    })

    analyses.append({
        'nutriment': 'Calcium',
        'statut': 'carence' if carence_calcium else 'normal',
        'icone': '🔴' if carence_calcium else '🟢',
        'severite': niveau_severite(score_calcium),
        'score_symptomes': score_calcium,
        'seuil_normal': f"{seuils_ca['min']} - {seuils_ca['max']} mg/jour",
        'symptomes_detectes': len(symptomes_detectes_ca),
        'message': f"{len(symptomes_detectes_ca)} symptôme(s) de carence en calcium détecté(s)"
                   if carence_calcium else "Aucun symptôme significatif de carence en calcium",
    })

    return {
        'analyses': analyses,
        'carence_fer': carence_fer,
        'carence_vitamine_a': carence_vitamine_a,
        'carence_calcium': carence_calcium,
        'scores': {
            'fer': score_fer,
            'vitamine_a': score_vitamine_a,
            'calcium': score_calcium,
        }
    }

def generer_diagnostic(carence_fer, carence_vitamine_a,
                        carence_calcium) -> str:
    """Génère le diagnostic textuel"""
    carences = []
    if carence_fer: carences.append('Carence en fer')
    if carence_vitamine_a: carences.append('Carence en vitamine A')
    if carence_calcium: carences.append('Carence en calcium')

    if not carences: return 'Normal'
    if len(carences) > 1: return ' + '.join(carences)
    return carences[0]

def generer_recommandations_personnalisees(
        carence_fer, carence_vitamine_a,
        carence_calcium,
        sexe='', situation='', tranche_age='',
        commentaire_libre='') -> dict:
    """Génère des conseils nutritionnels généraux adaptés au profil."""

    if carence_fer and carence_vitamine_a and carence_calcium:
        aliments = ALIMENTS_TCHAD['multiple']
        conseils = CONSEILS_TCHAD['multiple']
    elif carence_fer and carence_vitamine_a:
        aliments = ALIMENTS_TCHAD['fer'][:3] + ALIMENTS_TCHAD['vitamine_a'][:3]
        conseils = CONSEILS_TCHAD['fer'] + '\n\n' + CONSEILS_TCHAD['vitamine_a']
    elif carence_fer and carence_calcium:
        aliments = ALIMENTS_TCHAD['fer'][:3] + ALIMENTS_TCHAD['calcium'][:3]
        conseils = CONSEILS_TCHAD['fer'] + '\n\n' + CONSEILS_TCHAD['calcium']
    elif carence_vitamine_a and carence_calcium:
        aliments = ALIMENTS_TCHAD['vitamine_a'][:3] + ALIMENTS_TCHAD['calcium'][:3]
        conseils = CONSEILS_TCHAD['vitamine_a'] + '\n\n' + CONSEILS_TCHAD['calcium']
    elif carence_fer:
        aliments = ALIMENTS_TCHAD['fer']
        conseils = CONSEILS_TCHAD['fer']
    elif carence_vitamine_a:
        aliments = ALIMENTS_TCHAD['vitamine_a']
        conseils = CONSEILS_TCHAD['vitamine_a']
    elif carence_calcium:
        aliments = ALIMENTS_TCHAD['calcium']
        conseils = CONSEILS_TCHAD['calcium']
    else:
        aliments = [
            "🌿 Feuilles de moringa (complément alimentaire)",
            "🫘 Niébé et autres légumineuses locales",
            "🥩 Viande ou poisson selon les possibilités",
            "🌾 Mil et sorgho comme céréales de base",
            "🍈 Fruits locaux de saison",
        ]
        conseils = CONSEILS_TCHAD['normal']

    conseils_supplementaires = []

    if situation == 'enceinte':
        conseils_supplementaires.append(
            "🤰 Grossesse : un suivi prénatal auprès d'un agent de santé "
            "est important. Ne prenez pas de supplément sans avis médical."
        )
    elif situation == 'allaitante':
        conseils_supplementaires.append(
            "🍼 Allaitement : privilégiez une alimentation variée et "
            "demandez conseil à un agent de santé si vous avez des inquiétudes."
        )

    if tranche_age in ['enfant_0_5', 'enfant_5_14']:
        conseils_supplementaires.append(
            "👶 Enfant : faites évaluer sa croissance et son alimentation "
            "par un agent de santé, surtout en cas de perte de poids ou de fatigue."
        )
    elif tranche_age == 'senior':
        conseils_supplementaires.append(
            "👴 Personne âgée : une alimentation variée et un suivi de santé "
            "régulier sont recommandés."
        )

    if commentaire_libre and commentaire_libre.strip():
        texte = commentaire_libre.strip()
        conseils_supplementaires.append(
            "💬 Votre commentaire : " + texte +
            "\\nUn agent de santé pourra vous aider à évaluer cette situation."
        )

    if conseils_supplementaires:
        conseils += '\n\n' + '\n\n'.join(conseils_supplementaires)

    return {'aliments': aliments, 'conseils': conseils}


def determiner_gravite_globale(scores: dict) -> str:
    """Détermine la gravité globale"""
    score_total = sum(scores.values())
    nb_carences = sum([
        1 for s in scores.values() if s >= 4
    ])

    if nb_carences >= 2 or score_total >= 20:
        return 'Sévère'
    elif nb_carences == 1 or score_total >= 10:
        return 'Modérée'
    else:
        return 'Légère'

# ============================================================
# MODÈLES DE DONNÉES
# ============================================================

class DonneesSymptomes(BaseModel):
    age: float
    taille_cm: float
    poids_kg: float
    apport_calorique: float = 2000
    apport_vitamine_a: float = 0.7
    apport_fer: float = 10
    apport_calcium: float = 1000
    sexe_code: int = 0
    activite_code: int = 1
    patient_id: Optional[int] = None
    utilisateur_id: Optional[int] = None
    # Nouveaux champs pour diagnostic symptômes
    symptomes: Optional[Dict[str, str]] = None
    tranche_age: Optional[str] = 'adulte'
    commentaire_libre: Optional[str] = ''

class DonneesBiologiques(BaseModel):
    wbc: float
    lymp: float
    neutp: float
    lymn: float
    neutn: float
    rbc: float
    hgb: float
    hct: float
    mcv: float
    mch: float
    mchc: float
    plt: float
    pdw: float
    pct: float
    patient_id: Optional[int] = None
    utilisateur_id: Optional[int] = None
    sexe: Optional[str] = ''
    situation: Optional[str] = ''
    tranche_age: Optional[str] = 'adulte'



# ============================================================
# PERSISTANCE DES DIAGNOSTICS ET DOSSIERS PATIENTS
# ============================================================

def enregistrer_diagnostic(donnees, resultat, type_diagnostic):
    """
    Enregistre le résultat dans PostgreSQL.
    Un dossier est associé à l'utilisateur connecté ou à un patient
    anonyme identifié par patient_id.
    """
    conn = get_connection()
    if not conn:
        raise HTTPException(
            status_code=500,
            detail="Connexion à la base de données impossible."
        )

    cursor = None
    try:
        cursor = conn.cursor()
        utilisateur_id = donnees.utilisateur_id
        patient_id = donnees.patient_id

        if utilisateur_id is not None:
            cursor.execute(
                "SELECT id FROM utilisateurs WHERE id = %s",
                (utilisateur_id,)
            )
            if cursor.fetchone() is None:
                raise HTTPException(
                    status_code=400,
                    detail="Utilisateur introuvable."
                )

        if patient_id is not None:
            cursor.execute(
                "SELECT utilisateur_id FROM patients WHERE id = %s",
                (patient_id,)
            )
            patient = cursor.fetchone()
            if patient is None:
                raise HTTPException(
                    status_code=400,
                    detail="Dossier patient introuvable."
                )

            proprietaire_id = patient[0]
            if utilisateur_id is not None:
                if proprietaire_id != utilisateur_id:
                    raise HTTPException(
                        status_code=403,
                        detail="Ce dossier ne correspond pas à cet utilisateur."
                    )
            elif proprietaire_id is not None:
                raise HTTPException(
                    status_code=403,
                    detail="Ce dossier appartient à un utilisateur connecté."
                )

        elif utilisateur_id is not None:
            cursor.execute(
                "SELECT id FROM patients WHERE utilisateur_id = %s "
                "ORDER BY id LIMIT 1",
                (utilisateur_id,)
            )
            ligne = cursor.fetchone()
            if ligne:
                patient_id = ligne[0]
            else:
                cursor.execute(
                    "INSERT INTO patients (utilisateur_id) VALUES (%s) "
                    "RETURNING id",
                    (utilisateur_id,)
                )
                patient_id = cursor.fetchone()[0]

        else:
            # Créer un dossier anonyme si aucun identifiant n'est fourni.
            cursor.execute(
                "INSERT INTO patients (utilisateur_id) VALUES (NULL) "
                "RETURNING id"
            )
            patient_id = cursor.fetchone()[0]

        donnees_json = donnees.model_dump_json()
        diagnostic = str(resultat.get("diagnostic", "Non déterminé"))
        gravite = str(resultat.get("niveau_gravite", "Non déterminée"))
        probabilite = resultat.get("probabilite")

        cursor.execute("""
            INSERT INTO diagnostics (
                patient_id, type_diagnostic, donnees_saisies,
                resultat, niveau_gravite, probabilite
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            patient_id,
            type_diagnostic,
            donnees_json,
            diagnostic,
            gravite,
            float(probabilite) if probabilite is not None else None
        ))

        diagnostic_id = cursor.fetchone()[0]
        conn.commit()

        resultat["patient_id"] = patient_id
        resultat["diagnostic_id"] = diagnostic_id
        return resultat

    except HTTPException:
        conn.rollback()
        raise
    except Exception as erreur:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Enregistrement du diagnostic impossible : {erreur}"
        )
    finally:
        if cursor is not None:
            cursor.close()
        conn.close()


def lire_historique(cursor, patient_id):
    cursor.execute("""
        SELECT id, type_diagnostic, resultat,
               niveau_gravite, probabilite, date_diagnostic
        FROM diagnostics
        WHERE patient_id = %s
        ORDER BY date_diagnostic DESC
    """, (patient_id,))

    lignes = cursor.fetchall()
    return {
        "patient_id": patient_id,
        "historique": [
            {
                "id": ligne[0],
                "type": ligne[1],
                "resultat": ligne[2],
                "gravite": ligne[3],
                "probabilite": ligne[4],
                "date": ligne[5].isoformat() if ligne[5] else None
            }
            for ligne in lignes
        ]
    }


# ============================================================
# ROUTE — DIAGNOSTIC PAR SYMPTÔMES
# ============================================================

@routeur.post("/symptomes")
def diagnostic_symptomes(donnees: DonneesSymptomes):
    try:
        # Si des symptômes sont fournis → diagnostic basé symptômes
        if donnees.symptomes and len(donnees.symptomes) > 0:
            resultats = analyser_symptomes(
                donnees.symptomes,
                donnees.sexe_code,
                donnees.tranche_age or 'adulte'
            )

            diagnostic = generer_diagnostic(
                resultats['carence_fer'],
                resultats['carence_vitamine_a'],
                resultats['carence_calcium']
            )

            # Les scores symptomatiques ne constituent pas une
            # évaluation clinique validée de la gravité.
            gravite = 'À évaluer'

            recommandations = generer_recommandations_personnalisees(
                resultats['carence_fer'],
                resultats['carence_vitamine_a'],
                resultats['carence_calcium'],
                sexe='femme' if donnees.sexe_code == 0 else 'homme',
                situation='',
                tranche_age=donnees.tranche_age or 'adulte',
                commentaire_libre=donnees.commentaire_libre or ''
            )

            # Calcul confiance basé sur nb de symptômes analysés
            nb_symptomes = len(donnees.symptomes)
            confiance = min(95, 60 + (nb_symptomes * 1.5))

                        # Analyse cas inattendus
            cas_inattendus = analyser_cas_inattendus(
                donnees.commentaire_libre or '',
                donnees.symptomes or {},
                donnees.sexe_code,
                donnees.tranche_age or 'adulte'
            )

            return enregistrer_diagnostic(donnees, {
                "diagnostic": diagnostic,
                "probabilite": round(confiance, 1),
                "niveau_gravite": gravite,
                "analyses_nutriments": resultats['analyses'],
                "recommandations": recommandations,
                "cas_inattendus": cas_inattendus,
                "type": "symptomes",
                "base_sur": "symptômes déclarés",
                "nb_symptomes_analyses": nb_symptomes,
            }, "symptomes")

        # Sinon : prédiction nutritionnelle avec le pipeline V2.
        else:
            correspondance_sexe = {
                0: "Female",
                1: "Male",
            }
            correspondance_activite = {
                0: "Active",
                1: "Moderate",
                2: "Sedentary",
            }

            if donnees.sexe_code not in correspondance_sexe:
                raise HTTPException(
                    status_code=422,
                    detail="Code de sexe invalide. Valeurs attendues : 0 ou 1."
                )

            if donnees.activite_code not in correspondance_activite:
                raise HTTPException(
                    status_code=422,
                    detail="Code d'activité invalide. Valeurs attendues : 0, 1 ou 2."
                )

            caracteristiques = pd.DataFrame([{
                "Age": donnees.age,
                "Height (cm)": donnees.taille_cm,
                "Weight (kg)": donnees.poids_kg,
                "Caloric Intake (kcal/day)": donnees.apport_calorique,
                "Vitamin A Intake (mg/day)": donnees.apport_vitamine_a,
                "Iron Intake (mg/day)": donnees.apport_fer,
                "Calcium Intake (mg/day)": donnees.apport_calcium,
                "Gender": correspondance_sexe[donnees.sexe_code],
                "Activity Level": correspondance_activite[donnees.activite_code],
            }])

            # Le pipeline applique son propre prétraitement.
            diagnostic = str(
                modele_nutritionnel_v2.predict(caracteristiques)[0]
            )
            probabilites = modele_nutritionnel_v2.predict_proba(
                caracteristiques
            )[0]
            probabilite_max = float(probabilites.max())

            carence_fer = "fer" in diagnostic.lower()
            carence_va = "vitamine a" in diagnostic.lower()
            carence_ca = "calcium" in diagnostic.lower()

            recommandations = generer_recommandations_personnalisees(
                carence_fer,
                carence_va,
                carence_ca,
                sexe="femme" if donnees.sexe_code == 0 else "homme",
                situation="",
                tranche_age=donnees.tranche_age or "adulte",
            )

            return enregistrer_diagnostic(donnees, {
                "diagnostic": diagnostic,
                "probabilite": round(probabilite_max * 100, 1),
                "niveau_gravite": "À évaluer",
                "recommandations": recommandations,
                "type": "symptomes",
                "base_sur": "modèle nutritionnel V2",
                "avertissement": (
                    "Estimation fondée sur les apports alimentaires déclarés. "
                    "Ce résultat ne confirme pas une carence médicale."
                ),
            }, "symptomes")

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Une erreur interne est survenue pendant le diagnostic."
        )


# ============================================================
# ROUTE — DIAGNOSTIC BIOLOGIQUE
# ============================================================

@routeur.post("/biologique")
def diagnostic_biologique(donnees: DonneesBiologiques):
    try:
        # Traduction explicite des classes du modèle biologique V2.
        traduction_biologique = {
            "Healthy": "Normal",
            "Iron deficiency anemia": "Carence en fer",
            "Leukemia": "Leucémie",
            "Leukemia with thrombocytopenia":
                "Leucémie avec thrombocytopénie",
            "Macrocytic anemia": "Anémie macrocytaire",
            "Normocytic hypochromic anemia":
                "Anémie hypochrome normocytaire",
            "Normocytic normochromic anemia":
                "Anémie normochrome normocytaire",
            "Other microcytic anemia": "Autre anémie microcytaire",
            "Thrombocytopenia": "Thrombocytopénie",
        }

        colonnes_biologiques = [
            "WBC", "LYMp", "NEUTp", "LYMn", "NEUTn", "RBC",
            "HGB", "HCT", "MCV", "MCH", "MCHC", "PLT", "PDW", "PCT"
        ]

        caracteristiques = pd.DataFrame([[
            donnees.wbc, donnees.lymp, donnees.neutp,
            donnees.lymn, donnees.neutn, donnees.rbc,
            donnees.hgb, donnees.hct, donnees.mcv,
            donnees.mch, donnees.mchc, donnees.plt,
            donnees.pdw, donnees.pct
        ]], columns=colonnes_biologiques)

        # Ne pas normaliser manuellement : le pipeline V2 s'en charge.
        classe_modele = str(
            modele_biologique_v2.predict(caracteristiques)[0]
        )
        probabilites = modele_biologique_v2.predict_proba(
            caracteristiques
        )[0]
        probabilite_max = float(probabilites.max())

        diagnostic = traduction_biologique.get(classe_modele)
        if diagnostic is None:
            raise RuntimeError(
                f"Classe biologique V2 non reconnue : {classe_modele}"
            )


        # Analyses biologiques réelles avec valeurs fournies
        analyses_bio = [
            {
                'parametre': 'Hémoglobine (HGB)',
                'valeur': round(donnees.hgb, 2),
                'unite': 'g/dL',
                'normal': '12 - 17 g/dL',
                'statut': 'normal' if 12 <= donnees.hgb <= 17
                          else 'carence' if donnees.hgb < 12
                          else 'excès',
                'icone': '🟢' if 12 <= donnees.hgb <= 17
                         else '🔴',
            },
            {
                'parametre': 'Globules rouges (RBC)',
                'valeur': round(donnees.rbc, 2),
                'unite': 'M/µL',
                'normal': '4.2 - 5.4 M/µL',
                'statut': 'normal' if 4.2 <= donnees.rbc <= 5.4
                          else 'carence' if donnees.rbc < 4.2
                          else 'excès',
                'icone': '🟢' if 4.2 <= donnees.rbc <= 5.4
                         else '🔴',
            },
            {
                'parametre': 'Volume Corpusculaire Moyen (MCV)',
                'valeur': round(donnees.mcv, 2),
                'unite': 'fL',
                'normal': '80 - 100 fL',
                'statut': 'normal' if 80 <= donnees.mcv <= 100
                          else 'carence' if donnees.mcv < 80
                          else 'excès',
                'icone': '🟢' if 80 <= donnees.mcv <= 100
                         else '🔴',
            },
        ]

        # La classe prédite par le modèle reste le résultat principal.
        # Les seuils biologiques servent uniquement à signaler une anomalie
        # simple ; ils ne permettent pas de confirmer une maladie.

        diagnostic_final = diagnostic

        carence_fer = (
            'fer' in diagnostic.lower()
            or 'anémie' in diagnostic.lower()
        )

        # Gravité indicative fondée sur les valeurs biologiques.
        # Elle ne remplace pas une évaluation par un professionnel de santé.
        if donnees.hgb < 8 or donnees.rbc < 3.0:
            gravite = 'Sévère'
        elif donnees.hgb < 11 or donnees.rbc < 3.8:
            gravite = 'Modérée'
        else:
            gravite = 'À évaluer'

        # Certaines classes prédites nécessitent une mise en garde
        # spécifique : les conseils alimentaires ne suffisent pas.
        categories_a_evaluer_rapidement = {
            'Leucémie',
            'Leucémie avec thrombocytopénie',
            'Thrombocytopénie',
        }

        # Harmoniser le niveau affiché avec l'alerte médicale.
        # Cette indication demande une vérification, sans confirmer
        # une maladie ni constituer une évaluation clinique validée.
        if diagnostic in categories_a_evaluer_rapidement:
            gravite = 'Vérification médicale'

        if diagnostic in categories_a_evaluer_rapidement:
            recommandations = {
                "aliments": [],
                "conseils": (
                    "⚠️ RÉSULTAT À PRENDRE AU SÉRIEUX\n\n"
                    "Le modèle d'intelligence artificielle a identifié "
                    "un résultat qui nécessite une vérification médicale. "
                    "Ce résultat ne confirme pas une maladie et ne remplace "
                    "pas l'interprétation d'un professionnel de santé.\n\n"
                    "🏥 Consultez rapidement un médecin ou un agent de santé "
                    "qualifié pour faire examiner vos résultats biologiques "
                    "et déterminer les examens complémentaires nécessaires.\n\n"
                    "🚨 Si vous présentez un saignement important, des "
                    "difficultés respiratoires, un malaise ou une faiblesse "
                    "extrême, recherchez immédiatement des soins d'urgence.\n\n"
                    "Les conseils alimentaires ne peuvent pas remplacer "
                    "cette évaluation médicale."
                ),
            }
        else:
            recommandations = generer_recommandations_personnalisees(
                carence_fer, False, False,
                sexe=donnees.sexe or '',
                situation=donnees.situation or '',
                tranche_age=donnees.tranche_age or 'adulte'
            )

        return enregistrer_diagnostic(donnees, {
            "diagnostic": diagnostic_final,
            "probabilite": round(probabilite_max * 100, 1),
            "niveau_gravite": gravite,
            "analyses_biologiques": analyses_bio,
            "recommandations": recommandations,
            "type": "biologique",
            "base_sur": "modèle IA et valeurs biologiques fournies",
        }, "biologique")

    except HTTPException:
        raise
    except Exception:
        import logging
        logging.getLogger(__name__).exception(
            "Erreur interne pendant le diagnostic biologique"
        )
        raise HTTPException(
            status_code=500,
            detail="Une erreur interne est survenue pendant le diagnostic."
        )


# ============================================================
# ROUTE — HISTORIQUE PATIENT
# ============================================================

@routeur.get("/historique/{patient_id}")
def historique_patient(patient_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Erreur de connexion")
    cursor = None
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM patients WHERE id = %s", (patient_id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail="Patient introuvable")
        return lire_historique(cursor, patient_id)
    except HTTPException:
        raise
    except Exception as erreur:
        raise HTTPException(status_code=500, detail=str(erreur))
    finally:
        if cursor is not None:
            cursor.close()
        conn.close()


@routeur.get("/historique-utilisateur/{utilisateur_id}")
def historique_utilisateur(utilisateur_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Erreur de connexion")
    cursor = None
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id FROM patients WHERE utilisateur_id = %s "
            "ORDER BY id LIMIT 1",
            (utilisateur_id,)
        )
        ligne = cursor.fetchone()
        if ligne is None:
            return {"patient_id": None, "historique": []}
        return lire_historique(cursor, ligne[0])
    except Exception as erreur:
        raise HTTPException(status_code=500, detail=str(erreur))
    finally:
        if cursor is not None:
            cursor.close()
        conn.close()


@routeur.delete("/historique/{patient_id}/{diagnostic_id}")
def supprimer_diagnostic(patient_id: int, diagnostic_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Erreur de connexion")
    cursor = None
    try:
        cursor = conn.cursor()
        cursor.execute("""
            DELETE FROM diagnostics
            WHERE id = %s AND patient_id = %s
            RETURNING id
        """, (diagnostic_id, patient_id))
        supprime = cursor.fetchone()
        if supprime is None:
            raise HTTPException(
                status_code=404,
                detail="Diagnostic introuvable pour ce patient."
            )
        conn.commit()
        return {
            "message": "Diagnostic supprimé.",
            "diagnostic_id": supprime[0],
            "patient_id": patient_id
        }
    except HTTPException:
        conn.rollback()
        raise
    except Exception as erreur:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(erreur))
    finally:
        if cursor is not None:
            cursor.close()
        conn.close()
