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

## API Documentation

The API uses Swagger/OpenAPI for documentation. The complete API specification is defined in `swagger.yaml` at the root of the project.

After starting the server, you can access the interactive API documentation at:

- **Swagger UI**: `http://localhost:8080/api-docs`

### Authentication

Most endpoints require JWT authentication. To get a JWT token:

1. Register a new account: `POST /api/Accounts/Create`
2. Login to get token: `POST /api/Accounts/Login`

Include the token in the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

### API Structure

The API is organized into the following main categories:
- **Accounts**: User registration, login, and profile management
- **GameData**: Game save/load functionality
- **Leaderboard**: Player rankings and statistics
- **Economy**: Currency management (coins/gems)
- **Inventory**: Item management and equipment
- **Forum**: Discussion threads and posts
- **Admin**: Administrative functions

## Notes
- The server auto-creates the database when `DB_TYPE=mysql`.
- TypeORM uses `synchronize: true`, so tables are auto-created/updated for local development.
- The admin UI uses the `x-admin-secret` header internally and reads its value from the browser login form.
