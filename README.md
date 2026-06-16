# CE-Otter

A mobile app for connecting the Petersburg area with healthcare information and resources — built with React Native and Expo.

## What it does

CE-Otter is an app designed to provide residents of the Petersburg area with healthcare resources/information and community events

| Section | Description |
|---|---|
| **Home** | Landing page with campus overview |
| **Research** | Research resources and information |
| **Community** | Community news and events |
| **Health** | Health resources and forms |
| **Faculty** | Faculty directory |
| **Contact** | Campus contact information and location hours |

Additional features:
- **AI Search** — semantic search powered by vector embeddings
- **Coloring Page** — interactive digital coloring book (kawaii-style line art)
- **Admin Panel** — content management
- **Dark / Light mode** — toggle in the header

## Tech Stack

- **Framework**: [Expo](https://expo.dev) (React Native, file-based routing via expo-router)
- **Language**: TypeScript
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Database**: MongoDB (backend) 
- **Backend**: Node.js Express server (`/backend`)
- **Deployment**: Vercel (web export)

## Getting Started

### Prerequisites

- Node.js 18+
- [Expo Go](https://expo.dev/go) app on your phone, or an iOS/Android emulator

### Install

```bash
npm install
```

### Run

```bash
# Start Expo dev server
npx expo start

# Or target a specific platform
npm run android
npm run ios   # macOS only
npm run web
```

### Run the backend

```bash
npm run start:backend
```

The backend runs on port `4000` by default. To point the app at a custom API host:

```bash
EXPO_PUBLIC_CONTENT_API=http://<your-ip>:4000 npx expo start
```

## Project Structure

```
app/              # Expo Router screens
  index.tsx       # Main app shell (nav, splash, theme)
  coloring.tsx    # Coloring page feature
  aisearch.tsx    # AI-powered search
  admin/          # Admin panel routes
  health/         # Health section routes
components/       # Shared UI components
  HomePage.tsx
  Faculty.tsx
  Health.tsx
  Community.tsx
  Research.tsx
  Contact.tsx
  ColoringPage.tsx
  AdminPanel.tsx
backend/          # Node.js Express API
  index.js        # Server entry point
  routes/         # API route handlers
assets/images/    # App icons, illustrations, coloring pages
constants/        # Theme colors, backend config
hooks/            # Custom hooks (theme, colors)
services/         # API service helpers
db/               # Database scripts and config
```

## Backend Scripts

Scripts for seeding and managing MongoDB data live in `/backend`:

```bash
node backend/insert_all_data.js          # Insert all data
node backend/insert_faculty_to_mongodb.js # Seed faculty records
node backend/upload_images_to_mongodb.js  # Upload image assets
node backend/embedding_service.js         # Generate vector embeddings for AI search
```

## Deployment

The web build deploys to Vercel. The `vercel.json` config handles routing for the static Expo export.

```bash
npm run vercel-build
```


