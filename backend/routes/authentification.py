from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database.db import get_connection
import bcrypt
from security import creer_jeton_acces, JWT_EXPIRE_MINUTES

routeur = APIRouter()

# ============================================================
# MODÈLES DE DONNÉES
# ============================================================

class InscriptionModele(BaseModel):
    nom: str
    prenom: str
    email: str
    mot_de_passe: str

class ConnexionModele(BaseModel):
    email: str
    mot_de_passe: str

# ============================================================
# ROUTES
# ============================================================

@routeur.post("/inscription")
def inscription(donnees: InscriptionModele):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500,
                          detail="Erreur de connexion à la base de données")
    try:
        cursor = conn.cursor()

        # Vérification email existant
        cursor.execute(
            "SELECT id FROM utilisateurs WHERE email = %s",
            (donnees.email,)
        )
        if cursor.fetchone():
            raise HTTPException(status_code=400,
                              detail="Email déjà utilisé")

        # Chiffrement du mot de passe
        mot_de_passe_chiffre = bcrypt.hashpw(
            donnees.mot_de_passe.encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')

        # Insertion dans la base de données
        cursor.execute("""
            INSERT INTO utilisateurs
            (nom, prenom, email, mot_de_passe, role)
            VALUES (%s, %s, %s, %s, 'patient')
            RETURNING id
        """, (donnees.nom, donnees.prenom, donnees.email,
              mot_de_passe_chiffre))

        utilisateur_id = cursor.fetchone()[0]
        conn.commit()

        return {
            "message": "Inscription réussie !",
            "utilisateur_id": utilisateur_id
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@routeur.post("/connexion")
def connexion(donnees: ConnexionModele):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500,
                          detail="Erreur de connexion à la base de données")
    try:
        cursor = conn.cursor()

        # Recherche de l'utilisateur
        cursor.execute("""
            SELECT id, nom, prenom, mot_de_passe, role
            FROM utilisateurs
            WHERE email = %s
        """, (donnees.email,))

        utilisateur = cursor.fetchone()

        if not utilisateur:
            raise HTTPException(status_code=401,
                              detail="Email ou mot de passe incorrect")

        # Vérification du mot de passe
        if not bcrypt.checkpw(
            donnees.mot_de_passe.encode('utf-8'),
            utilisateur[3].encode('utf-8')
        ):
            raise HTTPException(status_code=401,
                              detail="Email ou mot de passe incorrect")

        jeton = creer_jeton_acces(
            utilisateur_id=utilisateur[0],
            role=utilisateur[4],
        )

        return {
            "message": "Connexion réussie !",
            "utilisateur_id": utilisateur[0],
            "nom": utilisateur[1],
            "prenom": utilisateur[2],
            "role": utilisateur[4],
            "access_token": jeton,
            "token_type": "bearer",
            "expires_in": JWT_EXPIRE_MINUTES * 60,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()