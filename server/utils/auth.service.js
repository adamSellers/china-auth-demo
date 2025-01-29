const passport = require("passport");
const OAuth2Strategy = require("passport-oauth2");

class AuthService {
    static getConfig(env) {
        const isSFOA = env === "sfoa";
        const baseUrl = isSFOA
            ? process.env.SFOA_LOGIN_URL
            : process.env.SF_LOGIN_URL;

        return {
            baseUrl,
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
                authorizationURL: `${process.env.SF_LOGIN_URL}/services/oauth2/authorize`,
                tokenURL: `${process.env.SF_LOGIN_URL}/services/oauth2/token`,
                clientID: process.env.SF_CLIENT_ID,
                clientSecret: process.env.SF_CLIENT_SECRET,
                callbackURL:
                    process.env.SF_CALLBACK_URL ||
                    "http://localhost:3000/auth/salesforce/callback",
                passReqToCallback: true,
                state: true, // Enable state parameter for CSRF protection
            },
            function (req, accessToken, refreshToken, params, profile, cb) {
                // Get environment from session or query
                const env =
                    req.session?.oauth_env || req.query?.env || "salesforce";

                console.log("OAuth callback received:", {
                    hasAccessToken: !!accessToken,
                    hasInstanceUrl: !!params?.instance_url,
                    instanceUrl: params?.instance_url,
                    environment: env,
                    session_env: req.session?.oauth_env,
                    query_env: req.query?.env,
                });

                if (!params.instance_url) {
                    console.error("No instance_url received from OAuth");
                    return cb(new Error("No instance URL received"));
                }

                return cb(null, {
                    accessToken,
                    refreshToken,
                    instanceUrl: params.instance_url,
                    environment: env,
                    profile,
                });
            }
        );

        // Override the OAuth URLs based on the environment parameter
        strategy.authorizationParams = function (options) {
            const env =
                options?.req?.session?.oauth_env ||
                options?.req?.query?.env ||
                "salesforce";
            const config = AuthService.getConfig(env);

            if (!options?.req) {
                console.warn("Request object missing in authorizationParams");
                console.log("Available options:", JSON.stringify(options));
                // Return basic params without modifying OAuth URLs
                return { env };
            }

            // Set all OAuth endpoints to use the environment-specific base URL
            this._oauth2._authorizeUrl = `${config.baseUrl}/services/oauth2/authorize`;
            this._oauth2._accessTokenUrl = `${config.baseUrl}/services/oauth2/token`;
            this._oauth2._clientId = config.clientId;
            this._oauth2._clientSecret = config.clientSecret;

            console.log(`Configuring OAuth endpoints for ${env}:`, {
                authorizeUrl: this._oauth2._authorizeUrl,
                accessTokenUrl: this._oauth2._accessTokenUrl,
                clientId: this._oauth2._clientId?.substring(0, 5) + "...", // Log partial client ID for debugging
            });

            return { env };
        };

        passport.use("salesforce", strategy);

        passport.serializeUser((user, done) => {
            const serialized = {
                accessToken: user.accessToken,
                refreshToken: user.refreshToken,
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
