from fastapi import APIRouter, HTTPException, Depends
from security import exiger_administrateur
from database.db import get_connection

routeur = APIRouter()

# ============================================================
# TABLEAU DE BORD
# ============================================================

@routeur.get("/tableau-de-bord", dependencies=[Depends(exiger_administrateur)])
def tableau_de_bord():
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500,
                          detail="Erreur de connexion")
    try:
        cursor = conn.cursor()

        # Nombre total d'utilisateurs
        cursor.execute("SELECT COUNT(*) FROM utilisateurs")
        total_utilisateurs = cursor.fetchone()[0]

        # Nombre total de diagnostics
        cursor.execute("SELECT COUNT(*) FROM diagnostics")
        total_diagnostics = cursor.fetchone()[0]

        # Nombre de patients
        cursor.execute(
            "SELECT COUNT(*) FROM utilisateurs WHERE role = 'patient'"
        )
        total_patients = cursor.fetchone()[0]

        # Nombre de médecins
        cursor.execute(
            "SELECT COUNT(*) FROM utilisateurs WHERE role = 'medecin'"
        )
        total_medecins = cursor.fetchone()[0]

        # Statistiques des diagnostics par résultat
        cursor.execute("""
            SELECT resultat, COUNT(*) as nombre
            FROM diagnostics
            GROUP BY resultat
            ORDER BY nombre DESC
        """)
        statistiques_carences = [
            {"carence": row[0], "nombre": row[1]}
            for row in cursor.fetchall()
        ]

        # Statistiques par niveau de gravité
        cursor.execute("""
            SELECT niveau_gravite, COUNT(*) as nombre
            FROM diagnostics
            GROUP BY niveau_gravite
            ORDER BY nombre DESC
        """)
        statistiques_gravite = [
            {"gravite": row[0], "nombre": row[1]}
            for row in cursor.fetchall()
        ]

        return {
            "total_utilisateurs": total_utilisateurs,
            "total_patients": total_patients,
            "total_medecins": total_medecins,
            "total_diagnostics": total_diagnostics,
            "statistiques_carences": statistiques_carences,
            "statistiques_gravite": statistiques_gravite
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


# ============================================================
# GESTION DES UTILISATEURS
# ============================================================

@routeur.get("/utilisateurs", dependencies=[Depends(exiger_administrateur)])
def liste_utilisateurs():
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500,
                          detail="Erreur de connexion")
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, nom, prenom, email, role, date_creation
            FROM utilisateurs
            ORDER BY date_creation DESC
        """)
        utilisateurs = cursor.fetchall()
        return {
            "utilisateurs": [
                {
                    "id": u[0],
                    "nom": u[1],
                    "prenom": u[2],
                    "email": u[3],
                    "role": u[4],
                    "date_creation": str(u[5])
                }
                for u in utilisateurs
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


@routeur.delete("/utilisateurs/{utilisateur_id}", dependencies=[Depends(exiger_administrateur)])
def supprimer_utilisateur(utilisateur_id: int):
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500,
                          detail="Erreur de connexion")
    try:
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM utilisateurs WHERE id = %s",
            (utilisateur_id,)
        )
        conn.commit()
        return {
            "message": f"Utilisateur {utilisateur_id} supprimé avec succès"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()


# ============================================================
# JOURNAL D'ACTIVITÉ
# ============================================================

@routeur.get("/journal", dependencies=[Depends(exiger_administrateur)])
def journal_activite():
    conn = get_connection()
    if not conn:
        raise HTTPException(status_code=500,
                          detail="Erreur de connexion")
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT j.id, u.nom, u.prenom,
                   j.action, j.date_action
            FROM journal_activite j
            JOIN utilisateurs u ON j.utilisateur_id = u.id
            ORDER BY j.date_action DESC
            LIMIT 50
        """)
        journal = cursor.fetchall()
        return {
            "journal": [
                {
                    "id": j[0],
                    "nom": j[1],
                    "prenom": j[2],
                    "action": j[3],
                    "date": str(j[4])
                }
                for j in journal
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()