const express = require("express");
const passport = require("passport");
const router = express.Router();
const axios = require("axios");

router.get(
    "/salesforce",
    (req, res, next) => {
        console.log("Initial auth request:", {
            query: req.query,
            env: req.query.env,
            session: req.session,
        });

        // Store env in session and wait for save to complete
        if (req.query.env) {
            req.session.oauth_env = req.query.env;

            // Force session save and wait for completion
            return req.session.save((err) => {
                if (err) {
                    console.error("Session save error:", err);
                    return next(err);
                }
                console.log(
                    "Session saved, oauth_env is now:",
                    req.session.oauth_env
                );
                next();
            });
        }
        next();
    },
    (req, res, next) => {
        // Double check the session after save
        console.log("Pre-auth session check:", {
            oauth_env: req.session.oauth_env,
            sessionID: req.sessionID,
        });
        next();
    },
    passport.authenticate("salesforce", {
        failureRedirect: "/?error=auth_failed",
        session: true,
        state: true,
    })
);

router.get(
    "/salesforce/callback",
    (req, res, next) => {
        console.log("Callback request:", {
            query: req.query,
            session: req.session,
            storedEnv: req.session.oauth_env,
        });
        next();
    },
    passport.authenticate("salesforce", {
        failureRedirect: "/?error=auth_failed",
        session: true,
    }),
    (req, res) => {
        console.log("Auth successful with env:", req.session.oauth_env);
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
                res.clearCookie("connect.sid");

                // 6. Construct Salesforce logout URL with immediate redirect back
                const appUrl = `${req.protocol}://${req.get("host")}`;
                const logoutUrl = `${baseUrl}/secur/logout.jsp?retURL=${encodeURIComponent(
                    appUrl
                )}`;

                console.log("Performing logout:", {
                    baseUrl,
                    logoutUrl,
                    environment: req.user?.environment,
                });

                // 7. Redirect to Salesforce logout
                res.redirect(logoutUrl);
            });
        });
    } catch (error) {
        console.error("Error during logout:", error);
        // Even if there's an error, try to redirect home
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
