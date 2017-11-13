import { SlackMessage } from "@atomist/slack-messages/SlackMessages";
import { ApolloGraphClient } from "../../../graph/ApolloGraphClient";
import { EventFired } from "../../../HandleEvent";
import { HandlerContext } from "../../../HandlerContext";
import { HandlerResult } from "../../../HandlerResult";
import {
    AutomationEventListener,
    AutomationEventListenerSupport,
} from "../../../server/AutomationEventListener";
import { AutomationServer } from "../../../server/AutomationServer";
import { GraphClient } from "../../../spi/graph/GraphClient";
import {
    MessageClient,
    MessageOptions,
} from "../../../spi/message/MessageClient";
import { MessageClientSupport } from "../../../spi/message/MessageClientSupport";
import { CommandInvocation } from "../../invoker/Payload";
import * as namespace from "../../util/cls";
import { logger } from "../../util/logger";
import { AbstractRequestProcessor } from "../AbstractRequestProcessor";
import {
    CommandIncoming,
    EventIncoming,
    isCommandIncoming,
    isEventIncoming,
    RequestProcessor,
} from "../RequestProcessor";
import { WebSocketClientOptions } from "../websocket/WebSocketClient";
import { RegistrationConfirmation } from "../websocket/WebSocketRequestProcessor";

/**
 * A RequestProcessor that is being run as Node.JS Cluster worker handling all the actual work.
 */
class ClusterWorkerRequestProcessor extends AbstractRequestProcessor {

    private graphClients: Map<string, GraphClient> = new Map<string, GraphClient>();
    private registration?: RegistrationConfirmation;

    // tslint:disable-next-line:variable-name
    constructor(private _automations: AutomationServer,
                // tslint:disable-next-line:variable-name
                private _options: WebSocketClientOptions,
                // tslint:disable-next-line:variable-name
                private _listeners: AutomationEventListener[] = []) {
        super(_automations, [..._listeners, new ClusterWorkerAutomationEventListener()]);
        logger.info(`Starting worker with pid '${process.pid}'`);
    }

    public setRegistration(registration: RegistrationConfirmation) {
        logger.debug("Receiving registration: %s", JSON.stringify(registration));
        this.registration = registration;
    }

    protected sendMessage(payload: any): void {
        const message = {
            type: "status",
            cls: {
                ...namespace.get(),
            },
            data: payload,
        };
        process.send(message);
    }

    protected createGraphClient(event: CommandIncoming | EventIncoming): GraphClient {
        let teamId;
        if (isCommandIncoming(event)) {
            teamId = event.team.id;
        } else if (isEventIncoming(event)) {
            teamId = event.extensions.team_id;
        }

        if (this.graphClients.has(teamId)) {
            logger.debug("Re-using cached graph client for team '%s'", teamId);
            return this.graphClients.get(teamId);
        } else if (this.registration) {
            logger.debug("Creating new graph client for team '%s'", teamId);
            const graphClient = new ApolloGraphClient(`${this._options.graphUrl}/${teamId}`,
                { Authorization: `Bearer ${this.registration.jwt}` });
            this.graphClients.set(teamId, graphClient);
            return graphClient;
        }
        logger.debug("Unable to create graph client for team '%s' and registration '$s'",
            teamId, JSON.stringify(this.registration));
        return null;
    }

    protected createMessageClient(event: EventIncoming | CommandIncoming): MessageClient {
        return new ClusterWorkerMessageClient(event);
    }
}

class ClusterWorkerMessageClient extends MessageClientSupport {

    constructor(protected event: EventIncoming | CommandIncoming) {
        super();
    }

    protected doSend(msg: string | SlackMessage, userNames: string | string[],
                     channelNames: string | string[], options?: MessageOptions): Promise<any> {
        const message = {
            type: "message",
            event: this.event,
            cls: {
                ...namespace.get(),
            },
            data: {
                message: msg,
                userNames,
                channelNames,
                options,
            },
        };
        process.send(message);
        return Promise.resolve();
    }
}

class ClusterWorkerAutomationEventListener extends AutomationEventListenerSupport {

    public commandSuccessful(payload: CommandInvocation, ctx: HandlerContext, result: HandlerResult): void {
        const message = {
            type: "command_success",
            event: payload,
            cls: {
                ...namespace.get(),
            },
            data: result,
        };
        process.send(message);
    }

    public commandFailed(payload: CommandInvocation, ctx: HandlerContext, err: any): void {
        const message = {
            type: "command_failure",
            event: payload,
            cls: {
                ...namespace.get(),
            },
            data: err,
        };
        process.send(message);
    }

    public eventSuccessful(payload: EventFired<any>, ctx: HandlerContext, result: HandlerResult[]): void {
        const message = {
            type: "event_success",
            event: payload,
            cls: {
                ...namespace.get(),
            },
            data: result,
        };
        process.send(message);
    }

    public eventFailed(payload: EventFired<any>, ctx: HandlerContext, err: any): void {
        const message = {
            type: "event_failure",
            event: payload,
            cls: {
                ...namespace.get(),
            },
            data: err,
        };
        process.send(message);
    }

}

/**
 * Start a new worker node
 * @param {AutomationServer} automations
 * @param {WebSocketClientOptions} options
 * @returns {RequestProcessor}
 */
export function startWorker(automations: AutomationServer,
                            options: WebSocketClientOptions,
                            listeners: AutomationEventListener[] = []): RequestProcessor {
    const worker = new ClusterWorkerRequestProcessor(automations, options, listeners);
    process.on("message", msg => {
        if (msg.type === "registration") {
            worker.setRegistration(msg.data as RegistrationConfirmation);
        } else if (msg.type === "command") {
            worker.processCommand(msg.data as CommandIncoming);
        } else if (msg.type === "event") {
            worker.processEvent(msg.data as EventIncoming);
        }
    });
    return worker;
}