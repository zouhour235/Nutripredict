from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import diagnostic, authentification, administration

# ============================================================
# INITIALISATION DE L'APPLICATION
# ============================================================

application = FastAPI(
    title="NutriPredict API",
    description="Système de Diagnostic Prédictif des Carences Nutritionnelles par IA",
    version="1.0.0"
)

# Configuration CORS pour React Native
application.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routes
application.include_router(
    authentification.routeur,
    prefix="/auth",
    tags=["Authentification"]
)

application.include_router(
    diagnostic.routeur,
    prefix="/diagnostic",
    tags=["Diagnostic"]
)

application.include_router(
    administration.routeur,
    prefix="/admin",
    tags=["Administration"]
)

# Route de test
@application.get("/")
def accueil():
    return {
        "message": "Bienvenue sur NutriPredict API",
        "version": "1.0.0",
        "statut": "En ligne"
    }