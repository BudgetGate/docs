# Deployment

The dashboard builds to static files:

```bash
npm run build
```

The output goes to `dist/`. The public instance is deployed on Vercel.

The app uses client-side routing (`/` for the dashboard, `/docs` for a built-in documentation page). A host must serve `index.html` for unknown paths, or `/docs` returns 404 when opened directly. This happens on the current Vercel deployment.
