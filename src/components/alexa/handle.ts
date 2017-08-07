import { inject, injectable } from "inversify";
import { ExecutableExtension } from "inversify-components";
import { unifierInterfaces, rootInterfaces, AbstractResponseHandler } from "assistant-source"
import { askInterfaces, HandlerInterface } from "./interfaces";

@injectable()
export class AlexaHandle extends AbstractResponseHandler implements HandlerInterface {
  forceAuthenticated: boolean = false;
  isSSML: boolean = false;

  cardTitle: string | null = null;
  displayText: string | null = null;
  displayImage: string | null = null;
  
  constructor(
    @inject("core:root:current-request-context") extraction: rootInterfaces.RequestContext,
    @inject("core:unifier:end-session-callbacks-executer") endSessionExecuter: Function
  ) {
    super(extraction, endSessionExecuter)
  }

  getBody(): askInterfaces.ResponseBody {
    let response = this.getBaseBody();

    // Set cards
    if (this.forceAuthenticated) {
      response.response.card = this.createLinkAccountCard();
    } else if(this.cardTitle !== null) {
      response.response.card = this.createCard();
    }

    if (this.voiceMessage !== null) {
      response.response.outputSpeech = this.getSpeechBody();
    }
    
    return response;
  }

  createLinkAccountCard(): askInterfaces.Card {
    return { type: askInterfaces.CardType.LinkAccount };
  }

  createCard(): askInterfaces.Card {
    if (this.cardTitle === null || this.displayText === null)
      throw new Error("cardTitle and displayText must not be null!");

    if (this.displayImage === null) {
      return {
        type: askInterfaces.CardType.Simple,
        title: this.cardTitle,
        content: this.displayText
      }
    } else {
      return {
        type: askInterfaces.CardType.Standard,
        title: this.cardTitle,
        text: this.displayText,
        image: {
          // TODO
          smallImageUrl: this.displayImage,
          largeImageUrl: this.displayImage  
        }
      }
    }
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
    this.voiceMessage = this.voiceMessage === null ? "" : this.voiceMessage;

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