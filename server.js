import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const REQUIRED = ['PORT', 'APP_NAME', 'DATABASE_URL'];
const missing = REQUIRED.filter((k) => !process.env[k]);
const port = Number(process.env.PORT) || 8080;
const appName = process.env.APP_NAME ?? 'todo-prisma';

if (missing.length > 0) {
  console.error(`[todo-prisma] missing required env var(s): ${missing.join(', ')} — serving the diagnostic page`);
}

const prisma = missing.length === 0 ? new PrismaClient() : null;

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' }));

app.get('/health', async (_req, res) => {
  if (!prisma) {
    res.json({ status: 'degraded', missing });
    return;
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', missing: [] });
  } catch (err) {
    res.status(503).json({ status: 'db-unreachable', error: String(err) });
  }
});

app.get('/', (_req, res) => {
  if (!prisma) {
    res.status(200).type('html').send(diagnosticPage(missing, appName));
    return;
  }
  res.json({ app: appName, backedBy: 'prisma+managed-postgres' });
});

app.get('/todos', async (_req, res) => {
  const todos = await prisma.todo.findMany({ orderBy: { id: 'asc' } });
  res.json(todos);
});

app.post('/todos', async (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  if (!title) {
    res.status(400).json({ error: 'title is required' });
    return;
  }
  const todo = await prisma.todo.create({ data: { title } });
  res.status(201).json(todo);
});

app.patch('/todos/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (typeof req.body?.done !== 'boolean') {
    res.status(400).json({ error: 'done must be a boolean' });
    return;
  }
  try {
    const todo = await prisma.todo.update({ where: { id }, data: { done: req.body.done } });
    res.json(todo);
  } catch {
    res.status(404).json({ error: 'not found' });
  }
});

app.delete('/todos/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.todo.delete({ where: { id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: 'not found' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`todo-prisma listening on :${port} — APP_NAME="${appName}"`);
});

function diagnosticPage(missingKeys, name) {
  const items = missingKeys.map((k) => `<li><code>${k}</code></li>`).join('');
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${name} — variables manquantes</title>
    <style>
      body { font-family: system-ui, sans-serif; display: grid; place-items: center; min-height: 100vh; margin: 0; background: #0b0f17; color: #e6edf3; }
      .card { max-width: 32rem; padding: 2rem 2.5rem; border: 1px solid #3b1f27; border-radius: 12px; background: #150b0f; }
      h1 { margin: 0 0 .5rem; font-size: 1.25rem; color: #ff6b81; }
      p { color: #9aa4b2; margin: .25rem 0 1rem; }
      ul { margin: 0; padding-left: 1.2rem; }
      code { background: #1f2733; padding: .1rem .4rem; border-radius: 4px; color: #e6edf3; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Variables d'environnement manquantes</h1>
      <p>Cette API de démo a besoin des variables suivantes&nbsp;:</p>
      <ul>${items}</ul>
    </div>
  </body>
</html>`;
}
