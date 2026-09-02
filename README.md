# 🌿 Unwind

**A full-stack mental wellness platform** that helps you understand your mind, one small habit at a time.

Unwind brings together mood tracking, private journaling, sleep monitoring, habit building, clinically-recognized mental health assessments, and AI-powered emotional support — all in one secure, privacy-first space.

🔗 **Live App:** [project-unwind-mu.vercel.app](https://project-unwind-mu.vercel.app)

> ⚠️ **Status:** Actively in development / testing. Features and structure may change frequently.

---

## ✨ Features

- 📊 **Mood Tracking** — Log and visualize your emotional patterns over time
- 📓 **Private Journaling** — A secure, personal space to write freely
- ✅ **Habit Builder** — Build and track healthy daily habits
- 😴 **Sleep Monitoring** — Keep tabs on your sleep patterns and consistency
- 🧠 **DASS-21 Assessment** — Take the clinically-recognized Depression, Anxiety and Stress Scale assessment
- 🤖 **AI-Powered Emotional Support** — Get supportive, AI-driven check-ins and guidance
- 🔐 **Privacy-First** — Built with user data security as a core principle, not an afterthought
- 📈 **Admin Panel & Analytics** — Insights dashboard for platform-level analytics

---

## 🛠️ Tech Stack

| Layer        | Technology                          |
|--------------|--------------------------------------|
| **Frontend** | *(e.g. React / Next.js — update this)* |
| **Backend**  | *(e.g. Node.js / Express — update this)* |
| **Database** | *(e.g. MongoDB / PostgreSQL — update this)* |
| **Deployment** | Vercel |

> 📝 Fill in the exact stack once it's finalized — check `client/package.json` and `backend/package.json` for the real dependency list.

---

## 📁 Project Structure

```
Project-Unwind/
├── backend/        # API server, business logic, database models
├── client/         # Frontend application
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- *(Database of choice — e.g. MongoDB Atlas account, or local instance)*

### 1. Clone the repository

```bash
git clone https://github.com/Atharvapadwal15151515/Project-Unwind.git
cd Project-Unwind
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` with the required environment variables:

```env
PORT=5000
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_jwt_secret
# Add any AI/API keys used for the emotional support feature
```

Run the backend:

```bash
npm run dev
```

### 3. Set up the client

```bash
cd ../client
npm install
```

Create a `.env` file in `client/` if needed (e.g. API base URL):

```env
VITE_API_URL=http://localhost:5000
```

Run the client:

```bash
npm run dev
```

The app should now be running locally — check your terminal output for the exact port.

---

## 📸 Screenshots

> Add a few screenshots or a short demo GIF here once the UI is stable — this is one of the highest-impact things you can add to a README.

---

## 🗺️ Roadmap

- [ ] Finish core testing phase
- [ ] Add automated tests (unit/integration)
- [ ] Expand AI support capabilities
- [ ] Polish admin analytics dashboard
- [ ] Add CI/CD pipeline

---

## 🤝 Contributing

This project is currently a solo build and in active testing. Contribution guidelines will be added once the core feature set stabilizes. Feel free to open an issue if you spot a bug or have a suggestion.

---

## 📄 License

*(No license added yet — consider adding an MIT License if you want others to freely use/reference this project.)*

---

## 👤 Author

**Atharva Padwal**
[GitHub](https://github.com/Atharvapadwal15151515)

---

<p align="center">Built with care for mental wellness 🌱</p>
