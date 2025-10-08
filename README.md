# Projet Gestion Pro

Version en ligne : [gestion-pro-4jtq.onrender.com](https://gestion-pro-4jtq.onrender.com)

---

## 🚀 Description & objectifs

Stack : Next.js 15 (App Router) + Tailwind CSS + DaisyUI + Prisma + NextAuth (Credentials)
Pattern principal : Server Actions (mutations côté serveur) + composants serveurs pour forms + API sécurisée pour lectures interactives

Ce projet est une application complète de gestion de projets (CRUD) pensée pour un usage moderne : UI responsive, séparation claire lecture vs mutation, et sécurité via authentification + rôles.

1. Objectif & approche générale

Toute personne (visiteur) peut consulter, rechercher et voir les détails des projets.

Les actions sensibles (Créer / Mettre à jour / Supprimer) sont réalisées par des Server Actions Next.js côté serveur et sont restreintes par rôle.

L'authentification est assurée par NextAuth (Credentials provider + Prisma); les rôles sont USER, MANAGER, ADMIN.

UI moderne et responsive avec Tailwind CSS + DaisyUI. Les composants UI (cards, forms, table) sont organisés en composants réutilisables.

Le backend est géré par Prisma ORM (Postgres par défaut), schéma type Project, Author, User, ProjectAuthor, etc.

Pourquoi Server Actions ?

Mutations traitées directement côté serveur (pas d'API REST manuelle pour les writes), moins de surface d'attaque, logique d'autorisation centralisée, et revalidatePath() pour rafraîchir SSR.

---

## 🛠️ Stack principal

| Couche                       | Technologie / Librairie                                      |
| ---------------------------- | ------------------------------------------------------------ |
| Front-end / Framework        | Next.js 15 (App Router)                                      |
| Styling / UI                 | Tailwind CSS + DaisyUI                                       |
| Gestion d’état / Interaction | Composants serveur + client, Server Actions, fetch API       |
| Backend / ORM                | Prisma + PostgreSQL                     |
| Authentification             | NextAuth (Credentials provider)                              |
| Sécurité / Middleware        | Contrôle d’accès par rôle, middleware Next.js                |
| Déploiement                  | Render (site en ligne), variables d’environnement sécurisées |

---

## 📐 Pattern & architecture

* **Server Actions** : toutes les opérations de création / mise à jour / suppression sont réalisées via des actions côté serveur. Pas d’API REST manuelle pour les writes.
* **Composants serveurs pour les formulaires** : les formulaires sont rendus sur le serveur avec `action={serverAction}`, ce qui permet d’éviter une couche client inutile pour les mutations.
* **Endpoint GET public** : le module `app/api/projects/route.ts` permet la recherche / filtrage / pagination des projets pour les composants clients.
* **Middleware de contrôle de rôle** : le middleware inspecte le token NextAuth (JWT) pour rediriger ou interdire l’accès selon le rôle (USER, MANAGER, ADMIN).
* **Rôles & autorisation** :
   • `USER` : accès lecture
   • `MANAGER` : création et modification de projets
   • `ADMIN` : droits complets, gestion des utilisateurs
* **Revalidation SSR** : après chaque mutation, on utilise `revalidatePath()` pour rafraîchir le rendu côté serveur automatiquement.

---

## 🌱 Futur & roadmap

Voici quelques idées d’évolution pour le projet en ligne :

* Un module d’administration permet de gérer les **utilisateurs**, leurs **rôles**, et de réinitialiser les mots de passe.
* 🔐 **Reset de mot de passe sécurisé par email / token** — remplacer l’affichage de mot de passe temporaire.
* 🌐 **OAuth / SSO** — ajouter des providers externes (Google, GitHub, etc.) pour simplifier l’identification.
* 📶 **Notifications en temps réel** — alertes, websockets / Pusher pour informer des changements de projet.
* 📊 **Statistiques avancées / dashboard analytics** — graphes, filtrages par période, export CSV / PDF.

---

## ℹ️ Liens utiles

* Site en ligne : [https://gestion-pro-4jtq.onrender.com](https://gestion-pro-4jtq.onrender.com)
* Base de code : [https://github.com/elprof45/gestion_pro](https://github.com/elprof45/gestion_pro)
* Documentation Prisma : [https://www.prisma.io/docs](https://www.prisma.io/docs)
* Documentation NextAuth : [https://next-auth.js.org](https://next-auth.js.org)