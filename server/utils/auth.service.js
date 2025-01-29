const passport = require("passport");
const OAuth2Strategy = require("passport-oauth2");

class AuthService {
    static getConfig(env) {
        // Default to regular SF if env is not explicitly sfoa
        const isSFOA = env === "sfoa";

        return {
            baseUrl: isSFOA
                ? process.env.SFOA_LOGIN_URL
                : process.env.SF_LOGIN_URL,
            clientId: isSFOA
                ? process.env.SFOA_CLIENT_ID
                : process.env.SF_CLIENT_ID,
            clientSecret: isSFOA
                ? process.env.SFOA_CLIENT_SECRET
                : process.env.SF_CLIENT_SECRET,
        };
    }

    static initializePassport() {
        const strategy = new OAuth2Strategy(
            {
                // These initial values don't matter as they'll be overridden in authorizationParams
                authorizationURL: `${process.env.SF_LOGIN_URL}/services/oauth2/authorize`,
                tokenURL: `${process.env.SF_LOGIN_URL}/services/oauth2/token`,
                clientID: process.env.SF_CLIENT_ID,
                clientSecret: process.env.SF_CLIENT_SECRET,
                callbackURL:
                    process.env.SF_CALLBACK_URL ||
                    "http://localhost:3000/auth/salesforce/callback",
                passReqToCallback: true,
                state: true,
            },
            function (req, accessToken, refreshToken, params, profile, cb) {
                // Get environment from the initial auth request
                const env = req.query.env || "salesforce";

                if (!params.instance_url) {
                    return cb(new Error("No instance URL received"));
                }

                // For SFOA, verify we got a .cn URL
                if (env === "sfoa" && !params.instance_url.endsWith(".cn")) {
                    return cb(
                        new Error("Invalid instance URL for SFOA environment")
                    );
                }

                return cb(null, {
                    accessToken,
                    refreshToken,
                    instanceUrl: params.instance_url,
                    environment: env,
                });
            }
        );

        strategy.authorizationParams = function (options) {
            if (!options?.req) {
                console.error("Missing request object in authorizationParams");
                return {};
            }

            const env = options.req.query.env || "salesforce";
            const config = AuthService.getConfig(env);

            // Configure OAuth endpoints
            this._oauth2._authorizeUrl = `${config.baseUrl}/services/oauth2/authorize`;
            this._oauth2._accessTokenUrl = `${config.baseUrl}/services/oauth2/token`;
            this._oauth2._clientId = config.clientId;
            this._oauth2._clientSecret = config.clientSecret;

            console.log(`OAuth configuration for ${env}:`, {
                authorizeUrl: this._oauth2._authorizeUrl,
                environment: env,
            });

            return { env };
        };

        passport.use("salesforce", strategy);

        // Only serialize essential data
        passport.serializeUser((user, done) => {
            const serialized = {
                accessToken: user.accessToken,
                instanceUrl: user.instanceUrl,
                environment: user.environment,
            };
            done(null, serialized);
        });

        passport.deserializeUser((serialized, done) => {
            done(null, serialized);
        });
    }
}

module.exports = AuthService;
