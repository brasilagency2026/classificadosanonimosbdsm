# Classificados Anônimos BDSM

Site de petites annonces anonymes pour la communauté BDSM au Brésil.  
Communication via Element / Matrix pour conserver l'anonymat.

## Stack

- React 18 + Vite
- Supabase (base de données PostgreSQL + Storage pour les photos)
- Déployé sur Vercel

## Installation locale

```bash
npm install
cp .env.example .env
# Remplir .env avec vos clés Supabase
npm run dev
```

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL de votre projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé anon publique Supabase |
| `VITE_PAYPAL_LINK` | Lien PayPal.me pour les photos payantes |

## Base de données Supabase

Exécuter `supabase_schema.sql` dans **Supabase → SQL Editor**.

Créer ensuite le bucket manuellement :  
**Storage → New bucket → nom : `fotos` → Public → Create**

## Déploiement Vercel

1. Pusher ce repo sur GitHub
2. Importer sur [vercel.com](https://vercel.com)
3. Ajouter les 3 variables d'environnement dans Vercel → Settings → Environment Variables
4. Deploy

## Fonctionnalités

- Annonces gratuites et anonymes
- Filtres par état, ville, genre, position BDSM
- Contact via Element/Matrix (chiffrement E2E)
- Photos payantes via PayPal (R$ 10,00) stockées sur Supabase Storage
- Tutoriel Element intégré
