# Maintenance Web Application

A web application for managing maintenance tickets, vendors, locations, organizations, and sub-admin users. Built with React, Node.js, Express, and MongoDB Atlas.

## Features

- RESTful API for tickets, vendors, locations, organizations, and sub-admins
- Authentication system with role-based access control
- Dashboard with entity counts
- Organizations management
- Vendors management with organization assignments
- Sub-Admins management with custom permissions
- Security Groups configuration
- Locations management
- Ticket management with workflow states
- Connects to MongoDB Atlas (no local MongoDB required)
- Environment configuration via `.env`
- Responsive design for mobile and desktop  

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
## Technology Stack

- **Frontend**: React 18
- **UI Library**: Material-UI v5 (dark mode + theming)
- **Routing**: React Router v6
- **State Management**: React Context (AuthContext + DataContext)
- **Backend**: Node.js with Express
- **Database**: MongoDB Atlas

## Folder Structure

```
maintenance-web/
├── .env.example
├── .gitignore
├── README.md
├── package.json
├── server-local.js
├── seed-mongodb.js
├── src/
│   ├── db/
│   │   └── mongodb.js
│   ├── models/
│   │   ├── Location.js
│   │   ├── Organization.js
│   │   ├── SubAdmin.js
│   │   ├── Ticket.js
│   │   ├── User.js
│   │   ├── Technician.js
│   │   └── Vendor.js
│   ├── context/
│   │   ├── AuthContext.js
│   │   └── DataContext.js
│   ├── pages/
│   │   ├── Dashboard.js
│   │   ├── Organizations.js
│   │   ├── Vendors.js
│   │   ├── SubAdmins.js
│   │   ├── Locations.js
│   │   └── Tickets.js
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
=======
├─ public/            # Static assets
├─ src/
│  ├─ components/     # Shared UI components
│  ├─ context/        # AuthContext, DataContext
│  ├─ pages/          # Application pages
│  ├─ theme.js        # MUI custom theme
│  ├─ App.js          # Routes + providers
│  └─ index.js        # ReactDOM render
├─ package.json
└─ README.md
```

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

## Project Setup

### Prerequisites

- Node.js (v14 or later recommended)
- npm or yarn
- MongoDB: Ensure you have a MongoDB instance running. It typically runs on `mongodb://localhost:27017` by default.

### Environment Configuration

1. Create a `.env` file in the root directory of the project. You can copy `.env.example` to get started:
   ```bash
   cp .env.example .env
   ```
2. Edit the `.env` file and add your MongoDB connection string:
   ```
   MONGODB_URI=your_mongodb_connection_string_here (e.g., mongodb://localhost:27017/maintenance_web)
   ```
   Replace `your_mongodb_connection_string_here` with your actual MongoDB connection URI. If you're running MongoDB locally without authentication, it might be `mongodb://localhost:27017/maintenance_web` (where `maintenance_web` is your database name).

3. (Optional) If you have existing data in a `db.json` file and want to migrate it to MongoDB, you can run:
   ```bash
   npm run migrate
   ```

## Available Scripts

In the project directory, you can run:

### `npm start` (Frontend)

Runs the React frontend development server.
By default, it runs on port 3000. If that port is busy, it may prompt you to use another port.
```bash
npm start
```
Or, to specify port 3000 explicitly:
```bash
PORT=3000 npm start
```
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.
The page will reload when you make changes. You may also see any lint errors in the console.

### `npm run server:local` (Backend)

Runs the Node.js/Express backend API server.
This server connects to MongoDB and provides the API endpoints for the frontend.
It is configured to run on port 3001 (defined in `server-local.js`).
```bash
npm run server:local
```

### `npm run migrate`

Migrates data from a local db.json file to MongoDB.\
Use this when setting up the application for the first time with existing data.

### `npm run normalize-vendors`

Normalizes vendor data in MongoDB to ensure consistency.\
This helps resolve common vendor-related issues.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
# maintenanceweb
>>>>>>> 3d5407a8ed5fb7d7be8f2670f7819821241ed683
