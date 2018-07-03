import { AbstractResponseHandler, injectionNames, RequestContext, ResponseHandlerExtensions } from "assistant-source";
import { inject, injectable } from "inversify";
import { askInterfaces, HandlerInterface } from "./public-interfaces";

@injectable()
export class AlexaHandle extends AbstractResponseHandler implements HandlerInterface {
  forceAuthenticated: boolean = false;
  isSSML: boolean = false;

  reprompts: string[] | null = null;

  cardTitle: string | null = null;
  cardBody: string | null = null;
  cardImage: string | null = null;

  sessionData: string | null = null;

  constructor(
    @inject(injectionNames.current.requestContext) extraction: RequestContext,
    @inject(injectionNames.current.killSessionService) killSession: () => Promise<void>,
    @inject(injectionNames.current.responseHandlerExtensions) responseHandlerExtensions: ResponseHandlerExtensions
  ) {
    super(extraction, killSession, responseHandlerExtensions);
  }

  getBody(): askInterfaces.ResponseBody {
    // Add base body
    let response = this.getBaseBody();

    // Set cards
    if (this.forceAuthenticated) {
      response.response.card = this.createLinkAccountCard();
    } else if (this.cardTitle !== null) {
      response.response.card = this.createCard();
    }

    // Add main speech
    if (this.voiceMessage !== null) {
      response.response.outputSpeech = this.getSpeechBody();
    }

    // Add reprompt
    if (this.reprompts !== null && this.reprompts.length > 0) {
      response.response.reprompt = { outputSpeech: this.getSpeechBody(this.reprompts[0]) };
    }

    return response;
  }

  createLinkAccountCard(): askInterfaces.Card {
    return { type: askInterfaces.CardType.LinkAccount };
  }

  createCard(): askInterfaces.Card {
    if (this.cardTitle === null || this.cardBody === null) throw new Error("cardTitle and cardBody must not be null!");

    if (this.cardImage === null) {
      return {
        type: askInterfaces.CardType.Simple,
        title: this.cardTitle,
        content: this.cardBody,
      };
    } else {
      return {
        type: askInterfaces.CardType.Standard,
        title: this.cardTitle,
        text: this.cardBody,
        image: {
          // TODO
          smallImageUrl: this.cardImage,
          largeImageUrl: this.cardImage,
        },
      };
    }
  }

  private getBaseBody(): askInterfaces.ResponseBody {
    const base = {
      version: "1.0",
      response: {
        shouldEndSession: this.endSession,
      },
    };
    // Merge sessionAttributes in base body when sessionData is not null
    return (this.sessionData ? {sessionAttributes: JSON.parse(this.sessionData), ...base} : base);
  }

  private getSpeechBody(voiceMessage = this.voiceMessage): askInterfaces.OutputSpeech {
    if (voiceMessage === null) voiceMessage = "";

    if (this.isSSML) {
      return {
        type: "SSML",
        ssml: voiceMessage,
      };
    } else {
      return {
        type: "PlainText",
        text: voiceMessage,
      };
    }
  }
}
