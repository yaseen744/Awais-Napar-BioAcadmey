# Awais Napar Bioacademy — Full Platform (v3)

**Access poori tarah sir ke control mein hai:**
1. Koi bhi register kar sakta hai — lekin account **"pending"** state mein banta hai
2. Jab tak **sir Admin panel se approve na karein**, wo login nahi kar sakte (backend seedha 403 error deta hai)
3. Sir Admin panel ke "Approvals" tab mein har naya registration dekh sakte hain aur **Approve** ya **Reject** kar sakte hain
4. Approve hone ke baad hi student login kar ke test/videos/notes access kar sakta hai

Backend ke har route (questions, tests, videos, notes, community, leaderboard) `protect` middleware ke peeche hain — bina valid login token ke koi bhi data nahi milega.

## Kya ban chuka hai (v3 — sab kuch)

- Register / Login (JWT-based, password hashed with bcrypt)
- **Admin-approval gate** — register karne se access nahi milta, sir ki approval chahiye
- Protected routes — koi bhi bina login access nahi kar sakta
- MCQ Test Engine — subject/chapter/question-count choose karo, test do
- Auto-scoring + result page (correct/incorrect/skipped, per-question review)
- Dashboard — attempt history, average score
- **Videos** — subject → chapter folders, YouTube/Vimeo embed player
- **Notes** — subject → chapter folders, PDF link ya direct text content
- **Leaderboard** — points milte hain har correct answer par, ranking + accuracy
- **Community** — students posts kar sakein, reply/comment kar sakein
- **Admin panel** (`/admin`) — Approvals tab + questions/videos/notes seedhe UI se add karo (koi coding nahi chahiye)
- Sample data: sir ki Biomolecules mock test (195 MCQs) already seed script mein hai

## Sir ko admin kaise banayein (pehli baar setup)

Registration se koi bhi "student" hi banta hai, aur wo pending rehta hai (security ke liye). Sir ka account **admin** banane ke liye — ye script approval-check ko bypass kar ke seedha database mein admin bana deta hai, isliye sir khud lock-out nahi honge:

```bash
cd backend
npm run make-admin -- sir@example.com
```

(Pehle us email se register hona zaroori hai, phir ye command chalao — ye automatically bhi approve kar deta hai.) Uske baad us account se login karne par top-right mein **"Admin"** link dikhega.

## Roz ka flow (ab ke baad)

1. Student `/register` par jaake account banaye → "waiting for admin approval" message dekhega
2. Sir `/admin` → **Approvals** tab kholein → naya student dikhega, name/email/date ke saath
3. Sir **Approve** dabayein → ab wo student login kar sakta hai
   Ya **Reject** dabayein → account permanently delete ho jata hai
4. Jab tak approve na ho, wo student login karne ki koshish kare to seedha error milega: *"Your account is waiting for admin approval."*

## Baad mein (jab aap bologe)

- Live hosting/deployment (Render/Railway + Vercel)
- File upload seedha server par (abhi videos/notes ke liye link paste karte hain — Google Drive/YouTube wagera)

---

## Chalane ka tareeqa (local computer par)

### Zaroorat
- [Node.js](https://nodejs.org) (v18+) installed hona chahiye
- [MongoDB](https://www.mongodb.com/try/download/community) installed ya [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) ka free account (cloud database, agar local install nahi karna)

### 1. Backend

```bash
cd backend
cp .env.example .env
```

`.env` file kholo aur `MONGO_URI` set karo:
- Local MongoDB: `mongodb://127.0.0.1:27017/mdcat_app` (already default hai)
- Ya Atlas ka connection string paste kar do

Phir:

```bash
npm install
npm run seed      # sir ki 195 Biomolecules MCQs database mein daal dega
npm run dev        # server http://localhost:5000 par chalega
```

### 2. Frontend (naya terminal khol ke)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev        # app http://localhost:5173 par khulega
```

Browser mein `http://localhost:5173` kholo → **Register** karo → **Login** karo → **New Test** pe click karo → Biology → Biomolecules → test do → result dekho.

---

## Live link kaise milega (baad ke liye)

Jab aap ready ho, do options hain:
- **Render / Railway** — backend + MongoDB free tier ke liye aasan
- **Vercel** — frontend ke liye best

Bas keh dena "ab isko live daal do" — main step-by-step deployment bhi kar dunga.

## Project structure

```
mdcat-app/
├── backend/
│   ├── src/
│   │   ├── config/       # DB connection, JWT helper
│   │   ├── controllers/  # route logic (auth, questions, attempts, videos, notes, community, leaderboard)
│   │   ├── middleware/   # protect (login check), adminOnly
│   │   ├── models/       # User, Question, Attempt, Video, Note, Post (MongoDB schemas)
│   │   ├── routes/       # API endpoints
│   │   └── seed/         # loads sir's Biomolecules MCQs, makeAdmin script
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/           # axios instance (auto-attaches login token)
    │   ├── components/    # Navbar, ProtectedRoute, AdminRoute
    │   ├── context/        # AuthContext (register/login/logout state)
    │   ├── utils/          # embed.js (YouTube/Vimeo URL helper)
    │   └── pages/          # Register, Login, Dashboard, TestSetup, TestPage, ResultPage,
    │                       # Videos, Notes, Leaderboard, Community, Admin
    └── .env.example
```
