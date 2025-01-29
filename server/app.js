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

    // Initialize redis client
    const redisClient = createClient({
        url: process.env.REDIS_URL,
        socket: {
            tls: process.env.NODE_ENV === "production",
        },
    });

    // Initialize connection
    await redisClient.connect();

    redisClient.on("error", (err) => console.log("Redis Client Error", err));
    redisClient.on("connect", () => console.log("Connected to Redis"));

    // Create RedisStore
    const RedisStore = connectRedis(session);

    // Session middleware (must be before passport)
    app.use(
        session({
            store: new RedisStore({
                client: redisClient,
                prefix: "sf-oauth:",
                ttl: 86400,
            }),
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

// Export the initialization function
module.exports = initializeApp;
