# MediSync (Techno Exhibition)

MediSync is a medicine lifecycle platform that connects retailers, hospitals, NGOs, and waste handlers to reduce medicine waste through inventory tracking, redistribution, and smart recommendations.

## Project Structure

- `Frontend/`: React + Vite web app
- `Backend/`: Express + MongoDB API
- `Backend/src/ml/`: Python ML utilities for expiry and redistribution workflows

## Quick Start

### 1) Backend

```bash
cd Backend
npm install
```

Create `Backend/.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/medisync
JWT_SECRET=change-this-to-a-strong-secret
PORT=5000
```

Run backend:

```bash
npm run dev
```

Optional seed data:

```bash
npm run seed:test1
```

Demo credentials are available in `Backend/TEST1_LOGINS.txt`.

### 2) Frontend

```bash
cd Frontend
npm install
```

Create `Frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_API_TIMEOUT_MS=12000
```

Run frontend:

```bash
npm run dev
```

Open `http://localhost:5173`.

## Optional: ML Setup

Install Python dependencies (inside `Backend/`):

```bash
pip install -r src/ml/requirements.txt
```

Train ML models from historical data:

```bash
npm run train:ml
```

## Useful Backend Scripts

- `npm run dev`: start backend with nodemon
- `npm run start`: start backend normally
- `npm run seed:demo`: seed demo dataset
- `npm run seed:test1`: seed test dataset and accounts
- `npm run train:ml`: run ML training pipeline
