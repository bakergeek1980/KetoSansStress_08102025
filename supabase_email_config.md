# Configuration Email Supabase - KetoSansStress

## Configuration requise dans le Dashboard Supabase

### 1. Auth Settings
Allez dans **Authentication > Settings** et configurez :

- **Site URL**: `https://ketosansstress.app`
- **Additional Redirect URLs**: `https://ketosansstress.app/confirm`

### 2. SMTP Settings (Optionnel - pour email personnalisé)
Dans **Authentication > Settings > SMTP Settings** :

- **Enable custom SMTP**: ON
- **Sender name**: KetoSansStress
- **Sender email**: contact@ketosansstress.com
- **Host**: [Votre fournisseur SMTP]
- **Port**: 587 ou 465
- **Username**: contact@ketosansstress.com
- **Password**: [Mot de passe SMTP]

### 3. Email Templates
Dans **Authentication > Email Templates** :

#### Template "Confirm signup"
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmez votre inscription - KetoSansStress</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #fafafa;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
        <!-- Header avec logo -->
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 70px; height: 70px; background: #4CAF50; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: bold; color: white;">K</div>
            <h1 style="color: #4CAF50; margin: 0; font-size: 24px;">KetoSansStress</h1>
            <p style="color: #757575; margin: 5px 0 0; font-size: 14px;">Votre compagnon cétogène au quotidien</p>
        </div>

        <!-- Contenu personnalisé -->
        <h2 style="color: #212121; margin-bottom: 20px;">🎉 Bonjour {{ .UserMetaData.full_name }} !</h2>
        
        <p>Merci de vous être inscrit(e) à KetoSansStress ! Nous sommes ravis de vous accompagner dans votre parcours cétogène.</p>
        
        <p>Pour activer votre compte et commencer à utiliser l'application, cliquez sur le bouton ci-dessous :</p>

        <!-- Bouton de confirmation -->
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">✅ Confirmer mon inscription</a>
        </div>

        <!-- Instructions -->
        <div style="background: #f0f9f0; padding: 20px; border-radius: 8px; border-left: 4px solid #4CAF50; margin: 20px 0;">
            <h3 style="color: #4CAF50; margin-top: 0;">Prochaines étapes :</h3>
            <ol style="color: #555; margin: 0; padding-left: 20px;">
                <li>Cliquez sur le bouton de confirmation ci-dessus</li>
                <li>Vous serez redirigé(e) vers l'application</li>
                <li>Connectez-vous avec vos identifiants</li>
                <li>Commencez votre parcours cétogène personnalisé !</li>
            </ol>
        </div>

        <!-- Note de sécurité -->
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border: 1px solid #ffeaa7; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #856404;">
                🔒 <strong>Important :</strong> Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte KetoSansStress, vous pouvez ignorer cet email en toute sécurité.
            </p>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px; text-align: center; color: #757575; font-size: 14px;">
            <p>Besoin d'aide ? Contactez-nous à <a href="mailto:contact@ketosansstress.com" style="color: #4CAF50;">contact@ketosansstress.com</a></p>
            <p style="margin: 10px 0 0;">
                L'équipe KetoSansStress<br>
                <strong>contact@ketosansstress.com</strong>
            </p>
        </div>
    </div>
</body>
</html>
```

#### Template "Reset Password"
```html
<h2>Réinitialisation de mot de passe - KetoSansStress</h2>
<p>Vous avez demandé à réinitialiser votre mot de passe pour votre compte KetoSansStress.</p>
<p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
<p><a href="{{ .ConfirmationURL }}">Réinitialiser mon mot de passe</a></p>
<p>Ce lien expire dans 1 heure.</p>
<hr>
<p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.</p>
<p>L'équipe KetoSansStress<br>contact@ketosansstress.com</p>
```

### 4. Variables d'environnement Backend
Dans votre fichier `.env` backend, assurez-vous d'avoir :

```
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre-cle-anonyme
SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-role
```

### 5. Rate Limiting
Dans **Authentication > Settings > Rate Limiting** :

- **Enable**: ON
- **Email per hour**: 30 (ajustable selon vos besoins)

### 6. Sécurité supplémentaire
Dans **Authentication > Settings > Security** :

- **Enable email confirmations**: ON
- **Secure email change**: ON
- **Double confirm email changes**: ON

## Notes importantes

1. **Domaine d'expédition** : Si vous utilisez SMTP personnalisé, configurez les enregistrements DNS (SPF, DKIM, DMARC) pour `ketosansstress.com`

2. **Test** : Après configuration, testez l'inscription avec une vraie adresse email

3. **Production** : En production, assurez-vous que tous les liens pointent vers `https://ketosansstress.app`

4. **Monitoring** : Surveillez les logs d'email dans le dashboard Supabase pour détecter les problèmes de livraison

## Variables frontend
L'application utilise automatiquement ces URL configurées dans l'AuthContext :
- Page de confirmation : `/email-confirmation`
- Redirect après confirmation : `/(tabs)` (dashboard)