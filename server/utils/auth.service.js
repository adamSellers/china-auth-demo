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
            },
            async function (
                req,
                accessToken,
                refreshToken,
                params,
                profile,
                cb
            ) {
                try {
                    console.log("OAuth callback received:", {
                        oauth_env: req.session?.oauth_env,
                        sessionID: req.sessionID,
                        params: params,
                    });

                    if (!params.instance_url) {
                        return cb(new Error("No instance URL received"));
                    }

                    // Wait for session to be ready
                    await new Promise((resolve) => setTimeout(resolve, 100));

                    const environment = req.session?.oauth_env || "salesforce";
                    console.log("Using environment:", environment);

                    return cb(null, {
                        accessToken,
                        refreshToken,
                        environment,
                        instance_url: params.instance_url,
                    });
                } catch (error) {
                    console.error("Error in OAuth callback:", error);
                    return cb(error);
                }
            }
        );

        // Store the original authenticate method
        const originalAuthenticate = strategy.authenticate;
        strategy.authenticate = function (req, options) {
            const env = req.session?.oauth_env;
            console.log("Strategy authenticate called with env:", env);

            // Configure OAuth based on environment
            if (env === "sfoa") {
                console.log("Using SFOA configuration");
                this._oauth2._authorizeUrl = `${process.env.SFOA_LOGIN_URL}/services/oauth2/authorize`;
                this._oauth2._accessTokenUrl = `${process.env.SFOA_LOGIN_URL}/services/oauth2/token`;
                this._oauth2._clientId = process.env.SFOA_CLIENT_ID;
                this._oauth2._clientSecret = process.env.SFOA_CLIENT_SECRET;
            } else {
                console.log("Using SF configuration");
                this._oauth2._authorizeUrl = `${process.env.SF_LOGIN_URL}/services/oauth2/authorize`;
                this._oauth2._accessTokenUrl = `${process.env.SF_LOGIN_URL}/services/oauth2/token`;
                this._oauth2._clientId = process.env.SF_CLIENT_ID;
                this._oauth2._clientSecret = process.env.SF_CLIENT_SECRET;
            }

            // Add debug logging for OAuth configuration
            console.log("OAuth Configuration:", {
                authorizeUrl: this._oauth2._authorizeUrl,
                clientId: this._oauth2._clientId?.substring(0, 5) + "...",
                env: env,
            });

            return originalAuthenticate.call(this, req, options);
        };

        passport.serializeUser((user, done) => {
            done(null, {
                accessToken: user.accessToken,
                environment: user.environment,
                instance_url: user.instance_url,
            });
        });

        passport.deserializeUser((serialized, done) => {
            done(null, serialized);
        });

        passport.use("salesforce", strategy);
    }
}
