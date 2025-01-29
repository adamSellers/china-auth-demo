// app.js
require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const session = require("express-session");
const Redis = require("connect-redis");
const { createClient } = require("redis");
const passport = require("passport");
const authService = require("./utils/auth.service");
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
            rejectUnauthorized: false,
        },
    });

    try {
        await redisClient.connect();
        console.log("Redis client connected successfully");
    } catch (err) {
        console.error("Redis connection error:", err);
        throw err;
    }

    // Create Redis store
    const redisStore = new Redis.RedisStore({
        client: redisClient,
        prefix: "sf-oauth:",
    });

    // Session middleware with Redis store
    app.use(
        session({
            store: redisStore,
            secret: process.env.SESSION_SECRET || "dev-secret-key",
            resave: true,
            saveUninitialized: true,
            name: "sf.sid",
            cookie: {
                secure: process.env.NODE_ENV === "production",
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000,
                sameSite: "none",
            },
            proxy: true,
        })
    );

    // Initialize passport before using it
    authService.initializePassport();
    app.use(passport.initialize());
    app.use(passport.session());

    // Debug middleware (after passport initialization)
    app.use((req, res, next) => {
        // Skip logging for static assets
        if (req.path.match(/\.(js|css|svg|png|ico)$/)) {
            return next();
        }

        // Simplified session logging
        console.log("Session:", {
            path: req.path,
            env: req.session?.oauth_env,
            authenticated: req.isAuthenticated(),
        });

        next();
    });

    // Routes
    app.use("/auth", authRoutes);

    if (process.env.NODE_ENV === "production") {
        app.use(express.static(path.join(__dirname, "../client/dist")));
        app.get("*", (req, res, next) => {
            if (req.path.startsWith("/auth/")) return next();
            res.sendFile(path.join(__dirname, "../client/dist/index.html"));
        });
    }

    return app;
}

module.exports = initializeApp;
