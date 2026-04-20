

## Espace dédié aux moniteurs (admin)

Création d'un espace de connexion/inscription séparé pour les moniteurs, avec validation par un admin existant.

### Nouvelles pages

**`/admin/connexion`** — Page de connexion dédiée
- Formulaire email + mot de passe (style sobre, badge "Espace moniteur")
- Si l'utilisateur n'a pas le rôle `admin` après login → message d'erreur clair + déconnexion automatique + invitation à patienter pour la validation
- Lien vers `/admin/inscription`

**`/admin/inscription`** — Demande de compte moniteur
- Champs : prénom, nom, email, mot de passe (pas d'âge)
- À la soumission : crée le compte Supabase avec un `meta.requested_role = "admin"` et `age = null`
- Le trigger `handle_new_user` continue de créer un profil + rôle `enfant` par défaut (pas de privilège)
- Une nouvelle table `admin_requests` enregistre la demande en attente (status `pending`)
- Message de confirmation : "Ta demande a été envoyée. Un moniteur déjà actif doit la valider avant que tu puisses accéder à l'espace admin."

### Validation côté admin existant

**Nouvelle section dans `/admin` (Tableau de bord)** : carte "Demandes de moniteurs en attente"
- Liste des demandes `pending` (nom, email, date)
- Bouton **Approuver** → ajoute le rôle `admin` dans `user_roles` + passe la demande en `approved`
- Bouton **Refuser** → marque la demande `rejected` (le compte reste enfant)
- Badge sur le menu latéral si demandes en attente

### Modèle de données

Nouvelle table `admin_requests` :
- `id` uuid, `user_id` uuid (référence profile), `first_name`, `last_name`, `email`
- `status` enum (`pending` | `approved` | `rejected`)
- `created_at`, `reviewed_at`, `reviewed_by`

RLS :
- Insert : utilisateur authentifié peut créer sa propre demande (`auth.uid() = user_id`)
- Select/Update : seulement les admins (`has_role(auth.uid(), 'admin')`)
- L'utilisateur peut lire sa propre demande pour connaître son statut

### Cas particulier : tout premier admin

Comme cette logique nécessite un admin existant, on inclut un **bootstrap one-shot** : si la table `user_roles` ne contient aucun admin au moment d'approuver, le premier utilisateur que tu passes manuellement (via la console backend) deviendra admin. Tu as déjà un compte admin actif (`isaaclys15@gmail.com` d'après les logs) → cas couvert.

### Header & navigation

- Header public inchangé (Connexion / S'inscrire pointent toujours vers `/connexion` et `/inscription` pour les enfants)
- Ajout d'un petit lien discret en bas de page (`Footer`) : "Espace moniteur" → `/admin/connexion`
- `AdminLayout` redirige désormais vers `/admin/connexion` (au lieu de `/connexion`) si non connecté

### Fichiers

**Créés :**
- `src/pages/admin/AdminConnexion.tsx`
- `src/pages/admin/AdminInscription.tsx`
- `src/components/admin/PendingAdminRequests.tsx`
- Migration SQL : table `admin_requests` + enum + RLS

**Modifiés :**
- `src/App.tsx` — nouvelles routes
- `src/components/AdminLayout.tsx` — redirige vers `/admin/connexion`
- `src/pages/admin/AdminDashboard.tsx` — intègre la section demandes
- `src/components/Footer.tsx` — lien discret "Espace moniteur"
- `src/lib/validation.ts` — schéma `adminSignUpSchema`

