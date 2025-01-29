require("dotenv").config();
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const session = require("express-session");
const RedisStore = require("connect-redis").default;
const { createClient } = require("redis");
const AuthService = require("./utils/auth.service");

const authRoutes = require("./routes/auth.routes");

const app = express();
app.use(cors());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Initialize redis client
const redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
        tls: process.env.NODE_ENV === "production",
    },
});

redisClient.on("error", (err) => console.log("Redis Client Error", err));
redisClient.on("connect", () => console.log("Connected to Redis"));

// Initialize session middleware with Redis
app.use(
    session({
        store: new RedisStore({
            client: redisClient,
            prefix: "sf-oauth:", // Prefix for Redis keys
            ttl: 86400, // 24 hours
        }),
        secret: process.env.SESSION_SECRET || "dev-secret-key",
        resave: false,
        saveUninitialized: false,
        rolling: true,
        name: "sf.sid", // Custom cookie name
        cookie: {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
        },
    })
);

// Initialize passport
AuthService.initializePassport();
app.use(require("passport").initialize());
app.use(require("passport").session());

// API routes
app.use("/auth", authRoutes);

// Serve static frontend in production
if (process.env.NODE_ENV === "production") {
    // Serve static files from the React app
    app.use(express.static(path.join(__dirname, "../client/dist")));

    // Handle React routing, return all requests to React app
    app.get("*", function (req, res, next) {
        // Skip API routes
        if (req.path.startsWith("/auth/")) {
            return next();
        }
        res.sendFile(path.join(__dirname, "../client/dist/index.html"));
    });
}

// Error handler
app.use(function (err, req, res, next) {
    console.error("Error occurred:", err);

    // Determine if this is an OAuth 2.0 error
    if (err.name === "AuthorizationError" || err.name === "TokenError") {
        return res.redirect("/?error=" + encodeURIComponent(err.message));
    }

    // Set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // Send error response
    res.status(err.status || 500);
    res.json({
        message: err.message,
        error: req.app.get("env") === "development" ? err : {},
    });
});

module.exports = app;
