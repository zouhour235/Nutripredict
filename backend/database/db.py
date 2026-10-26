from dotenv import load_dotenv
from pathlib import Path
import os
import psycopg2
from psycopg2.extras import RealDictCursor


# Chargement sécurisé de la configuration depuis backend/.env
load_dotenv(Path(__file__).resolve().parents[1] / ".env")

# Configuration de la base de données
DB_CONFIG = {
    "dbname": "nutrition_db",
    "user": "nutrition_user",
    "password": os.getenv("DB_PASSWORD", ""),
    "host": "localhost",
    "port": "5432"
}

def get_connection():
    """Retourne une connexion à la base de données PostgreSQL"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"Erreur de connexion : {e}")
        return None

def test_connection():
    """Teste la connexion à la base de données"""
    conn = get_connection()
    if conn:
        print("✅ Connexion à nutrition_db réussie !")
        conn.close()
    else:
        print("❌ Échec de la connexion")

if __name__ == "__main__":
    test_connection()