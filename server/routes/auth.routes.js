const express = require("express");
const passport = require("passport");
const router = express.Router();
const axios = require("axios");

router.get(
    "/salesforce",
    function (req, res, next) {
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
    passport.authenticate("salesforce", {
        failureRedirect: "/?error=auth_failed",
        session: true,
    }),
    (req, res) => {
        console.log("Auth successful!");
        res.redirect("/dashboard");
    }
);

router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).json({ error: "Logout failed" });
        }
        // Clear the login session
        req.logout(() => {
            // Redirect to home page
            res.redirect("/");
        });
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
