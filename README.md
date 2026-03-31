# Chronicles of Knight and Mage - Game API (Node.js)

An alternative, lightweight backend implementation for the 2D RPG "Chronicles of Knight and Mage", built with Node.js.

## Tech Stack
- Node.js
- Express.js
- TypeORM
- MySQL
- JWT

## Configuration
Copy `.env.example` to `.env` and update the values for your machine.

Important keys:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`
- `ADMIN_SECRET` for the new admin UI

## How to Run Locally
1. Clone the repository.
2. Run `npm install`.
3. Create `.env` from `.env.example`.
4. Ensure your MySQL server is running.
5. Run `npm run build`.
6. Run `npm start`.

API base URL:
- `http://localhost:8080/api`

Admin UI:
- `http://localhost:8080/admin`

## Notes
- The server auto-creates the database when `DB_TYPE=mysql`.
- TypeORM uses `synchronize: true`, so tables are auto-created/updated for local development.
- The admin UI uses the `x-admin-secret` header internally and reads its value from the browser login form.
