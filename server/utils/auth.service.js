const passport = require("passport");
const OAuth2Strategy = require("passport-oauth2");

class AuthService {
    static initializePassport() {
        // Clear any existing strategies
        if (passport._strategies.salesforce) {
            passport.unuse("salesforce");
        }

        const strategy = new OAuth2Strategy(
            {
                // Initialize with placeholder values - will be overridden in authenticate
                authorizationURL:
                    process.env.SF_LOGIN_URL + "/services/oauth2/authorize",
                tokenURL: process.env.SF_LOGIN_URL + "/services/oauth2/token",
                clientID: process.env.SF_CLIENT_ID,
                clientSecret: process.env.SF_CLIENT_SECRET,
                callbackURL:
                    process.env.SF_CALLBACK_URL ||
                    "http://localhost:3000/auth/salesforce/callback",
                passReqToCallback: true,
            },
            function (req, accessToken, refreshToken, params, profile, cb) {
                if (!params.instance_url) {
                    return cb(new Error("No instance URL received"));
                }

                return cb(null, {
                    accessToken,
                    refreshToken,
                    environment: req.session?.oauth_env || "salesforce",
                });
            }
        );

        // Override authenticate to set correct URLs before proceeding
        const authenticate = strategy.authenticate.bind(strategy);
        strategy.authenticate = function (req, options) {
            const env = req.session?.oauth_env;

            if (env === "sfoa") {
                this._oauth2._authorizeUrl = `${process.env.SFOA_LOGIN_URL}/services/oauth2/authorize`;
                this._oauth2._accessTokenUrl = `${process.env.SFOA_LOGIN_URL}/services/oauth2/token`;
                this._oauth2._clientId = process.env.SFOA_CLIENT_ID;
                this._oauth2._clientSecret = process.env.SFOA_CLIENT_SECRET;
            } else {
                this._oauth2._authorizeUrl = `${process.env.SF_LOGIN_URL}/services/oauth2/authorize`;
                this._oauth2._accessTokenUrl = `${process.env.SF_LOGIN_URL}/services/oauth2/token`;
                this._oauth2._clientId = process.env.SF_CLIENT_ID;
                this._oauth2._clientSecret = process.env.SF_CLIENT_SECRET;
            }

            return authenticate.call(this, req, options);
        };

        // Simplified serialization
        passport.serializeUser((user, done) => {
            done(null, {
                accessToken: user.accessToken,
                environment: user.environment,
            });
        });

        passport.deserializeUser((serialized, done) => {
            done(null, serialized);
        });

        passport.use("salesforce", strategy);
    }
}

module.exports = AuthService;
