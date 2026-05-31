# 💰 Gestor Finanzas

Gestor de finanzas del hogar — React + Vite + Supabase

## Stack

- **Frontend:** React 18 + Vite
- **Estilos:** Tailwind CSS v3
- **Auth:** Supabase Auth (Google OAuth)
- **Base de datos:** Supabase (PostgreSQL + RLS por usuario)
- **Gráficas:** Chart.js + react-chartjs-2
- **Exportación:** SheetJS (Excel) + jsPDF (PDF)
- **Deploy:** Vercel

## Inicio rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar y configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus claves de Supabase

# 3. Correr en desarrollo
npm run dev

# 4. Build para producción
npm run build
```

## Variables de entorno

| Variable | Descripción |
|---|---|
| `VITE_SUPABASE_URL` | URL de tu proyecto en Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave pública (anon key) de Supabase |

## Estructura del proyecto

```
src/
├── lib/          # Supabase client, utilidades
├── context/      # AuthContext, AppContext, DataContext
├── hooks/        # useTransactions, useWallets, useBudgets, useDebts
├── components/
│   ├── layout/   # Header, Sidebar, BottomNav
│   ├── shared/   # Modal, Toast, Calculator, ConfirmModal
│   └── sections/ # Dashboard, Transactions, Budgets, Debts, Reports, Settings
└── pages/        # AppRouter, AuthPage, MainApp
```

## Fases de desarrollo

- [x] **Fase 1** — Scaffolding + estructura + contextos + hooks
- [ ] **Fase 2** — Supabase: schema, RLS, Google OAuth
- [ ] **Fase 3** — Migración de secciones desde el HTML original
- [ ] **Fase 4** — Corrección de bugs + mejoras
- [ ] **Fase 5** — Deploy en Vercel
