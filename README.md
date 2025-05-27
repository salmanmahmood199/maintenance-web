# Maintenance Web Application

A React-based web application for managing maintenance tickets, organizations, vendors, and more.

## Technology Stack

- **Frontend**: React 18
- **UI Library**: Material-UI v5 (dark mode + theming)
- **Routing**: React Router v6
- **State Management**: React Context (AuthContext + DataContext)
- **Data Persistence**: MongoDB (previously used json-server with local db.json)

## Features

- Authentication system (static login for MVP)
- Dashboard with entity counts
- Organizations management
- Vendors management with organization assignments
- Sub-Admins management
- Security Groups configuration
- Locations management
- Ticket management with workflow states
- Responsive design for mobile and desktop

## Folder Structure

```
maintenance-web/
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
