const express = require("express");
const passport = require("passport");
const router = express.Router();
const axios = require("axios");

router.get(
    "/salesforce",
    function (req, res, next) {
        // Ensure env parameter exists
        if (!req.query.env) {
            req.query.env = "salesforce"; // Set default environment
        }
        console.log("Starting Salesforce auth for env:", req.query.env);
        next();
    },
    passport.authenticate("salesforce", {
        failureRedirect: "/?error=auth_failed",
        session: true,
    })
);

router.get(
    "/salesforce/callback",
    function (req, res, next) {
        // Ensure env parameter is preserved in callback
        if (!req.query.env && req.session.env) {
            req.query.env = req.session.env;
        }
        next();
    },
    passport.authenticate("salesforce", {
        failureRedirect: "/?error=auth_failed",
        session: true,
    }),
    (req, res) => {
        console.log("Auth successful!");
        res.redirect("/dashboard");
    }
);

router.get("/logout", async (req, res) => {
    try {
        if (req.user && req.user.accessToken) {
            const baseUrl =
                req.user.environment === "sfoa"
                    ? process.env.SFOA_LOGIN_URL
                    : process.env.SF_LOGIN_URL;

            // Build the app's base URL for the redirect
            const protocol = req.headers["x-forwarded-proto"] || req.protocol;
            const appBaseUrl = `${protocol}://${req.headers.host}`;

            // First, do a frontend session logout
            const frontendLogoutUrl = `${baseUrl}/secur/frontdoor.jsp?retURL=${encodeURIComponent(
                "/secur/logout.jsp"
            )}&save=true`;

            try {
                await axios.get(frontendLogoutUrl, {
                    headers: {
                        Authorization: `Bearer ${req.user.accessToken}`,
                    },
                });
            } catch (error) {
                console.error("Error in frontend logout:", error);
                // Continue with the rest of the logout process
            }

            // Then revoke the access token
            try {
                await axios.post(`${baseUrl}/services/oauth2/revoke`, null, {
                    params: {
                        token: req.user.accessToken,
                    },
                });
            } catch (error) {
                console.error("Error revoking token:", error);
                // Continue with the rest of the logout process
            }

            // Finally do the full logout with redirect back to our app
            const logoutUrl = `${baseUrl}/secur/logout.jsp?retURL=${encodeURIComponent(
                appBaseUrl
            )}`;

            // Destroy the local session
            req.session.destroy((err) => {
                if (err) {
                    console.error("Error destroying session:", err);
                    return res.status(500).json({ error: "Logout failed" });
                }

                // Clear the login session and redirect to Salesforce logout
                req.logout(() => {
                    res.redirect(logoutUrl);
                });
            });
        } else {
            // If no user or token, just clear local session
            req.session.destroy((err) => {
                if (err) {
                    console.error("Error destroying session:", err);
                    return res.status(500).json({ error: "Logout failed" });
                }
                req.logout(() => {
                    res.redirect("/");
                });
            });
        }
    } catch (error) {
        console.error("Error during logout:", error);
        res.status(500).json({
            error: "Logout failed",
            details: error.message,
        });
    }
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
