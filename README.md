# Salesforce OAuth Demo

This application demonstrates OAuth 2.0 integration with Salesforce, supporting both global and China instances.

## Quick Deploy to Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://www.heroku.com/deploy?template=https://github.com/adamSellers/china-auth-demo)

## Project Structure

```
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
│   └── auth.routes.js
├── utils
│   └── auth.service.js
└── views
    ├── error.pug
    ├── index.pug
    └── layout.pug
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
│   │   ├── react.svg
│   │   ├── sf.png
│   │   └── sfoa.png
│   ├── components
│   │   ├── EnvironmentSelector.jsx
│   │   └── Layout.jsx
│   ├── config
│   │   └── environments.js
│   ├── context
│   │   └── AuthContext.jsx
│   ├── index.css
│   ├── main.jsx
│   └── pages
│       ├── Dashboard.jsx
│       └── HomePage.jsx
└── vite.config.js

```

## Local Deployment Steps

### Prerequisites

-   Node.js 20.x
-   npm 10.x
-   Redis

Refer [here](https://redis.io/docs/latest/operate/oss_and_stack/install/install-redis/) for specific instructions on installing Redis locally.

### 1. Fork and Clone

1. Fork this repository
2. Clone your forked repository locally

### 2. Create two External Client Apps

Repeat this step for both Salesforce, and Salesforce on Alibaba Cloud instances

1. Log in to your Salesforce org
2. Go to Setup > Apps > App Manager
3. Click "New Connected App" and select "Create External Client App"
4. Fill in the basic information
5. Enable OAuth Settings
6. Set the callback URL to `https://your-app-name.herokuapp.com/auth/salesforce/callback`
7. Add the following OAuth scopes:
    - Access and manage your data (api)
    - Access your basic information (id, profile, email, address, phone)
    - Perform requests at any time (refresh_token, offline_access)
8. Save the application
9. Copy your Consumer Key (Client ID) and Consumer Secret

### 3. Create a .env file in the server directory with the following detail

    ```
    SESSION_SECRET=your-random-secret-key
    SF_CLIENT_ID=your-salesforce-client-id
    SF_CLIENT_SECRET=your-salesforce-client-secret
    SFOA_CLIENT_ID=your-salesforce-on-alibaba-cloud-client-id
    SFOA_CLIENT_SECRET=your-salesforce-on-alibaba-cloud-client-secret
    SF_CALLBACK_URL=https://your-app-name.herokuapp.com/auth/salesforce/callback
    SF_LOGIN_URL=https://login.salesforce.com
    SFOA_LOGIN_URL=https://login.sfcrmproducts.cn
    REDIS_URL=your-redis-connection-string
    NODE_ENV=production

    ```

### 4. Running the Application

To start both front and back end, from project root run

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
