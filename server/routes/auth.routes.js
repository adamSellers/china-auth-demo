const express = require("express");
const passport = require("passport");
const router = express.Router();
const axios = require("axios");

// Add state management helpers
const STATE_PREFIX = "oauth_state:";
const STATE_TTL = 60 * 5; // 5 minutes in seconds

router.get(
    "/salesforce",
    (req, res, next) => {
        console.log("OAuth Start:", {
            env: req.query.env,
            authenticated: req.isAuthenticated(),
        });

        if (req.query.env) {
            req.session.oauth_env = req.query.env;
            return req.session.save(next);
        }
        next();
    },
    passport.authenticate("salesforce", {
        failureRedirect: "/?error=auth_failed",
        session: true,
    })
);

router.get(
    "/salesforce/callback",
    (req, res, next) => {
        console.log("OAuth Callback:", {
            env: req.session?.oauth_env,
            authenticated: req.isAuthenticated(),
        });
        next();
    },
    passport.authenticate("salesforce", {
        failureRedirect: "/?error=auth_failed",
        session: true,
    }),
    (req, res) => {
        console.log("Auth Success:", {
            env: req.session?.oauth_env,
            user: req.user?.environment,
        });
        res.redirect("/dashboard");
    }
);

router.get("/logout", async (req, res) => {
    try {
        // 1. Get the correct base URL based on current environment
        const baseUrl =
            req.user?.environment === "sfoa"
                ? process.env.SFOA_LOGIN_URL
                : process.env.SF_LOGIN_URL;

        if (req.user?.accessToken) {
            try {
                // 2. Revoke the Salesforce access token
                await axios.post(`${baseUrl}/services/oauth2/revoke`, null, {
                    params: { token: req.user.accessToken },
                });
            } catch (error) {
                console.error("Error revoking token:", error);
            }
        }

        // 3. Clear all session data
        req.session.destroy((err) => {
            if (err) {
                console.error("Error destroying session:", err);
            }

            // 4. Clear passport login
            req.logout(() => {
                // 5. Clear all cookies
                res.clearCookie("sf.sid");

                // 6. Instead of redirecting to Salesforce logout, just redirect home
                res.redirect("/");

                // Log the user out of Salesforce in the background
                try {
                    // This will still log the user out of Salesforce, but won't redirect
                    axios.get(`${baseUrl}/secur/logout.jsp`).catch(() => {
                        // Ignore any errors as this is a background request
                    });
                } catch (error) {
                    // Ignore any errors as this is a background request
                }
            });
        });
    } catch (error) {
        console.error("Error during logout:", error);
        res.redirect("/");
    }
});

router.get("/session-status", (req, res) => {
    res.json({
        isAuthenticated: req.isAuthenticated(),
        session: req.session,
        user: req.user,
        cookies: req.cookies,
    });
});

router.get("/user-info", async (req, res) => {
    if (!req.user?.accessToken) {
        return res.status(401).json({ error: "Not authenticated" });
    }

    try {
        const response = await axios.get(
            `${
                req.user.environment === "sfoa"
                    ? process.env.SFOA_LOGIN_URL
                    : process.env.SF_LOGIN_URL
            }/services/oauth2/userinfo`,
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
        console.error("Error fetching user info:", error);
        res.status(500).json({
            error: "Failed to fetch user information",
            details: error.message,
        });
    }
});

module.exports = router;
