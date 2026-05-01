---
[🇬🇧 ENGLISH VERSION]
> 🇫🇷 Une version française de ce document est disponible plus bas dans ce même fichier. / A French version of this document is available further down in this same file.

# Documentation: Seeding the Production Database (Neon)

This document explains how to manually force a data update on the production database (Neon) using the local seed script via Docker.

## ⚠️ Security Warning
**This operation deletes ALL existing data** in the target database (Users, Messages, Servers, etc.) before re-injecting data from the `seed.ts` file. Only use this during development or for a complete reset.

---

## Steps to follow

### 1. Preparing the `seed.ts` file
Before running the command, you must temporarily disable the security checks in `backend/prisma/seed.ts`:

1.  **Disable the population check**: Comment out this block at the beginning of the `main()` function:
    ```typescript
    // 1. SECURITY: Do not run seed if the database already contains users
    // const existingUserCount = await prisma.user.count();
    // if (existingUserCount > 0) {
    //   console.log("The database is already populated. Aborting seed to avoid data loss.");
    //   return;
    // }
    ```
2.  **Verify the cleaning order**: Ensure that the `deleteMany()` block includes all tables.
    *   **Why is this important?** Because of **Foreign Key constraints**. SQL prevents deleting a parent (e.g., a User) if a child (e.g., a Message) still points to it.
    *   **The rule:** Always clear "child" tables (those with the most dependencies like messages or reactions) **BEFORE** "parent" tables (Servers, Users). If you add new tables to the project later, remember to add them here in the correct order.

### 2. Running the command
The execution is done via Docker to use the backend's configured environment, but by injecting the Neon URL.

**Command to run (from the project root):**

```bash
docker compose exec -e DATABASE_URL="YOUR_NEON_URL_HERE" -e NODE_ENV=development backend npm run db:seed
```

*   `-e DATABASE_URL`: Temporarily replaces the local URL with the Neon one.
*   `-e NODE_ENV=development`: Forces the script to enter the cleaning block (`deleteMany`).

### 3. Finalization and Security (CRITICAL)
Once the terminal displays `Seed completed successfully`:

1.  **Restore security (VERY IMPORTANT)**: You must uncomment the security block in `seed.ts` to prevent any future accidental execution that would overwrite your data:
    ```typescript
    // 1. SECURITY: Do not run seed if the database already contains users
    const existingUserCount = await prisma.user.count();
    if (existingUserCount > 0) {
      console.log("The database is already populated. Aborting seed to avoid data loss.");
      return;
    }
    ```
2.  **Verification**: Log in to the online application to verify that the new data is present.

---

## Troubleshooting
- **`Foreign key constraint violated` error (P2003)**: Means a table contains data that prevents deleting another one (e.g., a DM preventing the deletion of a User). Add `await prisma.theTableInQuestion.deleteMany()` at the beginning of the cleaning block in `seed.ts`.
- **`tsx: Permission denied` error**: Occurs if you try to run the command outside of Docker. Always use `docker compose exec`.

---
---

[🇫🇷 VERSION FRANÇAISE]

# Documentation : Seeding de la Base de Données en Production (Neon)

Ce document explique comment forcer manuellement la mise à jour des données de la base de données en production (Neon) en utilisant le script de seed local via Docker.

## ⚠️ Avertissement de sécurité
**Cette opération supprime TOUTES les données existantes** dans la base de données ciblée (Utilisateurs, Messages, Serveurs, etc.) avant de réinjecter les données du fichier `seed.ts`. Ne l'utilisez qu'en phase de développement ou pour une remise à zéro complète.

---

## Étapes à suivre

### 1. Préparation du fichier `seed.ts`
Avant de lancer la commande, vous devez désactiver temporairement les sécurités dans `backend/prisma/seed.ts` :

1.  **Désactiver le check de remplissage** : Commentez ce bloc au début de la fonction `main()` :
    ```typescript
    // 1. SÉCURITÉ : Ne pas exécuter le seed si la base de données contient déjà des utilisateurs
    // const existingUserCount = await prisma.user.count();
    // if (existingUserCount > 0) {
    //   console.log("La base de données est déjà peuplée. Annulation du seed pour éviter la perte de données.");
    //   return;
    // }
    ```
2.  **Vérifier l'ordre de nettoyage** : Assurez-vous que le bloc `deleteMany()` inclut toutes les tables.
    *   **Pourquoi c'est important ?** À cause des contraintes de **clés étrangères (Foreign Keys)**. SQL interdit de supprimer un parent (ex: un Utilisateur) si un enfant (ex: un Message) pointe encore vers lui.
    *   **La règle :** On vide toujours les tables "enfants" (celles qui ont le plus de dépendances comme les messages ou réactions) **AVANT** les tables "parents" (Serveurs, Utilisateurs). Si vous ajoutez de nouvelles tables au projet plus tard, n'oubliez pas de les ajouter ici dans le bon ordre.

### 2. Exécution de la commande
L'exécution se fait via Docker pour utiliser l'environnement configuré du backend, mais en injectant l'URL de Neon.

**Commande à exécuter (depuis la racine du projet) :**

```bash
docker compose exec -e DATABASE_URL="URL_DB_PROD" -e NODE_ENV=development backend npm run db:seed
```

*   `-e DATABASE_URL` : Remplace temporairement l'URL locale par celle de Neon.
*   `-e NODE_ENV=development` : Force le script à entrer dans le bloc de nettoyage (`deleteMany`).

### 3. Finalisation et Sécurisation (CRITIQUE)
Une fois que le terminal affiche `Seed completed successfully` :

1.  **Rétablir la sécurité (TRÈS IMPORTANT)** : Décommentez impérativement le bloc de sécurité dans `seed.ts` pour empêcher toute exécution accidentelle future qui écraserait vos données :
    ```typescript
    // 1. SÉCURITÉ : Ne pas exécuter le seed si la base de données contient déjà des utilisateurs
    const existingUserCount = await prisma.user.count();
    if (existingUserCount > 0) {
      console.log("La base de données est déjà peuplée. Annulation du seed pour éviter la perte de données.");
      return;
    }
    ```
2.  **Vérification** : Connectez-vous à l'application en ligne pour vérifier que les nouvelles données sont présentes.

---

## Dépannage
- **Erreur `Foreign key constraint violated` (P2003)** : Signifie qu'une table contient des données qui empêchent la suppression d'une autre (ex: un DM qui empêche la suppression d'un User). Ajoutez `await prisma.laTableEnQuestion.deleteMany()` au début du bloc de nettoyage dans `seed.ts`.
- **Erreur `tsx: Permission denied`** : Arrive si vous essayez de lancer la commande hors de Docker. Utilisez toujours `docker compose exec`.
