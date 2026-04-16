
## École du Dimanche — Application de quizz bibliques

Une application web en français, design **spirituel & doux** (bleu nuit profond, touches dorées, beige crème, typographie élégante type serif pour les titres + sans-serif lisible pour le corps), permettant aux enfants de jouer aux quizz hebdomadaires et au moniteur d'animer le contenu.

### Rôles
- **Enfant** : s'inscrit, joue aux quizz, consulte ses scores et le classement
- **Admin (moniteur)** : crée les quizz, publie l'évangile du jour, gère les annonces et horaires

### Pages & fonctionnalités

**1. Accueil (page de présentation)** — publique
- Évangile du jour (verset + court commentaire) mis en avant
- Carte « Quizz du dimanche » avec accès direct s'il est actif
- Top 5 des meilleurs juniors (mois en cours)
- Horaires de l'école du dimanche
- Annonces récentes
- Aperçu des derniers quizz passés

**2. Inscription / Connexion**
- Inscription : prénom, nom, âge, email, mot de passe
- Connexion email + mot de passe
- Auth gérée par Lovable Cloud, profil enfant créé automatiquement

**3. Calendrier des quizz**
- Liste/grille de tous les quizz (du plus récent au plus ancien)
- Recherche par date + filtre (fait / non fait)
- Pagination
- Badge « Nouveau » pour le quizz du dimanche en cours
- Clic → ouvre le quizz (ou son récapitulatif si déjà fait)

**4. Page de quizz (formulaire de réponse)**
- Affichage question par question, QCM (4 choix)
- Barre de progression
- Bouton Précédent/Suivant
- Soumission finale → calcule le score automatiquement

**5. Récapitulatif du quizz**
- Score obtenu / total
- Détail question par question : bonne réponse vs réponse de l'enfant
- Verset/référence biblique liée
- Bouton retour au calendrier

**6. Classement**
- Onglets : Top du mois / Classement général
- Position de l'enfant connecté mise en évidence

**7. Espace Admin (moniteur)** — accès protégé par rôle
- Créer/éditer un quizz (titre, date de publication, questions QCM avec réponse correcte)
- Publier l'évangile du jour
- Gérer annonces et horaires
- Voir statistiques de participation

### Modèle de données (Lovable Cloud)
- `profiles` (lié à auth.users) : prénom, nom, âge
- `user_roles` (séparée, sécurisée) : enfant / admin
- `quizzes` : titre, date, statut publié
- `questions` : appartient à un quizz, intitulé, options (4), index réponse correcte
- `quiz_attempts` : enfant + quizz + score + date
- `attempt_answers` : réponses données par question
- `daily_gospel` : verset, référence, commentaire, date
- `announcements` : titre, contenu, date
- `schedules` : jour, heure, lieu, description

Toutes les tables protégées par RLS : un enfant ne voit/modifie que ses propres tentatives ; les admins gèrent le contenu via la fonction sécurisée `has_role`.

### Direction visuelle
- Palette : bleu nuit `#1a2745`, or doux `#c9a96e`, crème `#f7f1e6`, blanc cassé
- Typographie titres : serif élégante (Cormorant Garamond ou Playfair)
- Corps : Inter / sans-serif
- Cartes arrondies douces, ombres subtiles, séparateurs dorés fins
- Icônes ligne fine (lucide-react)
- Responsive mobile-first (les enfants joueront souvent sur tablette/téléphone)

### Approche de livraison
On démarrera par : **fondations design system + page d'accueil + auth (inscription/connexion)**. Ensuite, à chaque demande de ta part, on ajoutera la page suivante (calendrier, quizz, récap, admin…) avec un code propre et réutilisable que tu pourras suivre.
