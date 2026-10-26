"""Fonctions JWT et identification des utilisateurs pour NutriPredict."""

import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError

from database.db import get_connection

# Charge la configuration locale sans afficher les secrets.
load_dotenv(Path(__file__).resolve().parent / ".env")

JWT_SECRET = os.environ.get("JWT_SECRET")
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")

try:
    JWT_EXPIRE_MINUTES = int(os.environ.get("JWT_EXPIRE_MINUTES", "60"))
except ValueError as exc:
    raise RuntimeError(
        "JWT_EXPIRE_MINUTES doit être un entier."
    ) from exc

if not JWT_SECRET or len(JWT_SECRET) < 32:
    raise RuntimeError(
        "JWT_SECRET absent ou trop court. Configurez-le dans backend/.env."
    )

if JWT_ALGORITHM != "HS256":
    raise RuntimeError(
        "Seul l'algorithme JWT HS256 est autorisé par cette configuration."
    )

if JWT_EXPIRE_MINUTES < 1:
    raise RuntimeError("JWT_EXPIRE_MINUTES doit être supérieur à zéro.")

bearer_scheme = HTTPBearer(auto_error=False)


def creer_jeton_acces(utilisateur_id: int, role: str) -> str:
    """Crée un jeton d'accès signé, avec une durée de vie limitée."""
    maintenant = datetime.now(timezone.utc)

    charge: dict[str, Any] = {
        "sub": str(int(utilisateur_id)),
        "role": str(role),
        "iat": maintenant,
        "exp": maintenant + timedelta(minutes=JWT_EXPIRE_MINUTES),
    }

    return jwt.encode(
        charge,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )


def obtenir_utilisateur_connecte(
    identifiants: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
) -> dict[str, Any]:
    """Valide le JWT et relit le rôle courant depuis la base de données."""

    erreur_auth = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentification requise ou jeton invalide/expiré.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if identifiants is None or identifiants.scheme.lower() != "bearer":
        raise erreur_auth

    try:
        charge = jwt.decode(
            identifiants.credentials,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
            options={"require": ["sub", "exp", "iat"]},
        )

        utilisateur_id = int(charge["sub"])

        if utilisateur_id <= 0:
            raise ValueError("Identifiant invalide")

    except (InvalidTokenError, KeyError, TypeError, ValueError):
        raise erreur_auth

    conn = get_connection()

    if conn is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service de base de données indisponible.",
        )

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, nom, prenom, email, role
                FROM utilisateurs
                WHERE id = %s
                """,
                (utilisateur_id,),
            )
            utilisateur = cursor.fetchone()
    finally:
        conn.close()

    if not utilisateur:
        raise erreur_auth

    # Le rôle est relu dans la base : le rôle inscrit dans le JWT
    # ne suffit pas à accorder des privilèges.
    return {
        "id": utilisateur[0],
        "nom": utilisateur[1],
        "prenom": utilisateur[2],
        "email": utilisateur[3],
        "role": utilisateur[4],
    }


def exiger_administrateur(
    utilisateur: dict[str, Any] = Depends(obtenir_utilisateur_connecte),
) -> dict[str, Any]:
    """Refuse l'accès aux comptes qui ne possèdent pas le rôle admin."""

    if utilisateur.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs.",
        )

    return utilisateur
