// auth.routes.js
const express = require("express");
const passport = require("passport");
const router = express.Router();
const axios = require("axios");

// Initial auth endpoint
router.get(
    "/salesforce",
    (req, res, next) => {
        console.log("Starting OAuth:", {
            env: req.query.env,
            sessionId: req.sessionID,
        });

        if (req.query.env) {
            req.session.oauth_env = req.query.env;
            return req.session.save((err) => {
                if (err) {
                    console.error("Session save error:", err);
                    return next(err);
                }
                next();
            });
        }
        next();
    },
    passport.authenticate("salesforce", {
        failureRedirect: "/?error=auth_failed",
        session: true,
    })
);

// OAuth callback handler
router.get(
    "/salesforce/callback",
    (req, res, next) => {
        console.log("OAuth callback received:", {
            env: req.session?.oauth_env,
            sessionId: req.sessionID,
        });
        next();
    },
    passport.authenticate("salesforce", {
        failureRedirect: "/?error=auth_failed",
        session: true,
    }),
    (req, res) => {
        console.log("Authentication successful:", {
            env: req.session?.oauth_env,
            sessionId: req.sessionID,
        });
        res.redirect("/dashboard");
    }
);

// Logout handler
router.get("/logout", async (req, res) => {
    try {
        // Get correct base URL for environment
        const baseUrl =
            req.user?.environment === "sfoa"
                ? process.env.SFOA_LOGIN_URL
                : process.env.SF_LOGIN_URL;

        // Revoke Salesforce token if it exists
        if (req.user?.accessToken) {
            try {
                await axios.post(`${baseUrl}/services/oauth2/revoke`, null, {
                    params: { token: req.user.accessToken },
                });
            } catch (error) {
                console.error("Token revocation error:", error);
            }
        }

        // Clear session
        req.session.destroy((err) => {
            if (err) {
                console.error("Session destruction error:", err);
            }

            req.logout(() => {
                res.clearCookie("sf.sid");
                res.redirect("/");

                // Background logout from Salesforce
                try {
                    axios.get(`${baseUrl}/secur/logout.jsp`).catch(() => {});
                } catch (error) {
                    // Ignore errors for background logout
                }
            });
        });
    } catch (error) {
        console.error("Logout error:", error);
        res.redirect("/");
    }
});

// Session status endpoint
router.get("/session-status", (req, res) => {
    res.json({
        isAuthenticated: req.isAuthenticated(),
        session: req.session,
        user: req.user,
        cookies: req.cookies,
    });
});

// User info endpoint
router.get("/user-info", async (req, res) => {
    if (!req.user?.accessToken) {
        return res.status(401).json({ error: "Not authenticated" });
    }

    try {
        const baseUrl =
            req.user.environment === "sfoa"
                ? process.env.SFOA_LOGIN_URL
                : process.env.SF_LOGIN_URL;

        const response = await axios.get(
            `${baseUrl}/services/oauth2/userinfo`,
            {
                headers: {
                    Authorization: `Bearer ${req.user.accessToken}`,
                },
            }
        );

        res.json({
            ...response.data,
            accessToken: req.user.accessToken,
        });
    } catch (error) {
        console.error("User info fetch error:", error);
        res.status(500).json({
            error: "Failed to fetch user information",
            details: error.message,
        });
    }
});

module.exports = router;
