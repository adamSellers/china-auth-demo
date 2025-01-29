const express = require("express");
const passport = require("passport");
const router = express.Router();
const axios = require("axios");

// Add state management helpers
const STATE_PREFIX = "oauth_state:";
const STATE_TTL = 60 * 5; // 5 minutes in seconds

const storeOAuthState = async (redisClient, state, env) => {
    const key = `${STATE_PREFIX}${state}`;
    await redisClient.set(key, env, { EX: STATE_TTL });
};

const getOAuthState = async (redisClient, state) => {
    const key = `${STATE_PREFIX}${state}`;
    return await redisClient.get(key);
};

router.get(
    "/salesforce",
    async (req, res, next) => {
        try {
            // Generate state parameter
            const state = crypto.randomBytes(16).toString("hex");

            // Store environment in Redis with state as key
            if (req.query.env) {
                await storeOAuthState(
                    req.app.get("redisClient"),
                    state,
                    req.query.env
                );
                console.log("Stored OAuth state:", {
                    state,
                    env: req.query.env,
                });
            }

            // Add state to session and continue
            req.session.oauth_state = state;
            req.session.oauth_env = req.query.env;

            // Pass state to passport
            req.authInfo = { state };
            next();
        } catch (error) {
            console.error("Error in auth preparation:", error);
            res.redirect("/?error=auth_failed");
        }
    },
    passport.authenticate("salesforce", {
        failureRedirect: "/?error=auth_failed",
        session: true,
    })
);

router.get(
    "/salesforce/callback",
    async (req, res, next) => {
        try {
            // Retrieve environment from state
            const state = req.query.state;
            const env = await getOAuthState(req.app.get("redisClient"), state);

            if (env) {
                req.session.oauth_env = env;
                console.log("Retrieved OAuth state:", { state, env });
                await req.session.save();
            } else {
                console.warn("No OAuth state found for:", state);
            }
            next();
        } catch (error) {
            console.error("Error in callback preparation:", error);
            next(error);
        }
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
