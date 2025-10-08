import os
import secrets
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from jinja2 import Environment, FileSystemLoader, select_autoescape
from pathlib import Path

logger = logging.getLogger(__name__)

class EmailService:
    """Service de gestion des emails avec templates HTML"""
    
    def __init__(self):
        # Configuration des templates
        template_dir = Path(__file__).parent.parent.parent / "templates"
        self.env = Environment(
            loader=FileSystemLoader(template_dir),
            autoescape=select_autoescape(['html', 'xml'])
        )
        
        # Configuration de base
        self.base_url = os.getenv("FRONTEND_URL", "https://ketosansstress.app")
        self.from_email = os.getenv("MAIL_FROM", "noreply@ketosansstress.app")
        
    def generate_confirmation_token(self) -> str:
        """Générer un token unique pour la confirmation email"""
        return secrets.token_urlsafe(32)
    
    def get_confirmation_link(self, token: str) -> str:
        """Générer le lien de confirmation avec le token"""
        return f"{self.base_url}/api/auth/confirm-email?token={token}"
    
    def render_email_confirmation_template(self, first_name: str, token: str) -> str:
        """Rendre le template HTML d'email de confirmation"""
        try:
            template = self.env.get_template('email-confirmation.html')
            confirmation_link = self.get_confirmation_link(token)
            
            return template.render(
                first_name=first_name,
                confirmation_link=confirmation_link
            )
        except Exception as e:
            logger.error(f"Error rendering email confirmation template: {e}")
            return self._get_fallback_email_html(first_name, token)
    
    def render_email_confirmed_page(self, first_name: str = "utilisateur") -> str:
        """Rendre la page HTML de confirmation réussie"""
        try:
            template = self.env.get_template('email-confirmed.html')
            return template.render(first_name=first_name)
        except Exception as e:
            logger.error(f"Error rendering email confirmed page: {e}")
            return self._get_fallback_confirmed_html(first_name)
    
    def render_error_page(self, error_message: str) -> str:
        """Rendre une page d'erreur HTML"""
        return f"""
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Erreur - Keto Sans Stress</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: #FAFAFA;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                    padding: 20px;
                }}
                .container {{
                    background: white;
                    border-radius: 16px;
                    padding: 40px;
                    max-width: 500px;
                    text-align: center;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }}
                .error-icon {{
                    font-size: 64px;
                    margin-bottom: 16px;
                }}
                h1 {{
                    color: #F44336;
                    font-size: 24px;
                    margin-bottom: 16px;
                }}
                p {{
                    color: #757575;
                    font-size: 16px;
                    line-height: 1.6;
                }}
                .back-link {{
                    color: #4CAF50;
                    text-decoration: none;
                    font-weight: 500;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="error-icon">❌</div>
                <h1>Une erreur s'est produite</h1>
                <p>{error_message}</p>
                <p><a href="/" class="back-link">← Retour à l'accueil</a></p>
            </div>
        </body>
        </html>
        """
    
    def _get_fallback_email_html(self, first_name: str, token: str) -> str:
        """HTML de fallback si le template ne peut pas être rendu"""
        confirmation_link = self.get_confirmation_link(token)
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Confirmez votre email - Keto Sans Stress</title>
        </head>
        <body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
                <h1 style="color: #4CAF50;">🥑 Keto Sans Stress</h1>
                <h2>Bienvenue {first_name} !</h2>
                <p>Merci de vous être inscrit. Veuillez confirmer votre email :</p>
                <a href="{confirmation_link}" style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
                    Confirmer mon email
                </a>
                <p>Ou copiez ce lien : <br>{confirmation_link}</p>
            </div>
        </body>
        </html>
        """
    
    def _get_fallback_confirmed_html(self, first_name: str) -> str:
        """HTML de fallback pour la page de confirmation"""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Email confirmé - Keto Sans Stress</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
            <div style="max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 20px;">🥑</div>
                <h1 style="color: #4CAF50;">Keto Sans Stress</h1>
                <h2 style="color: #212121;">✅ Email confirmé !</h2>
                <p style="color: #757575;">Merci {first_name} ! Votre email a été confirmé avec succès.</p>
                <button onclick="window.location.href='ketosansstress://login'" style="background: #4CAF50; color: white; padding: 16px 32px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; margin-top: 20px;">
                    Ouvrir l'application
                </button>
            </div>
        </body>
        </html>
        """

# Instance globale du service
email_service = EmailService()

# Fonctions utilitaires
def generate_confirmation_token() -> str:
    """Générer un token de confirmation"""
    return email_service.generate_confirmation_token()

def render_confirmation_email(first_name: str, token: str) -> str:
    """Rendre l'email de confirmation"""
    return email_service.render_email_confirmation_template(first_name, token)

def render_confirmed_page(first_name: str = "utilisateur") -> str:
    """Rendre la page de confirmation réussie"""
    return email_service.render_email_confirmed_page(first_name)

def render_error_page(error_message: str) -> str:
    """Rendre une page d'erreur"""
    return email_service.render_error_page(error_message)