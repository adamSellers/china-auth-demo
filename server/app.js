require("dotenv").config();
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const session = require("express-session");
const AuthService = require("./utils/auth.service");

const authRoutes = require("./routes/auth.routes");

const app = express();
app.use(cors());

// View engine setup only needed for error pages
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Session middleware (must be before passport)
app.use(
    session({
        secret: process.env.SESSION_SECRET || "dev-secret-key",
        resave: false,
        saveUninitialized: false,
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
    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "../client/dist/index.html"));
    });
}

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render("error");
});

module.exports = app;
