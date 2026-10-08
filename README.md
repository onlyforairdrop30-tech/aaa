# College Search

## Deploy the live app

The frontend is hosted on Netlify and the FastAPI backend plus PostgreSQL database are hosted on Render. GitHub stores the source code and triggers builds; GitHub Pages cannot host this backend.

### 1. Secure the deployment credentials

The previous Render configuration contained credentials, and that configuration was committed to Git. Treat those credentials as exposed: change the admin password and replace the JWT `SECRET_KEY` with new, unique values. Do not reuse the old values or add secrets to this repository. Removing them from the current file does not remove them from earlier Git history.

### 2. Deploy the backend and database on Render

1. Push the updated repository to GitHub.
2. In Render, create a new **Blueprint** and select this GitHub repository. Render reads `render.yaml` from the repository root.
3. Enter new values for `SECRET_KEY`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD` when prompted. Use a long random secret key and a strong, unique admin password.
4. Deploy the Blueprint. It creates the API and a free PostgreSQL database; the database connection is wired automatically.
5. Copy the API's public Render URL, for example `https://college-search-api.onrender.com`.

The free Render PostgreSQL database is for testing and expires after 30 days. Data stored there should be treated as temporary; use a paid persistent database before relying on this app for real users or records.

### 3. Deploy the frontend on Netlify

1. In Netlify, import the same GitHub repository as a new site.
2. Add the environment variable `VITE_API_URL` and set it to the Render API URL, without a trailing slash or `/api` (for example, `https://college-search-api.onrender.com`).
3. Deploy the site. `netlify.toml` configures the frontend build and SPA redirects.

The frontend reads `VITE_API_URL` at build time. If the API URL changes, update the Netlify environment variable and trigger a new deploy.

## Local development

Use the Windows setup and start scripts in the repository, or follow [HOW_TO_RUN.txt](./HOW_TO_RUN.txt). Keep local credentials in `backend/.env`; never commit that file.
