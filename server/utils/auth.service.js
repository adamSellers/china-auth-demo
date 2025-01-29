// auth.service.js
const passport = require("passport");
const OAuth2Strategy = require("passport-oauth2");

class AuthService {
    initializePassport() {
        // Remove any existing strategy
        if (passport._strategies.salesforce) {
            passport.unuse("salesforce");
        }

        const strategy = new OAuth2Strategy(
            {
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

                const environment = req.session?.oauth_env || "salesforce";
                return cb(null, {
                    accessToken,
                    refreshToken,
                    environment,
                    instance_url: params.instance_url,
                });
            }
        );

        // Override authenticate method for dynamic configuration
        const originalAuthenticate = strategy.authenticate;
        strategy.authenticate = function (req, options) {
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

            return originalAuthenticate.call(this, req, options);
        };

        // User serialization
        passport.serializeUser((user, done) => {
            done(null, {
                accessToken: user.accessToken,
                environment: user.environment,
                instance_url: user.instance_url,
            });
        });

        // User deserialization
        passport.deserializeUser((user, done) => {
            done(null, user);
        });

        // Register the strategy
        passport.use("salesforce", strategy);
    }
}

// Export a singleton instance
const authService = new AuthService();
module.exports = authService;
