# Deployment

The dashboard builds to static files:

```bash
npm run build
```

The output goes to `dist/`. The public instance is deployed on Vercel.

The app has a single route, `/`, so no fallback rewrite is needed. If more client-side routes are added, the host must serve `index.html` for unknown paths, or those routes return 404 when opened directly; the current Vercel deployment has no such fallback.
