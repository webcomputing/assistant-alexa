import * as verifyAlexa from "alexa-verifier";
import { inject, injectable } from "inversify";
import { Component } from "inversify-components";
import { amazonToGenericIntent as dictionary } from "./intent-dict";
import { COMPONENT_NAME, Configuration } from "./private-interfaces";
import { AlexaRequestContext, askInterfaces, ExtractionInterface } from "./public-interfaces";
import {
  ComponentSpecificLoggerFactory,
  GenericIntent,
  injectionNames,
  intent,
  Logger,
  RequestExtractor as AssistantJSRequestExtractor,
} from "assistant-source";

@injectable()
export class RequestExtractor implements AssistantJSRequestExtractor {
  public component: Component<Configuration.Runtime>;
  private configuration: Configuration.Runtime;
  private logger: Logger;
  verifyAlexaProxy: any;

  constructor(
    @inject("meta:component//alexa") componentMeta: Component<Configuration.Runtime>,
    @inject(injectionNames.componentSpecificLoggerFactory) loggerFactory: ComponentSpecificLoggerFactory
  ) {
    this.component = componentMeta;
    this.configuration = componentMeta.configuration;
    this.logger = loggerFactory(COMPONENT_NAME, "root");
    this.verifyAlexaProxy = this.resolveVerifier();
  }

  fits(context: AlexaRequestContext): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      if (this.fitsInternal(context)) {
        this.verifyAlexaProxy(context.headers["signaturecertchainurl"], context.headers["signature"], JSON.stringify(context.body), error => {
          if (error) {
            this.logger.error(
              { requestId: context.id },
              ": Incoming request matched for configured route and applicationID, but could not be verified correctly with alexa-verifier module. Error = ",
              error
            );
            resolve(false);
          } else {
            this.logger.debug({ requestId: context.id }, "Incomming request matched.");
            resolve(true);
          }
        });
      } else {
        this.logger.debug({ requestId: context.id }, "Incomming request did not match for route / applicationID.");
        resolve(false);
      }
    });
  }

  extract(context: AlexaRequestContext): Promise<ExtractionInterface> {
    return new Promise((resolve, reject) => {
      let user = this.getUser(context);
      let resolvedContext: ExtractionInterface = {
        sessionID: `alexa-${this.getSessionID(context)}`,
        intent: this.getIntent(context),
        entities: this.getEntities(context),
        language: this.getLanguage(context),
        platform: this.component.name,
        oAuthToken: typeof user === "undefined" ? null : user,
        temporalAuthToken: this.getTemporalAuth(context),
        requestTimestamp: this.getRequestTimestamp(context),
      };
      resolve(resolvedContext);
    });
  }

  getTemporalAuth(context: AlexaRequestContext): string {
    return context.body.session.user.userId;
  }

  resolveVerifier() {
    if (this.configuration.useVerifier === false) {
      this.logger.warn("Using proxy verifier instead of alexa-verify. Hope you know what you are doing.");
      return (chainurl, signature, body, callback: (error) => any) => {
        callback(false);
      };
    } else {
      return verifyAlexa;
    }
  }

  private fitsInternal(context: AlexaRequestContext) {
    if (typeof this.configuration.applicationID !== "string") {
      throw new Error("You did not configure an applicationID. Using assistant-alexa without configuring an applicationID is not possible.");
    }

    if (typeof context.body.session === "undefined" || typeof context.body.session.application === "undefined") return false;
    return context.path === this.configuration.route && context.body.session.application.applicationId === this.configuration.applicationID;
  }

  private getSessionID(context: AlexaRequestContext) {
    return context.body.session.sessionId;
  }

  private getIntent(context: AlexaRequestContext): intent {
    let genericIntent = this.getGenericIntent(context);
    if (genericIntent !== null) return genericIntent;

    return (context.body.request as askInterfaces.IntentRequest).intent.name;
  }

  private getEntities(context: AlexaRequestContext) {
    let request = context.body.request as askInterfaces.IntentRequest;
    if (typeof request.intent !== "undefined") {
      if (typeof request.intent.slots !== "undefined") {
        let result = {};
        Object.keys(request.intent.slots).forEach(slotName => {
          if (
            typeof request.intent.slots[slotName].value !== "undefined" &&
            request.intent.slots[slotName].value !== "?" &&
            request.intent.slots[slotName].value !== null &&
            request.intent.slots[slotName].value !== "null"
          )
            result[slotName] = request.intent.slots[slotName].value;
        });
        return result;
      }
    }

    return {};
  }

  private getLanguage(context: AlexaRequestContext): string {
    return context.body.request.locale.split("-")[0]; // returns "en", "de", ...
  }

  public getRequestTimestamp(context: AlexaRequestContext) {
    return context.body.request.timestamp;
  }

  private getUser(context: AlexaRequestContext): string | undefined {
    if (typeof process.env.FORCED_ALEXA_OAUTH_TOKEN !== "undefined") {
      this.logger.warn("Using preconfigured mock oauth tocken.");
      return process.env.FORCED_ALEXA_OAUTH_TOKEN;
    } else {
      return context.body.session.user.accessToken;
    }
  }

  /* Returns GenericIntent if request is a GenericIntent, or null, if not */
  private getGenericIntent(context: AlexaRequestContext): GenericIntent | null {
    switch (context.body.request.type) {
      case askInterfaces.RequestType.LaunchRequest:
        return GenericIntent.Invoke;
      case askInterfaces.RequestType.SessionEndedRequest:
        return GenericIntent.Unanswered;
      default:
        let intentRequest = context.body.request as askInterfaces.IntentRequest;
        return RequestExtractor.makeIntentStringToGenericIntent(intentRequest.intent.name);
    }
  }

  static makeIntentStringToGenericIntent(intent: string): GenericIntent | null {
    return dictionary.hasOwnProperty(intent) ? dictionary[intent] : null;
  }
}
