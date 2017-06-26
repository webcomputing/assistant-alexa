import { inject, injectable } from "inversify";
import { ExecutableExtension } from "ioc-container";
import { unifierInterfaces, rootInterfaces } from "assistant-source"
import { askInterfaces, HandlerInterface } from "./interfaces";

@injectable()
export class AlexaHandle implements HandlerInterface {
  endSession: boolean;
  voiceMessage: string;

  responseCallback: rootInterfaces.ResponseCallback;
  endSessionExecuter: Function;

  card: askInterfaces.Card | null = null;

  forceAuthenticated: boolean = false;
  isSSML: boolean = false;

  private _isActive: boolean = true;
  
  constructor(
    @inject("core:root:current-request-context") extraction: rootInterfaces.RequestContext,
    @inject("core:unifier:end-session-callbacks-executer") endSessionExecuter: Function
  ) {
    this.responseCallback = extraction.responseCallback;
    this.endSessionExecuter = endSessionExecuter;
  }

  get isActive() {
    return this._isActive;
  }

  sendResponse() {
    this.failIfInactive();

    this.responseCallback(JSON.stringify(this.getBody()), this.getHeaders());
    if (this.endSession) {
      this.endSessionExecuter();
    }

    this._isActive = false;
  }

  getHeaders() {
    return { "Content-Type": "application/json" };
  }

  getBody(): askInterfaces.ResponseBody {
    let response = this.getBaseBody();

    if (this.voiceMessage !== "") {
      response.response.outputSpeech = this.getSpeechBody();
    }

    if (this.card !== null) {
      response.response.card = this.card;
    }

    return response;
  }

  addLinkAccountCard() {
    this.card = { type: askInterfaces.CardType.LinkAccount };
  }

  private getBaseBody(): askInterfaces.ResponseBody {
    return {
      version: "1.0",
      response: {
        shouldEndSession: this.endSession
      }
    };
  }

  private getSpeechBody(): askInterfaces.OutputSpeech {
    if (this.isSSML) {
      return {
        type: "SSML",
        ssml: this.voiceMessage
      };
    } else {
      return {
        type: "PlainText",
        text: this.voiceMessage
      }
    };
  }

  private failIfInactive() {
    if (!this.isActive) {
      throw Error("This handle is already inactive, an response was already sent. You cannot send text to alexa multiple times in one request.");
    }
  }
}