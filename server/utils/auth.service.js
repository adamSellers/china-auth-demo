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
                console.log("OAuth callback received:", {
                    hasSession: !!req.session,
                    oauth_env: req.session?.oauth_env,
                    sessionID: req.sessionID,
                });

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

        strategy.authorizationParams = function (options) {
            const env = options?.req?.session?.oauth_env;

            console.log("Configuring OAuth for environment:", {
                env: env,
                sessionID: options?.req?.sessionID,
                hasSession: !!options?.req?.session,
            });

            // Reset OAuth2 configuration based on environment
            if (env === "sfoa") {
                this._oauth2._authorizeUrl = `${process.env.SFOA_LOGIN_URL}/services/oauth2/authorize`;
                this._oauth2._accessTokenUrl = `${process.env.SFOA_LOGIN_URL}/services/oauth2/token`;
                this._oauth2._clientId = process.env.SFOA_CLIENT_ID;
                this._oauth2._clientSecret = process.env.SFOA_CLIENT_SECRET;

                console.log("Using SFOA configuration:", {
                    authorizeUrl: this._oauth2._authorizeUrl,
                    tokenUrl: this._oauth2._accessTokenUrl,
                    hasClientId: !!this._oauth2._clientId,
                    hasClientSecret: !!this._oauth2._clientSecret,
                });
            } else {
                this._oauth2._authorizeUrl = `${process.env.SF_LOGIN_URL}/services/oauth2/authorize`;
                this._oauth2._accessTokenUrl = `${process.env.SF_LOGIN_URL}/services/oauth2/token`;
                this._oauth2._clientId = process.env.SF_CLIENT_ID;
                this._oauth2._clientSecret = process.env.SF_CLIENT_SECRET;

                console.log("Using SF configuration:", {
                    authorizeUrl: this._oauth2._authorizeUrl,
                    tokenUrl: this._oauth2._accessTokenUrl,
                    hasClientId: !!this._oauth2._clientId,
                    hasClientSecret: !!this._oauth2._clientSecret,
                });
            }

            return { env, _ts: Date.now() };
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
