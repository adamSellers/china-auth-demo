const passport = require("passport");
const OAuth2Strategy = require("passport-oauth2");

class AuthService {
    static initializePassport() {
        const strategy = new OAuth2Strategy(
            {
                // These will be overridden immediately in authorizationParams
                authorizationURL: "placeholder",
                tokenURL: "placeholder",
                clientID: "placeholder",
                clientSecret: "placeholder",
                callbackURL:
                    process.env.SF_CALLBACK_URL ||
                    "http://localhost:3000/auth/salesforce/callback",
                passReqToCallback: true,
            },
            function (req, accessToken, refreshToken, params, profile, cb) {
                console.log("Callback received with request:", {
                    hasQuery: !!req.query,
                    env: req.query?.env,
                    session: req.session,
                });

                if (!params.instance_url) {
                    return cb(new Error("No instance URL received"));
                }

                return cb(null, {
                    accessToken,
                    refreshToken,
                    instanceUrl: params.instance_url,
                    environment: req.query?.env,
                });
            }
        );

        // Override the OAuth URLs based on the environment parameter
        strategy.authorizationParams = function (options) {
            // Debug log the entire options object
            console.log(
                "Authorization params options:",
                JSON.stringify(options, null, 2)
            );

            const env = options?.req?.query?.env;
            console.log("Environment value:", env);
            console.log("Options chain:", {
                hasOptions: !!options,
                hasReq: !!options?.req,
                hasQuery: !!options?.req?.query,
                queryContent: options?.req?.query,
            });

            // If env is undefined, check session
            const finalEnv =
                env || options?.req?.session?.oauth_env || "salesforce";
            console.log("Final environment value:", finalEnv);

            // Explicitly handle SFOA vs SF
            if (finalEnv === "sfoa") {
                if (!process.env.SFOA_LOGIN_URL) {
                    console.error(
                        "Missing SFOA_LOGIN_URL environment variable!"
                    );
                }

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

            return { env: finalEnv };
        };

        passport.use("salesforce", strategy);

        passport.serializeUser((user, done) => {
            done(null, {
                accessToken: user.accessToken,
                instanceUrl: user.instanceUrl,
                environment: user.environment,
            });
        });

        passport.deserializeUser((serialized, done) => {
            done(null, serialized);
        });
    }
}

module.exports = AuthService;
