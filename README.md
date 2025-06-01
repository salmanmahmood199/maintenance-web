# Maintenance Web

A web application for managing maintenance tickets, vendors, locations, organizations, and sub-admin users. Built with Node.js, Express, MongoDB (Atlas), and Mongoose.

## Features

- RESTful API for tickets, vendors, locations, organizations, and sub-admins  
- JWT-based authentication and role-based access control  
- Connects to MongoDB Atlas (no local MongoDB required)  
- Environment configuration via `.env`  

## Prerequisites

- **Node.js** (v14 or higher)  
- **npm** or **Yarn**  
- A **MongoDB Atlas** cluster (connection URI)  
- An environment variable manager (e.g., a `.env` file)

## Setup

1. **Clone the repository**  
   ```bash
   git clone <repository_url>
   cd maintenance-web
   ```

2. **Install dependencies**  
   ```bash
   npm install
   ```  
   or  
   ```bash
   yarn install
   ```

3. **Configure environment variables**  
   Copy `.env.example` to `.env` in the project root and set the following values:  
   ```
   MONGODB_URI=<Your MongoDB Atlas connection string>
   JWT_SECRET=<Your JWT secret key>
   PORT=3001
   ```  
   - `MONGODB_URI` should look like:  
     ```
     mongodb+srv://<username>:<password>@<cluster-host>/<database>?retryWrites=true&w=majority
     ```  
   - `JWT_SECRET` is any random string used to sign JWT tokens.  
   - `PORT` (optional) is the port on which the server will run (default: 3001).

4. **Start the application**  
   ```bash
   npm start
   ```  
   By default, the server will listen on port 3001. You can override with `PORT=<another_port> npm start`.

## Development

To run in development mode using nodemon (auto-reloads on file changes), add this script to your `package.json`:
```json
"scripts": {
  "dev": "nodemon src/app.js"
}
```  
Then run:
```bash
npm run dev
```

## Folder Structure

```
maintenance-web/
├── .env.example
├── .gitignore
├── README.md
├── package.json
├── src/
│   ├── app.js
│   ├── db/
│   │   └── mongodb.js
│   ├── models/
│   │   ├── Location.js
│   │   ├── Organization.js
│   │   ├── SubAdmin.js
│   │   ├── Ticket.js
│   │   └── Vendor.js
│   └── routes/
│       ├── api.js
│       ├── auth.js
│       ├── health.js
│       ├── index.js
│       ├── locations.js
│       ├── organizations.js
│       ├── sub-admins.js
│       ├── tickets.js
│       └── vendors.js
```

## Environment Variables

- `MONGODB_URI`  
  MongoDB Atlas connection string (e.g., `mongodb+srv://<user>:<pass>@cluster0.mongodb.net/maintenance-web?retryWrites=true&w=majority`).

- `JWT_SECRET`  
  Secret key used to sign and verify JWT tokens for authentication.

- `PORT` (optional)  
  Port on which the Express server will run. Defaults to `3001` if not set.

## Running the Server

Once you have your `.env` file configured:

```bash
npm start
```

- The API will be available at the same origin as your deployed application.
- The MongoDB connection will automatically point to the Atlas cluster specified by `MONGODB_URI`.

### Health Check Endpoint

- **GET** `/health`  
  Returns a JSON response indicating server status and database connection status.

  **Example Response**  
  ```json
  {
    "status": "ok",
    "db": "connected"
  }
  ```

## Authentication

- **POST** `/api/auth/register`  
  Create a new user (admin or sub-admin). Requires JSON body:
  ```json
  {
    "username": "string",
    "password": "string",
    "role": "admin" | "sub-admin"
  }
  ```

- **POST** `/api/auth/login`  
  Log in with username and password. Returns a JWT token.  
  **Body**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```

Include the returned `token` in the `Authorization` header for protected routes:
```
Authorization: Bearer <your_jwt_token>
```

## API Routes

All routes below require a valid JWT in the `Authorization` header unless otherwise noted.

### Tickets

- **GET** `/api/tickets`  
  Retrieve all tickets.

- **GET** `/api/tickets/:id`  
  Retrieve a single ticket by ID.

- **POST** `/api/tickets`  
  Create a new ticket.  
  **Example Body**:
  ```json
  {
    "title": "Leaky faucet",
    "description": "Water leaking in bathroom sink",
    "location": "<location_id>",
    "priority": "low" | "medium" | "high"
  }
  ```

- **PUT** `/api/tickets/:id`  
  Update an existing ticket (e.g., change status or assign a vendor).

- **DELETE** `/api/tickets/:id`  
  Delete a ticket by ID.

### Vendors

- **GET** `/api/vendors`  
  Retrieve all vendors.

- **GET** `/api/vendors/:id`  
  Retrieve a single vendor by ID.

- **POST** `/api/vendors`  
  Create a new vendor.  
  **Example Body**:
  ```json
  {
    "name": "Acme Plumbing",
    "email": "plumbing@acme.com",
    "phone": "555-123-4567",
    "services": ["plumbing", "maintenance"]
  }
  ```

- **PUT** `/api/vendors/:id`  
  Update vendor details.

- **DELETE** `/api/vendors/:id`  
  Delete a vendor.

### Locations

- **GET** `/api/locations`  
  Retrieve all locations (e.g., buildings, floors, rooms).

- **GET** `/api/locations/:id`  
  Retrieve a single location by ID.

- **POST** `/api/locations`  
  Create a new location.  
  **Example Body**:
  ```json
  {
    "name": "Main Office",
    "address": "123 Main St, City, State"
  }
  ```

- **PUT** `/api/locations/:id`  
  Update a location.

- **DELETE** `/api/locations/:id`  
  Delete a location.

### Organizations

- **GET** `/api/organizations`  
  Retrieve all organizations.

- **GET** `/api/organizations/:id`  
  Retrieve a single organization by ID.

- **POST** `/api/organizations`  
  Create a new organization.  
  **Example Body**:
  ```json
  {
    "name": "Facilities Dept",
    "description": "Handles all maintenance tasks"
  }
  ```

- **PUT** `/api/organizations/:id`  
  Update an organization.

- **DELETE** `/api/organizations/:id`  
  Delete an organization.

### Sub-Admins

- **GET** `/api/sub-admins`  
  Retrieve all sub-admin users.

- **GET** `/api/sub-admins/:id`  
  Retrieve a single sub-admin by ID.

- **POST** `/api/sub-admins`  
  Create a new sub-admin.  
  **Example Body**:
  ```json
  {
    "username": "jdoe",
    "password": "securepassword",
    "assignedLocations": ["<location_id1>", "<location_id2>"]
  }
  ```

- **PUT** `/api/sub-admins/:id`  
  Update sub-admin details or assigned locations.

- **DELETE** `/api/sub-admins/:id`  
  Delete a sub-admin user.

## Deployment

1. Ensure your production environment has all required environment variables set (e.g., `MONGODB_URI`, `JWT_SECRET`, `PORT`).  
2. Deploy your code to your hosting provider (e.g., Heroku, AWS, DigitalOcean).  
3. Run `npm install --production` on the server.  
4. Start your process with `npm start`.  
5. Make sure your Atlas cluster’s Network Access allows connections from your server’s IP (or use a VPC peering setup).

## Troubleshooting

- **Cannot connect to MongoDB Atlas**  
  - Verify that your `MONGODB_URI` is correct.  
  - In Atlas → Network Access, ensure your server’s IP (or `0.0.0.0/0` for testing) is whitelisted.  

- **PORT already in use**  
  - Change the `PORT` value in your `.env` file or in your start command:  
    ```bash
    PORT=4000 npm start
    ```

- **“MONGODB_URI is not defined” error**  
  - Confirm you have a `.env` file with `MONGODB_URI` set (and that you restarted the server after making changes).
