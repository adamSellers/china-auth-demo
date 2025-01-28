# Salesforce OAuth Demo

This application demonstrates OAuth 2.0 integration with Salesforce, supporting both global and China instances.

## Quick Deploy to Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

## Project Structure

```
client
├── .gitignore
├── README.md
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── public
│   └── vite.svg
├── src
│   ├── App.css
│   ├── App.jsx
│   ├── assets
│   │   └── react.svg
│   ├── components
│   ├── context
│   │   └── AuthContext.jsx
│   ├── index.css
│   ├── main.jsx
│   └── pages
│       ├── Dashboard.jsx
│       └── HomePage.jsx
└── vite.config.js
server
├── .env
├── app.js
├── bin
│   └── www
├── package-lock.json
├── package.json
├── public
│   ├── images
│   ├── javascripts
│   └── stylesheets
│       └── style.css
├── routes
│   ├── auth.routes.js
│   └── index.js
├── utils
│   └── auth.service.js
└── views
    ├── error.pug
    ├── index.pug
    └── layout.pug
```

## Manual Deployment Steps

### 1. Fork and Clone

1. Fork this repository
2. Clone your forked repository locally

### 2. Create a Connected App in Salesforce

1. Log in to your Salesforce org
2. Go to Setup > Apps > App Manager
3. Click "New Connected App"
4. Fill in the basic information
5. Enable OAuth Settings
6. Set the callback URL to `https://your-app-name.herokuapp.com/auth/salesforce/callback`
7. Add the following OAuth scopes:
    - Access and manage your data (api)
    - Access your basic information (id, profile, email, address, phone)
8. Save the application
9. Copy your Consumer Key (Client ID) and Consumer Secret

### 3. Deploy to Heroku

1. Create a new Heroku application
2. Connect your GitHub repository to Heroku
3. Configure the following environment variables in Heroku Settings:
    ```
    SESSION_SECRET=your-random-secret-key
    SF_CLIENT_ID=your-salesforce-client-id
    SF_CLIENT_SECRET=your-salesforce-client-secret
    SF_CALLBACK_URL=https://your-app-name.herokuapp.com/auth/salesforce/callback
    SF_LOGIN_URL=https://login.salesforce.com (or https://login.salesforce.com.cn for China)
    NODE_ENV=production
    ```
4. Deploy the main branch

### 4. Test the Deployment

1. Visit your Heroku app URL
2. Click "Login with Salesforce"
3. Authorize the application
4. You should see your Salesforce profile information

## Local Development

### Prerequisites

-   Node.js 20.x
-   npm 10.x

### Setup

1. Clone the repository
2. Install all dependencies:
    ```bash
    npm run install:all
    ```
3. Create a `.env` file in the server directory:
    ```
    SESSION_SECRET=dev-secret
    SF_CLIENT_ID=your-salesforce-client-id
    SF_CLIENT_SECRET=your-salesforce-client-secret
    SF_CALLBACK_URL=http://localhost:3000/auth/salesforce/callback
    SF_LOGIN_URL=https://login.salesforce.com
    ```
4. Create a `.env` file in the client directory:
    ```
    VITE_SF_LOGIN_URL=https://login.salesforce.com
    ```

### Running the Application

#### Development Mode (both frontend and backend)

```bash
npm run dev
```

This will start:

-   Backend server on http://localhost:3000
-   Frontend dev server on http://localhost:5173

#### Running Frontend and Backend Separately

```bash
# Start just the backend
npm run dev:server

# Start just the frontend
npm run dev:client
```

## License

MIT
