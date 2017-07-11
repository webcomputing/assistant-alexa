import { inject, injectable } from "inversify";
import { ExecutableExtension } from "inversify-components";
import { unifierInterfaces, rootInterfaces, AbstractResponseHandler } from "assistant-source"
import { askInterfaces, HandlerInterface } from "./interfaces";

@injectable()
export class AlexaHandle extends AbstractResponseHandler implements HandlerInterface {
  card: askInterfaces.Card | null = null;

  forceAuthenticated: boolean = false;
  isSSML: boolean = false;
  
  constructor(
    @inject("core:root:current-request-context") extraction: rootInterfaces.RequestContext,
    @inject("core:unifier:end-session-callbacks-executer") endSessionExecuter: Function
  ) {
    super(extraction, endSessionExecuter)
  }

  getBody(): askInterfaces.ResponseBody {
    let response = this.getBaseBody();

    if (this.forceAuthenticated) {
      this.addLinkAccountCard();
    }

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
}