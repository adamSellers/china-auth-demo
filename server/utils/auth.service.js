const passport = require("passport");
const OAuth2Strategy = require("passport-oauth2");

class AuthService {
    static initializePassport() {
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
                pkce: false,
                store: true,
            },
            function (req, accessToken, refreshToken, params, profile, cb) {
                console.log("OAuth callback received:", {
                    oauth_env: req.session?.oauth_env,
                    sessionID: req.sessionID,
                    session: req.session,
                });

                if (!params.instance_url) {
                    return cb(new Error("No instance URL received"));
                }

                // Default to 'salesforce' if env is missing, but log the issue
                const environment = req.session?.oauth_env || "salesforce";
                if (!req.session?.oauth_env) {
                    console.warn(
                        "Warning: oauth_env missing in session during callback"
                    );
                }

                return cb(null, {
                    accessToken,
                    refreshToken,
                    environment,
                    instance_url: params.instance_url,
                });
            }
        );

        // Store the original authenticate method
        const originalAuthenticate = strategy.authenticate;
        strategy.authenticate = function (req, options) {
            const env = req.session?.oauth_env;
            console.log("Authenticate called with env:", env);

            // Configure OAuth based on environment
            if (env === "sfoa") {
                this._oauth2._authorizeUrl = `${process.env.SFOA_LOGIN_URL}/services/oauth2/authorize`;
                this._oauth2._accessTokenUrl = `${process.env.SFOA_LOGIN_URL}/services/oauth2/token`;
                this._oauth2._clientId = process.env.SFOA_CLIENT_ID;
                this._oauth2._clientSecret = process.env.SFOA_CLIENT_SECRET;

                console.log("Using SFOA configuration:", {
                    authorizeUrl: this._oauth2._authorizeUrl,
                });
            } else {
                this._oauth2._authorizeUrl = `${process.env.SF_LOGIN_URL}/services/oauth2/authorize`;
                this._oauth2._accessTokenUrl = `${process.env.SF_LOGIN_URL}/services/oauth2/token`;
                this._oauth2._clientId = process.env.SF_CLIENT_ID;
                this._oauth2._clientSecret = process.env.SF_CLIENT_SECRET;

                console.log("Using SF configuration:", {
                    authorizeUrl: this._oauth2._authorizeUrl,
                });
            }

            // Call the original authenticate method
            return originalAuthenticate.call(this, req, options);
        };

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
