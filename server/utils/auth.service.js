// auth.service.js
const passport = require("passport");
const OAuth2Strategy = require("passport-oauth2");

class AuthService {
    static initializePassport() {
        // Clear any existing strategies first
        passport.unuse("salesforce");

        const strategy = new OAuth2Strategy(
            {
                // Force these to be explicitly undefined to prevent any caching
                authorizationURL: undefined,
                tokenURL: undefined,
                clientID: undefined,
                clientSecret: undefined,
                callbackURL:
                    process.env.SF_CALLBACK_URL ||
                    "http://localhost:3000/auth/salesforce/callback",
                passReqToCallback: true,
            },
            function (req, accessToken, refreshToken, params, profile, cb) {
                console.log("OAuth callback params:", {
                    hasAccessToken: !!accessToken,
                    hasRefreshToken: !!refreshToken,
                    params: params,
                    sessionEnv: req.session?.oauth_env,
                    instanceUrl: params.instance_url,
                });

                // Clear any stored OAuth2 data
                if (this._oauth2) {
                    this._oauth2._customHeaders = {};
                    this._oauth2._authorizeUrl = undefined;
                    this._oauth2._accessTokenUrl = undefined;
                    this._oauth2._clientId = undefined;
                    this._oauth2._clientSecret = undefined;
                }

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
            console.log("Current OAuth2 state:", {
                hasCustomHeaders: !!this._oauth2._customHeaders,
                currentAuthorizeUrl: this._oauth2._authorizeUrl,
                currentTokenUrl: this._oauth2._accessTokenUrl,
            });

            // Force clear any existing configuration
            this._oauth2._customHeaders = {};
            this._oauth2._authorizeUrl = undefined;
            this._oauth2._accessTokenUrl = undefined;

            const env = options?.req?.session?.oauth_env || "salesforce";
            console.log("Setting up OAuth for environment:", env);

            if (env === "sfoa") {
                if (!process.env.SFOA_LOGIN_URL) {
                    console.error(
                        "Missing SFOA_LOGIN_URL environment variable!"
                    );
                }

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

            console.log("OAuth2 configuration set to:", {
                authorizeUrl: this._oauth2._authorizeUrl,
                tokenUrl: this._oauth2._accessTokenUrl,
                hasClientId: !!this._oauth2._clientId,
                hasClientSecret: !!this._oauth2._clientSecret,
            });

            return { env };
        };

        // Simplify serialization to bare minimum
        passport.serializeUser((user, done) => {
            console.log("Serializing user:", {
                environment: user.environment,
                hasAccessToken: !!user.accessToken,
            });
            done(null, {
                accessToken: user.accessToken,
                environment: user.environment,
            });
        });

        passport.deserializeUser((serialized, done) => {
            console.log("Deserializing user:", {
                environment: serialized.environment,
                hasAccessToken: !!serialized.accessToken,
            });
            done(null, serialized);
        });

        passport.use("salesforce", strategy);
    }
}

module.exports = AuthService;
