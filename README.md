# Fiche Chute

Application web française pour saisir et analyser les fiches anonymisées d’enquête sur le risque de chute chez la personne âgée au CHU d’Angré (2026).

## Prérequis et installation

- Node.js 20 ou plus récent
- npm
- Un projet Supabase

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000). Pour vérifier le projet :

```bash
npm test
npm run build
```

## Configuration Supabase

1. Créer un projet sur [supabase.com](https://supabase.com/) et choisir une région adaptée à vos obligations de protection des données de santé.
2. Dans **SQL Editor**, exécuter le contenu de [`supabase/schema.sql`](./supabase/schema.sql). Il crée la table `fiches`, les index, le trigger `updated_at` et les politiques RLS pour les comptes authentifiés.
3. Créer manuellement l’unique compte médecin dans **Authentication → Users → Add user**. Ne pas activer les inscriptions publiques : dans **Authentication → Settings / User Signups**, désactiver **Enable sign ups**.
4. Dans **Project Settings → API**, copier l’URL du projet et la clé `anon` publique. Les placer dans `.env.local` :

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
```

La clé `service_role` ne doit jamais être ajoutée à l’application cliente ou à un dépôt. Une fois les variables renseignées, redémarrer `npm run dev`. Les dix fiches fictives facultatives peuvent être ajoutées en exécutant [`supabase/seed.sql`](./supabase/seed.sql) après le schéma.

## Déploiement Vercel

1. Importer le dépôt dans Vercel et choisir le framework **Next.js**.
2. Ajouter `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans les variables d’environnement pour les environnements nécessaires.
3. Déployer. Configurer les URL de redirection et l’URL du site dans **Supabase → Authentication → URL Configuration** (URL de production et URL locale de développement).
4. Vérifier la connexion, la création d’une fiche, les politiques RLS et l’export avant l’usage en étude.

## Architecture

- [`src/config/formSchema.ts`](./src/config/formSchema.ts) est la source unique des sections et variables de la fiche. Les réponses et valeurs calculées sont persistées en JSONB ; l’ajout ou le retrait d’une variable de fiche ne nécessite pas de migration.
- [`src/lib/calculs.ts`](./src/lib/calculs.ts) regroupe les calculs purs et leurs seuils ajustables.
- L’authentification est fournie par Supabase Auth ; toutes les routes applicatives sont protégées et aucune route d’inscription n’est exposée.
- Les données enregistrées sont anonymes : seul le numéro de fiche est recueilli, sans nom ni autre identifiant direct.

## Pages

- `/login` : connexion médecin
- `/fiches` : recherche, filtres et liste paginée
- `/fiches/nouvelle` : saisie guidée par sections et sauvegarde en brouillon
- `/fiches/[id]` : consultation, modification, suppression et PDF
- `/tableau-de-bord` : indicateurs et graphiques sur les fiches complètes
- `/export` : CSV UTF-8 BOM, XLSX et PDF ; plusieurs fiches PDF sont regroupées dans une archive ZIP
