# 🌐 CiviLink — Smart reporting for faster local action

**CiviLink** is a simple, community-driven platform that helps you and your neighbors report local issues and track them until they get fixed. By working together, we can make our cities better, one report at a time.

![Demo Screenshot Placeholder](https://via.placeholder.com/1200x600/1e1e1e/white?text=CiviLink+-+Intelligent+Civic+Action)

## ✨ Core Features

*   **⚡ High-Velocity Reporting**: File geotagged civic issues in seconds with precise location tracking and multi-category routing.
*   **📸 Evidence Capture**: Integrated in-app camera capture for real-time photo verification of incidents.
*   **🔥 Community Priority Feed**: A social-media-inspired feed where upvotes surface the most urgent community needs.
*   **🤖 Intelligent Auto-Escalation**: System-aware workflows that automatically escalate unresolved high-priority issues.
*   **💬 Real-Time Feedback**: Instant communication channels for authorities to update citizens on resolution progress.
*   **🏆 Gamified Advocacy**: Earn points and badges (e.g., "Active Voice", "Community Leader") for reporting and validating issues.
*   **🔗 Seamless Sharing**: One-click sharing to WhatsApp, X, and LinkedIn to amplify community concerns.

## 🛠️ Technical Excellence

CiviLink is built on a modern, high-performance tech stack:

- **Frontend**: React 19, Vite, Tailwind CSS (Custom "Stitched Vibrant" design system).
- **Backend**: Node.js, Express, Socket.io (Real-time events).
- **Persistence**: PostgreSQL, Prisma ORM.
- **Auth**: Google OAuth 2.0 with custom-styled JWT authentication flow.
- **Infrastructure**: Cloudinary (Media hosting), node-cron (Background automation).

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL Instance

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Devcodehub2004/CIVILINK.git
    cd CIVILINK
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:**
    Copy `.env.example` to `.env` and fill in your database and Cloudinary credentials.

4.  **Database Setup:**
    ```bash
    npx prisma migrate dev
    npx prisma generate
    ```

5.  **Run Development Server:**
    ```bash
    npm run dev
    ```

## 📖 Presentation Guide
For a detailed guide on how to present this project to teachers or evaluators, see [PRESENTATION_GUIDE.md](./PRESENTATION_GUIDE.md).

## 💬 Community Voices

> "Transparency is the bridge to trust." — *CiviLink Core*
>
> "Small reports lead to big changes." — *Active Resident*
>
> "Action is the foundational key to all success." — *Civic Advocate*

---

© 2026 CiviLink — EST. 2026. Built with ❤️ for smarter cities.
