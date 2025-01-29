require("dotenv").config();
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const session = require("express-session");
const connectRedis = require("connect-redis");
const { createClient } = require("redis");
const AuthService = require("./utils/auth.service");
const authRoutes = require("./routes/auth.routes");

async function initializeApp() {
    const app = express();
    app.use(cors());

    app.use(logger("dev"));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser());

    // Initialize redis client with retry logic
    const redisClient = createClient({
        url: process.env.REDIS_URL,
        socket: {
            tls: process.env.NODE_ENV === "production",
            rejectUnauthorized: false, // Accept self-signed certificates
        },
        retry_strategy: function (options) {
            if (options.error && options.error.code === "ECONNREFUSED") {
                // End reconnecting on a specific error
                return new Error("The server refused the connection");
            }
            if (options.total_retry_time > 1000 * 60 * 60) {
                // End reconnecting after a specific timeout
                return new Error("Retry time exhausted");
            }
            if (options.attempt > 10) {
                // End reconnecting with built in error
                return undefined;
            }
            // Reconnect after
            return Math.min(options.attempt * 100, 3000);
        },
    });

    try {
        // Initialize connection
        await redisClient.connect();
        console.log("Redis client connected successfully");
    } catch (err) {
        console.error("Redis connection error:", err);
        // Fall back to memory session store if Redis fails
        console.log("Falling back to memory session store");
    }

    redisClient.on("error", (err) => console.log("Redis Client Error", err));
    redisClient.on("connect", () => console.log("Connected to Redis"));
    redisClient.on("reconnecting", () =>
        console.log("Redis client reconnecting")
    );

    // Create session store based on Redis connection status
    let sessionStore;
    if (redisClient.isOpen) {
        const RedisStore = connectRedis(session);
        sessionStore = new RedisStore({
            client: redisClient,
            prefix: "sf-oauth:",
            ttl: 86400,
        });
        console.log("Using Redis session store");
    }

    // Session middleware (must be before passport)
    app.use(
        session({
            store: sessionStore, // Will fall back to MemoryStore if sessionStore is undefined
            secret: process.env.SESSION_SECRET || "dev-secret-key",
            resave: false,
            saveUninitialized: false,
            rolling: true,
            name: "sf.sid",
            cookie: {
                secure: process.env.NODE_ENV === "production",
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000,
            },
        })
    );

    // Debug middleware to track session changes
    app.use((req, res, next) => {
        const oldEnd = res.end;
        res.end = function () {
            console.log("Session at end of request:", {
                id: req.session.id,
                oauth_env: req.session.oauth_env,
                path: req.path,
                method: req.method,
                store: req.session.store ? "redis" : "memory",
            });
            oldEnd.apply(this, arguments);
        };
        next();
    });

    // Initialize passport
    AuthService.initializePassport();
    app.use(require("passport").initialize());
    app.use(require("passport").session());

    // API routes
    app.use("/auth", authRoutes);

    // Serve static frontend in production
    if (process.env.NODE_ENV === "production") {
        app.use(express.static(path.join(__dirname, "../client/dist")));
        app.get("*", function (req, res, next) {
            if (req.path.startsWith("/auth/")) {
                return next();
            }
            res.sendFile(path.join(__dirname, "../client/dist/index.html"));
        });
    }

    // Error handler
    app.use(function (err, req, res, next) {
        console.error("Error occurred:", err);

        if (err.name === "AuthorizationError" || err.name === "TokenError") {
            return res.redirect("/?error=" + encodeURIComponent(err.message));
        }

        res.locals.message = err.message;
        res.locals.error = req.app.get("env") === "development" ? err : {};

        res.status(err.status || 500);
        res.json({
            message: err.message,
            error: req.app.get("env") === "development" ? err : {},
        });
    });

    return app;
}

module.exports = initializeApp;
