// auth.service.js
const passport = require("passport");
const OAuth2Strategy = require("passport-oauth2");

/**
 * AuthService handles the configuration and initialization of Passport's OAuth2 strategy
 * for Salesforce authentication. It dynamically switches between Salesforce and
 * Salesforce on Alibaba Cloud environments based on the session oauth_env variable.
 */
class AuthService {
    initializePassport() {
        // Remove any existing strategy to prevent duplicates
        if (passport._strategies.salesforce) {
            passport.unuse("salesforce");
        }

        // Configure the base OAuth2 strategy
        const strategy = new OAuth2Strategy(
            {
                // These default values will be overridden in the authenticate method
                authorizationURL:
                    process.env.SF_LOGIN_URL + "/services/oauth2/authorize",
                tokenURL: process.env.SF_LOGIN_URL + "/services/oauth2/token",
                clientID: process.env.SF_CLIENT_ID,
                clientSecret: process.env.SF_CLIENT_SECRET,
                callbackURL:
                    process.env.SF_CALLBACK_URL ||
                    "http://localhost:3000/auth/salesforce/callback",
                passReqToCallback: true,
                state: true,
            },
            function (req, accessToken, refreshToken, params, profile, cb) {
                if (!params.instance_url) {
                    return cb(new Error("No instance URL received"));
                }

                // Store both the environment and token information in the user object
                // This is crucial as the session might be renewed during the auth process
                // We need this information to persist through the entire user session
                const environment = req.session?.oauth_env || "salesforce";
                return cb(null, {
                    accessToken,
                    refreshToken,
                    environment, // Store environment in user object for persistence
                    instance_url: params.instance_url,
                });
            }
        );

        // Override the authenticate method to dynamically configure OAuth endpoints
        // This is necessary because the endpoints and credentials differ between
        // Salesforce and Salesforce on Alibaba Cloud environments
        const originalAuthenticate = strategy.authenticate;
        strategy.authenticate = function (req, options) {
            // Use oauth_env from session to determine which environment to use
            const env = req.session?.oauth_env;

            if (env === "sfoa") {
                console.log("Using SFOA configuration");
                this._oauth2._authorizeUrl = `${process.env.SFOA_LOGIN_URL}/services/oauth2/authorize`;
                this._oauth2._accessTokenUrl = `${process.env.SFOA_LOGIN_URL}/services/oauth2/token`;
                this._oauth2._clientId = process.env.SFOA_CLIENT_ID;
                this._oauth2._clientSecret = process.env.SFOA_CLIENT_SECRET;
            } else {
                console.log("Using SF configuration");
                this._oauth2._authorizeUrl = `${process.env.SF_LOGIN_URL}/services/oauth2/authorize`;
                this._oauth2._accessTokenUrl = `${process.env.SF_LOGIN_URL}/services/oauth2/token`;
                this._oauth2._clientId = process.env.SF_CLIENT_ID;
                this._oauth2._clientSecret = process.env.SF_CLIENT_SECRET;
            }

            // Call the original authenticate method with the updated configuration
            return originalAuthenticate.call(this, req, options);
        };

        // User serialization - Only store essential information
        passport.serializeUser((user, done) => {
            // Serialize both the tokens and environment information
            // This ensures we maintain the correct environment context
            // throughout the user's session, even after passport deserializes
            done(null, {
                accessToken: user.accessToken,
                instance_url: user.instance_url,
                environment: user.environment, // Include environment in serialized data
            });
        });

        // User deserialization - Reconstruct user object from stored data
        passport.deserializeUser((user, done) => {
            done(null, user);
        });

        // Register the strategy with Passport
        passport.use("salesforce", strategy);
    }
}

// Export a singleton instance
const authService = new AuthService();
module.exports = authService;
