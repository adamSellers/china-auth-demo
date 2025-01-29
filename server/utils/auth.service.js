// auth.service.js
const passport = require("passport");
const OAuth2Strategy = require("passport-oauth2");

class AuthService {
    initializePassport() {
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

                return cb(null, {
                    accessToken,
                    refreshToken,
                    environment: req.session?.oauth_env || "salesforce",
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
            } else {
                this._oauth2._authorizeUrl = `${process.env.SF_LOGIN_URL}/services/oauth2/authorize`;
                this._oauth2._accessTokenUrl = `${process.env.SF_LOGIN_URL}/services/oauth2/token`;
                this._oauth2._clientId = process.env.SF_CLIENT_ID;
                this._oauth2._clientSecret = process.env.SF_CLIENT_SECRET;
            }

            return originalAuthenticate.call(this, req, options);
        };

        passport.serializeUser((user, done) => {
            done(null, user);
        });

        passport.deserializeUser((user, done) => {
            done(null, user);
        });

        passport.use("salesforce", strategy);
    }
}

const authService = new AuthService();
module.exports = authService;
