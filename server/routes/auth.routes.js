const express = require("express");
const passport = require("passport");
const router = express.Router();
const axios = require("axios");

router.get("/salesforce", passport.authenticate("salesforce"));

router.get(
    "/salesforce/callback",
    passport.authenticate("salesforce", { failureRedirect: "/login" }),
    (req, res) => {
        console.log("auth successful!");
        res.redirect("/");
    }
);

router.get("/logout", (req, res) => {
    // Properly destroy the session
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
            `${process.env.SF_LOGIN_URL}/services/oauth2/userinfo`,
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
