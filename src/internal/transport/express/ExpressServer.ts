import * as appRoot from "app-root-path";
import axios from "axios";
import * as bodyParser from "body-parser";
import * as express from "express";
import { Express } from "express";
import * as fs from "fs";
import * as _ from "lodash";
import * as mustacheExpress from "mustache-express";
import * as passport from "passport";
import * as github from "passport-github";
import * as http from "passport-http";
import * as bearer from "passport-http-bearer";
import * as globals from "../../../globals";
import { AutomationServer } from "../../../server/AutomationServer";
import {
    CommandHandlerMetadata,
    IngestorMetadata,
} from "../../metadata/metadata";
import { logger } from "../../util/logger";
import { report } from "../../util/metric";
import { guid } from "../../util/string";
import {
    CommandIncoming,
    EventIncoming,
    RequestProcessor,
} from "../RequestProcessor";

const ApiBase = "";

let Basic = false;
let Bearer = false;
let GitHub = false;

/**
 * Registers an endpoint for every automation and exposes
 * metadataFromInstance at root. Responsible for marshalling into the appropriate structure
 */
export class ExpressServer {

    constructor(private automations: AutomationServer,
                private options: ExpressServerOptions,
                private handler: RequestProcessor) {

        const exp = express();

        exp.engine("html", mustacheExpress());
        exp.set("view engine", "mustache");

        exp.use(bodyParser.json());
        exp.use(require("express-session")({ secret: "this is really secret", resave: true, saveUninitialized: true }));

        exp.use(passport.initialize());
        exp.use(passport.session());

        // TODO that's probably not the way it should work; but it does work when using this inside a node_module
        if (fs.existsSync(appRoot + "/views")) {
            exp.set("views", appRoot + "/views");
        } else {
            exp.set("views", appRoot + "/node_modules/@atomist/automation-client/views");
        }

        if (fs.existsSync(appRoot + "/public")) {
            exp.use(express.static(appRoot + "/public"));
        } else {
            exp.use(express.static(appRoot + "/node_modules/@atomist/automation-client/public"));
        }

        this.setupAuthentication();

        if (this.options.auth && this.options.auth.github.enabled) {
            exp.get("/auth/github", passport.authenticate("github"));
            exp.get("/auth/github/callback", passport.authenticate("github", { failureRedirect: "/login" }),
                (req, res) => {
                    // Successful authentication, redirect home.
                    res.redirect("/");
                });
        }

        // Set up routes
        exp.get(`${ApiBase}/automations`, authenticate,
            (req, res) => {
                res.setHeader("Content-Type", "application/json");
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.json(automations.rugs);
        });

        exp.get(`${ApiBase}/metrics`, authenticate,
            (req, res) => {
                res.setHeader("Content-Type", "application/json");
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.json(report.summary());
        });

        exp.get(`${ApiBase}/log/events`, authenticate,
            (req, res) => {
                res.setHeader("Content-Type", "application/json");
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.json(globals.eventStore().events(req.query.from));
        });

        exp.get(`${ApiBase}/log/commands`, authenticate,
            (req, res) => {
                res.setHeader("Content-Type", "application/json");
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.json(globals.eventStore().commands(req.query.from));
        });

        exp.get(`${ApiBase}/log/messages`, authenticate,
            (req, res) => {
                res.setHeader("Content-Type", "application/json");
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.json(globals.eventStore().messages(req.query.from));
        });

        exp.get(`${ApiBase}/series/events`, authenticate,
            (req, res) => {
                res.setHeader("Content-Type", "application/json");
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.json(globals.eventStore().eventSeries());
            });

        exp.get(`${ApiBase}/series/commands`, authenticate,
            (req, res) => {
                res.setHeader("Content-Type", "application/json");
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.json(globals.eventStore().commandSeries());
            });

        exp.get("/graphql", authenticate,
            (req, res) => {
                const teamId = req.query.teamId ? req.query.teamId : this.automations.rugs.team_ids[0];
                res.render("graphql.html", { token: globals.jwtToken(),
                    graphQLUrl: `${this.options.endpoint.graphql}/${teamId}`,
                    teamIds: this.automations.rugs.team_ids,
                    user: req.user });
        });

        exp.get("/", authenticate,
            (req, res) => {
                res.render("index.html", { user: req.user });
        });

        exp.get("/login",
            (req, res) => {
                res.render("login.html", { user: req.user });
            });

        automations.rugs.commands.forEach(
            h => {
                this.exposeCommandHandlerInvocationRoute(exp,
                    `${ApiBase}/command/${_.kebabCase(h.name)}`, h,
                    (res, result) => res.send(result));
            },
        );
        automations.rugs.ingestors.forEach(
            i => {
                this.exposeEventInvocationRoute(exp,
                    `${ApiBase}/ingest/${i.route.toLowerCase()}`, i,
                    (res, result) => res.send(result));
        });

        exp.listen(this.options.port, () => {
            logger.info(`Atomist automation dashboard running at 'http://${this.options.host}:${this.options.port}'`);
        });
    }

    private exposeCommandHandlerInvocationRoute(exp: Express,
                                                url: string,
                                                h: CommandHandlerMetadata,
                                                handle: (res, result) => any) {

        exp.post(url, authenticate, (req, res) => {

            const payload: CommandIncoming = {
                atomist_type: "command_handler_request",
                name: h.name,
                rug: {},
                correlation_context: {team: { id: this.automations.rugs.team_ids[0] }},
                corrid: guid(),
                team: {
                    id: this.automations.rugs.team_ids[0],
                },
                ...req.body,
            };

            this.handler.processCommand(payload, result => {
                handle(res, result);
            }, error => {
                res.status(500).send({ message: error.toString()});
            });
        });

        exp.get(url, authenticate,
            (req, res) => {
                const parameters = h.parameters.filter(p => {
                    const value = req.query[p.name];
                    return value && value.length > 0;
                }).map(p => {
                    return {name: p.name, value: req.query[p.name]};
                });
                const mappedParameters = h.mapped_parameters.filter(p => {
                    const value = req.query[`mp_${p.local_key}`];
                    return value && value.length > 0;
                }).map(p => {
                    return {name: p.local_key, value: req.query[`mp_${p.local_key}`]};
                });
                const secrets = h.secrets.filter(p => {
                    const value = req.query[`s_${p.path}`];
                    if (value && value.length > 0) {
                        return true;
                    } else if (p.path.startsWith("github://") && req.user && req.user.accessToken) {
                        return true;
                    }
                    return false;
                }).map(p => {
                    const value = req.query[`s_${p.path}`];
                    if (value) {
                        return {name: p.path, value };
                    } else {
                        return {name: p.path, value: req.user.accessToken };
                    }
                });

                const payload: CommandIncoming = {
                    atomist_type: "command_handler_request",
                    name: h.name,
                    parameters,
                    rug: {},
                    mapped_parameters: mappedParameters,
                    secrets,
                    correlation_context: {team: { id: this.automations.rugs.team_ids[0] }},
                    corrid: guid(),
                    team: {
                        id: this.automations.rugs.team_ids[0],
                    },
                };
                this.handler.processCommand(payload, result => {
                    handle(res, result);
                }, error => {
                    res.status(500).send({ message: error.toString()});
                });
        });
    }

    private exposeEventInvocationRoute(exp: Express,
                                       url: string,
                                       h: IngestorMetadata,
                                       handle: (res, result) => any) {
        exp.post(url, (req, res) => {
            const payload: EventIncoming = {
                data: req.body,
                extensions: {
                    operationName: h.route,
                    correlation_id: guid(),
                    team_id: this.automations.rugs.team_ids[0],
                },
                secrets: [],
            };
            this.handler.processEvent(payload, result => {
                handle(res, result);
            }, error => {
                res.status(500).send({ message: error.toString()});
            });
        });
    }

    private setupAuthentication() {

        passport.serializeUser((user, cb) => {
            cb(null, user);
        });

        passport.deserializeUser((obj, cb) => {
            cb(null, obj);
        });

        if (this.options.auth && this.options.auth.github.enabled) {
            const scopes = this.options.auth.github.scopes
                ? this.options.auth.github.scopes : ["user", "repo", "read:org"];

            const org = this.options.auth.github.org;
            passport.use(new github.Strategy({
                    clientID: this.options.auth.github.clientId,
                    clientSecret: this.options.auth.github.clientSecret,
                    callbackURL: `${this.options.auth.github.callbackUrl}/auth/github/callback`,
                    userAgent: `${this.automations.rugs.name}/${this.automations.rugs.version}`,
                    scope: scopes,
                }, (accessToken, refreshToken, profile, cb) => {
                    if (org) {
                        // check org membership
                        axios.get(`https://api.github.com/orgs/${org}/members/${profile.username}`,
                            { headers: { Authorization: `token ${accessToken}` }})
                            .then(() => cb(null, { ...profile, accessToken } ))
                            .catch(err => cb(err));
                    } else {
                        return cb(null, { ...profile, accessToken });
                    }
                },
            ));

            GitHub = true;
        }

        if (this.options.auth && this.options.auth.basic && this.options.auth.basic.enabled) {
            const user: string = this.options.auth.basic.username ? this.options.auth.basic.username : "admin";
            const pwd: string = this.options.auth.basic.password ? this.options.auth.basic.password : guid();

            passport.use(new http.BasicStrategy(
                (username, password, done) => {
                    if (user === username && pwd === password) {
                        done(null, { user: username });
                    } else {
                        done(null, false);
                    }
                },
            ));

            if (!this.options.auth.basic.password) {
                logger.info(`Auto-generated credentials for web endpoints are user '${user}' and password '${pwd}'`);
            }

            Basic = true;
        }

        if (this.options.auth && this.options.auth.bearer && this.options.auth.bearer.enabled) {
            const tk = this.options.auth.bearer.token;

            passport.use(new bearer.Strategy(
                (token, done) => {
                    if (token === tk) {
                        done(null, { token } );
                    } else {
                        done(null, false);
                    }
                },
            ));

            Bearer = true;
        }
    }
}

function authenticate(req, res, next): any {
    // Check for Auth headers first
    if (req.headers.authorization || req.headers.Authorization) {
        if (Bearer && Basic) {
            passport.authenticate(["basic", "bearer"])(req, res, next);
        } else if (Bearer) {
            passport.authenticate(["bearer"])(req, res, next);
        } else if (Basic) {
            passport.authenticate(["basic"])(req, res, next);
        }
    } else if (Basic && !GitHub) {
        passport.authenticate(["basic"])(req, res, next);
    } else {
        require("connect-ensure-login").ensureLoggedIn()(req, res, next);
    }
}

export interface ExpressServerOptions {

    port: number;
    host?: string;
    auth?: {
        basic: {
            enabled: boolean;
            username?: string;
            password?: string;
        },
        bearer: {
            enabled: boolean;
            token: string;
        },
        github: {
            enabled: boolean;
            clientId: string,
            clientSecret: string,
            callbackUrl: string,
            org?: string,
            scopes?: string[];
        },
    };
    endpoint: {
        graphql: string;
    };
}
