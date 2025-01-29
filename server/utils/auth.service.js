const passport = require("passport");
const OAuth2Strategy = require("passport-oauth2");

class AuthService {
    static getConfig(env) {
        const isSFOA = env === "sfoa";
        return {
            loginUrl: isSFOA
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
        // Configure the base strategy
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
            },
            function (req, accessToken, refreshToken, params, profile, cb) {
                console.log("OAuth callback received:", {
                    hasAccessToken: !!accessToken,
                    hasInstanceUrl: !!params?.instance_url,
                    instanceUrl: params?.instance_url,
                    environment: req.query.env,
                });

                if (!params.instance_url) {
                    console.error(
                        "No instance_url received from Salesforce OAuth"
                    );
                    return cb(
                        new Error("No instance URL received from Salesforce")
                    );
                }

                return cb(null, {
                    accessToken,
                    refreshToken,
                    instanceUrl: params.instance_url,
                    environment: req.query.env,
                    profile,
                });
            }
        );

        // Override the OAuth URLs based on the environment parameter
        strategy.authorizationParams = function (options) {
            // Get environment from the request query
            const env = options.req.query.env || "salesforce";
            const config = AuthService.getConfig(env);

            // Update the authorization and token URLs for this request
            this._oauth2._authorizeUrl = `${config.loginUrl}/services/oauth2/authorize`;
            this._oauth2._accessTokenUrl = `${config.loginUrl}/services/oauth2/token`;
            this._oauth2._clientId = config.clientId;
            this._oauth2._clientSecret = config.clientSecret;

            return {
                env: env, // Pass the environment to the callback
            };
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
