import { unifierInterfaces, rootInterfaces } from "assistant-source";
import * as verifyAlexa from "alexa-verifier";

import { log } from "../../global";
import { injectable, inject } from "inversify";
import { Component } from "inversify-components";
import { Configuration, askInterfaces, ExtractionInterface } from "./interfaces";
import { amazonToGenericIntent as dictionary } from "./intent-dict";

@injectable()
export class RequestExtractor implements unifierInterfaces.RequestConversationExtractor {
  public component: Component;
  private configuration: Configuration;
  verifyAlexaProxy: any;

  constructor(@inject("meta:component//alexa") componentMeta: Component) {
    this.component = componentMeta;
    this.configuration = componentMeta.configuration as Configuration;
    this.verifyAlexaProxy = this.resolveVerifier();
  }

  fits(context: rootInterfaces.RequestContext): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      if (this.fitsInternal(context)) {
        this.verifyAlexaProxy(context.headers["signaturecertchainurl"], context.headers["signature"], JSON.stringify(context.body), function(error) {
          if (error) {
            log("Incoming request matched for configured route and applicationID, but could not be verified correctly with alexa-verifier module. Given error = ", error);
            resolve(false);
          } else {
            log("Incoming request matched for alexa extractor");
            resolve(true);
          }
        });
      } else {
        log("Incomming request did not match configured route and applicationID");
        resolve(false);
      }
    });
  }

  extract(context: rootInterfaces.RequestContext): Promise<ExtractionInterface>{
    return new Promise((resolve, reject) => {
      let resolvedContext = {
        sessionID: this.getSessionID(context),
        intent: this.getIntent(context),
        entities: this.getEntities(context),
        language: this.getLanguage(context),
        component: this.component,
        oAuthToken: this.getUser(context)
      };

      log("Resolved context: %o", resolvedContext);
      resolve(resolvedContext);
    });
  }

  resolveVerifier() {
    if (this.configuration.useVerifier === false) {
      log("Using proxy verifier instead of alexa-verify. Hope you know what you are doing.");
      return (chainurl, signature, body, callback: (error) => any) => { callback(false) };
    } else {
      return verifyAlexa
    };
  }

  private fitsInternal(context: rootInterfaces.RequestContext) {
    return context.path === this.configuration.route && context.body.session.application.applicationId === this.configuration.applicationID
  }

  private getSessionID(context: rootInterfaces.RequestContext) {
    return "alexa-" + context.body.session.sessionId;
  }

  private getIntent(context: rootInterfaces.RequestContext): unifierInterfaces.intent {
    let genericIntent = this.getGenericIntent(context);
    if (genericIntent !== null) return genericIntent;

    return (context.body.request as askInterfaces.IntentRequest).intent.name;
  }

  private getEntities(context: rootInterfaces.RequestContext) {
    let request = context.body.request as askInterfaces.IntentRequest;
    if (typeof(request.intent) !== "undefined") {
      if (typeof(request.intent.slots) !== "undefined") {
        let result = {};
        Object.keys(request.intent.slots).forEach(slotName => {
          if (typeof(request.intent.slots[slotName].value) !== "undefined" && request.intent.slots[slotName].value !== "?" && request.intent.slots[slotName].value !== null && request.intent.slots[slotName].value !== "null")
            result[slotName] = request.intent.slots[slotName].value;
        });
        return result;
      }
    }

    return {};
  }

  private getLanguage(context: rootInterfaces.RequestContext): string {
    return context.body.request.locale.split("-")[0]; // returns "en", "de", ...
  }

  private getUser(context: rootInterfaces.RequestContext) {
    return context.body.session.user.accessToken
  }

  /* Returns GenericIntent if request is a GenericIntent, or null, if not */
  private getGenericIntent(context: rootInterfaces.RequestContext): unifierInterfaces.GenericIntent | null {
    switch (context.body.request.type) {
      case askInterfaces.RequestType.LaunchRequest:
        return unifierInterfaces.GenericIntent.Invoke;
      case askInterfaces.RequestType.SessionEndedRequest:
        return unifierInterfaces.GenericIntent.EndSession;
      default:
        let intentRequest = context.body.request as askInterfaces.IntentRequest;
        return RequestExtractor.makeIntentStringToGenericIntent(intentRequest.intent.name);
    }
  }

  static makeIntentStringToGenericIntent(intent: string): unifierInterfaces.GenericIntent | null {
    return dictionary.hasOwnProperty(intent) ? dictionary[intent] : null;
  }
}
