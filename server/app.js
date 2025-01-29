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
const authService = require("./utils/auth.service"); // Updated import
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

        // Make redis client available to routes
        app.set("redisClient", redisClient);

        // Monitor Redis connection
        redisClient.on("error", (err) => {
            console.error("Redis Client Error:", err);
        });

        redisClient.on("reconnecting", () => {
            console.log("Redis Client Reconnecting");
        });
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
            resave: false,
            saveUninitialized: false,
            name: "sf.sid",
            cookie: {
                secure: process.env.NODE_ENV === "production",
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000,
                sameSite: "lax",
            },
        })
    );

    // Debug middleware
    app.use((req, res, next) => {
        console.log("Session data:", {
            id: req.session.id,
            oauth_env: req.session.oauth_env,
            path: req.path,
        });
        next();
    });

    // Initialize passport
    authService.initializePassport(); // Updated call
    app.use(require("passport").initialize());
    app.use(require("passport").session());

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
