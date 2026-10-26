from db import get_connection

def create_tables():
    conn = get_connection()
    if not conn:
        return
    
    cursor = conn.cursor()
    
    # Table utilisateurs
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS utilisateurs (
            id SERIAL PRIMARY KEY,
            nom VARCHAR(100) NOT NULL,
            prenom VARCHAR(100) NOT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            mot_de_passe VARCHAR(255) NOT NULL,
            role VARCHAR(20) DEFAULT 'patient',
            date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # Table patients
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS patients (
            id SERIAL PRIMARY KEY,
            utilisateur_id INTEGER REFERENCES utilisateurs(id),
            date_naissance DATE,
            sexe VARCHAR(10),
            poids FLOAT,
            taille FLOAT,
            region VARCHAR(100),
            telephone VARCHAR(20)
        );
    """)

    # Table diagnostics
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS diagnostics (
            id SERIAL PRIMARY KEY,
            patient_id INTEGER REFERENCES patients(id),
            type_diagnostic VARCHAR(50),
            donnees_saisies TEXT,
            resultat VARCHAR(100),
            niveau_gravite VARCHAR(20),
            probabilite FLOAT,
            date_diagnostic TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # Table carences
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS carences (
            id SERIAL PRIMARY KEY,
            nom VARCHAR(100) NOT NULL,
            description TEXT,
            symptomes TEXT,
            valeurs_biologiques TEXT,
            signes_visuels TEXT
        );
    """)

    # Table recommandations
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS recommandations (
            id SERIAL PRIMARY KEY,
            carence_id INTEGER REFERENCES carences(id),
            aliments_conseilles TEXT,
            plan_nutritionnel TEXT,
            conseils_prevention TEXT
        );
    """)

    # Table rapports
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS rapports (
            id SERIAL PRIMARY KEY,
            medecin_id INTEGER REFERENCES utilisateurs(id),
            patient_id INTEGER REFERENCES patients(id),
            contenu TEXT,
            date_generation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # Table journal activite
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS journal_activite (
            id SERIAL PRIMARY KEY,
            utilisateur_id INTEGER REFERENCES utilisateurs(id),
            action VARCHAR(255),
            date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    conn.commit()
    cursor.close()
    conn.close()
    print("✅ Toutes les tables créées avec succès !")

if __name__ == "__main__":
    create_tables()