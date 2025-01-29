const passport = require("passport");
const OAuth2Strategy = require("passport-oauth2");

class AuthService {
    static getConfig(env) {
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
        const createStrategy = (env = "salesforce") => {
            const config = AuthService.getConfig(env);

            return new OAuth2Strategy(
                {
                    authorizationURL: `${config.baseUrl}/services/oauth2/authorize`,
                    tokenURL: `${config.baseUrl}/services/oauth2/token`,
                    clientID: config.clientId,
                    clientSecret: config.clientSecret,
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
                        instanceUrl: params.instance_url,
                        environment: req.query.env || env,
                    });
                }
            );
        };

        // Create the initial strategy
        const strategy = createStrategy();

        // Replace the strategy when environment changes
        strategy.authorizationParams = function (options) {
            const env = options?.req?.query?.env || "salesforce";
            const config = AuthService.getConfig(env);

            // Update OAuth URLs and credentials
            this._oauth2._authorizeUrl = `${config.baseUrl}/services/oauth2/authorize`;
            this._oauth2._accessTokenUrl = `${config.baseUrl}/services/oauth2/token`;
            this._oauth2._clientId = config.clientId;
            this._oauth2._clientSecret = config.clientSecret;

            console.log(`Using ${env} environment:`, {
                authorizeUrl: this._oauth2._authorizeUrl,
                tokenUrl: this._oauth2._accessTokenUrl,
            });

            return { env };
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
