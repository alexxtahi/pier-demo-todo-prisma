# pier-demo-todo-prisma

**Cas testé** : valide la doc `hub/apps/landing/src/app/docs/projects` (section
Prisma) — l'app se lie à la Postgres managée du projet et fait tourner
`prisma migrate deploy` au démarrage en dérivant `DIRECT_URL` de
`DATABASE_URL` dans `entrypoint.sh`, sans aucune action côté Pier.

## Ce que fait l'app

API REST `Todo` (Prisma + Postgres managé) : `GET/POST /todos`,
`PATCH /todos/:id`, `DELETE /todos/:id`.

## Setup dans le dashboard Pier

1. Lier le projet à la Postgres managée (toggle actif par défaut).
2. Monter la BD sur cette app (onglet Topologie).
3. Variables à créer dans Secrets : `PORT`, `APP_NAME`. `DATABASE_URL` est
   injectée automatiquement par le mount managé.

## Vérification

```bash
curl https://<domain>/health      # { status: "ok", missing: [] } si la migration a tourné
curl https://<domain>/todos       # [] au premier déploiement
curl -X POST https://<domain>/todos -H 'content-type: application/json' -d '{"title":"test prisma"}'
```

Le déploiement des logs de build doit montrer `prisma migrate deploy` créer
la table `Todo` sans intervention manuelle.

Build check: Pierrr Fleet build test on 2026-09-26.
