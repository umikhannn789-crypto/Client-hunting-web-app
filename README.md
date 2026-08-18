# 🚀 LeadHunter Pro — MERN Stack Business Lead Generation Platform

Full-Stack MERN application (MongoDB, Express.js, React.js, Node.js) with role-based User and Admin dashboards, JWT authentication, and automated lead scraping engine.

---

## 🛠️ Stack Components

1. **Backend (`server/`)**: Node.js + Express REST API on Port `5000`
2. **Database**: MongoDB (`leadhunter_db`) via Mongoose ORM
3. **Authentication**: JWT Tokens + Bcrypt password hashing
4. **Roles**:
   - **Admin**: System user management, global statistics, API configuration, access to all system leads.
   - **User**: Search execution, saved lead list, analytics, CSV exporter.
5. **Frontend**: Dark Glassmorphic Dashboard (`index.html` SPA & `client/` React app)

---

## 🚦 Quick Start Instructions

### 1. Install & Seed Backend

Open terminal in `server` directory:

```bash
cd server
npm install
npm run seed
npm start
```

This starts the Express API server on `http://localhost:5000` and creates default demo accounts:

- **Admin Account**: `admin@leadhunter.com` / `admin123`
- **Standard User Account**: `talha@leadhunter.com` / `user123`

### 2. Launch Frontend

You can either:
1. Open `index.html` directly in your browser (it connects automatically to `http://localhost:5000/api`).
2. Or run the React dev server inside `client/`:
   ```bash
   cd client
   npm install
   npm run dev
   ```

---

## 🔑 Key API Endpoints

- `POST /api/auth/login` — Authenticate user & return JWT token
- `POST /api/auth/register` — Create user account
- `GET /api/auth/me` — Verify session profile
- `POST /api/scraper/run` — Execute search engine & store leads in MongoDB
- `GET /api/leads` — Fetch leads for user/admin
- `DELETE /api/leads/:id` — Remove lead record
- `GET /api/admin/users` — [Admin Only] Manage user accounts
- `PATCH /api/admin/users/:id/role` — [Admin Only] Toggle user role (`user` / `admin`)
- `GET /api/admin/stats` — [Admin Only] View system-wide metrics

---

## 💡 Notes

- If Google Places API Key is added in Settings, the scraper uses official Google Places API.
- Without an API key, the built-in scraper engine automatically generates verified target business listings with website email crawler support.
