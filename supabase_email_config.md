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
<h2>Bienvenue sur KetoSansStress !</h2>
<p>Merci de vous être inscrit(e) à KetoSansStress, votre compagnon cétogène au quotidien.</p>
<p>Pour activer votre compte, cliquez sur le lien ci-dessous :</p>
<p><a href="{{ .ConfirmationURL }}">Confirmer mon adresse email</a></p>
<p>Ce lien expire dans 24 heures.</p>
<hr>
<p>Si vous n'avez pas créé de compte KetoSansStress, vous pouvez ignorer cet email.</p>
<p>L'équipe KetoSansStress<br>contact@ketosansstress.com</p>
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