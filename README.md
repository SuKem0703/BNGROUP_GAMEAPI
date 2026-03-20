# ⚔️ Chronicles of Knight and Mage - Game API (Node.js)

> An alternative, lightweight backend implementation for the 2D RPG "Chronicles of Knight and Mage", built with **Node.js**. This project was developed to benchmark performance and experiment with different server-side architectures.

## 🛠️ Tech Stack
* **Environment:** Node.js
* **Framework:** Express.js
* **Database:** MySQL
* **Authentication:** JWT

## 🛡️ Security & Configuration Note
*To maintain strict security standards, the `.env` file containing database credentials and secret keys is intentionally excluded from this repository via `.gitignore`.*
* Please refer to the `.env.example` file for the required configuration structure.
* **Production Deployment:** Configurations are securely injected via OS Environment Variables.

## ✨ Key Technical Highlights
* **Performance Benchmarking:** Developed as a parallel service to the ASP.NET Core version to analyze Node.js asynchronous event-driven performance.
* **RESTful Design:** Clean, stateless API endpoints for game client communication.
* **Data Validation:** Strict payload validation to ensure game state integrity.

## 🚀 How to Run Locally
1. Clone the repository: `git clone https://github.com/SuKem0703/BNGROUP_GAMEAPI.git`
2. Run `npm install` to install dependencies.
3. Duplicate `.env.example`, rename it to `.env`, and fill in your local database credentials.
4. Run `npm start` (or `npm run dev`) to launch the API.
