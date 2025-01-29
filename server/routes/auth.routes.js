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

            // First, revoke the Salesforce access token
            await axios.post(`${baseUrl}/services/oauth2/revoke`, null, {
                params: {
                    token: req.user.accessToken,
                },
            });

            // Store the Salesforce logout URL before destroying the session
            const sfLogoutUrl = `${baseUrl}/secur/logout.jsp`;

            // Destroy the local session
            req.session.destroy((err) => {
                if (err) {
                    console.error("Error destroying session:", err);
                    return res.status(500).json({ error: "Logout failed" });
                }

                // Clear the login session
                req.logout(() => {
                    // Redirect to Salesforce logout page, which will then redirect back to our app
                    res.redirect(sfLogoutUrl);
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
