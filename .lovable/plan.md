

## Création du compte super admin

Création manuelle d'un compte moniteur officiel avec privilèges admin pré-attribués pour Isaac Fanou. Ce compte servira de référence pour valider les futures demandes de moniteurs.

### Étapes d'exécution

1. **Création du compte auth** via une migration SQL utilisant `supabase.auth.admin` (côté serveur, dans une migration)
   - Email : `isaacfanou1512@gmail.com`
   - Mot de passe : `Kingzack15#`
   - Email auto-confirmé (pas de vérification nécessaire)
   - Métadonnées : `first_name: "Isaac"`, `last_name: "Fanou"`

2. **Création automatique du profil** via le trigger `handle_new_user` existant
   - Crée la ligne dans `profiles` (age = null)
   - Crée la ligne `enfant` dans `user_roles` (par défaut)

3. **Promotion en admin** dans la même migration
   - Ajoute la ligne `{ user_id, role: 'admin' }` dans `user_roles`
   - Le compte garde aussi le rôle `enfant` (sans impact, car `isAdmin` se base sur la présence de `admin`)

4. **Trace dans `admin_requests`** (optionnel mais propre)
   - Insère une ligne avec `status = 'approved'` pour garder une cohérence d'historique

### Détails techniques

La migration SQL utilisera un bloc `DO $$ ... $$` qui :
- Vérifie si l'utilisateur n'existe pas déjà dans `auth.users` (idempotence)
- S'il n'existe pas : insère directement dans `auth.users` avec un mot de passe hashé via `crypt()` et `gen_salt('bf')`, en simulant ce que fait Supabase Auth
- Récupère l'`id` généré pour ajouter le rôle admin

```text
auth.users (insert) → trigger handle_new_user → profiles + user_roles (enfant)
                                              ↓
                                  user_roles (admin) ajouté en plus
```

### Sécurité

- Le mot de passe sera hashé avec `bcrypt` directement en SQL (`crypt(password, gen_salt('bf'))`)
- Recommandation : changer le mot de passe à la première connexion via `/profil` ou via un reset
- Ce compte aura accès à `/admin` immédiatement après la migration

### Fichiers

**Créés :**
- Migration SQL : création du compte super admin + attribution du rôle

**Aucun fichier code modifié** — la logique d'approbation des futurs moniteurs est déjà en place via `PendingAdminRequests.tsx`.

### Après exécution

Tu pourras te connecter sur `/admin/connexion` avec :
- Email : `isaacfanou1512@gmail.com`
- Mot de passe : `Kingzack15#`

Et tu verras la section "Demandes de moniteurs" sur le tableau de bord pour approuver les futurs moniteurs.

