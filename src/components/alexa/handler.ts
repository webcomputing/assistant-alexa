import {
  AuthenticationMixin,
  BasicHandler,
  CardMixin,
  injectionNames,
  MinimalRequestExtraction,
  RepromptsMixin,
  RequestContext,
  ResponseHandlerExtensions,
  SessionDataMixin,
} from "assistant-source";
import { inject, injectable } from "inversify";
import { AlexaSpecificHandable, AlexaSpecificTypes, askInterfaces } from "./public-interfaces";

@injectable()
export class AlexaHandler<CustomTypes extends AlexaSpecificTypes>
  extends AuthenticationMixin(CardMixin(RepromptsMixin(SessionDataMixin(BasicHandler))))<CustomTypes>
  implements AlexaSpecificHandable<CustomTypes> {
  constructor(
    @inject(injectionNames.current.requestContext) requestContext: RequestContext,
    @inject(injectionNames.current.extraction) extraction: MinimalRequestExtraction,
    @inject(injectionNames.current.killSessionService) killSession: () => Promise<void>,
    @inject(injectionNames.current.responseHandlerExtensions)
    responseHandlerExtensions: ResponseHandlerExtensions<CustomTypes, AlexaSpecificHandable<CustomTypes>>
  ) {
    super(requestContext, extraction, killSession, responseHandlerExtensions);
  }

  public getBody(results: Partial<CustomTypes>): askInterfaces.ResponseBody {
    // Add base body
    const response = this.getBaseBody(results);

    // Set cards
    if (results.shouldAuthenticate) {
      response.response.card = this.createLinkAccountCard();
    } else if (results.card && results.card.title) {
      response.response.card = this.createCard(results);
    }

    // Add main speech
    if (results.voiceMessage) {
      response.response.outputSpeech = this.getSpeechBody(results.voiceMessage);
    }

    // Add reprompt
    if (results.reprompts && results.reprompts.length > 0) {
      response.response.reprompt = { outputSpeech: this.getSpeechBody(results.reprompts[0]) };
    }

    return response;
  }

  public createLinkAccountCard(): askInterfaces.Card {
    return { type: askInterfaces.CardType.LinkAccount };
  }

  public createCard(results: Partial<CustomTypes>): askInterfaces.Card {
    if (!results.card || !results.card.title || !results.card.description) {
      throw new Error("Title and discription must be filled for a card!");
    }

    if (!results.card.cardImage) {
      return {
        type: askInterfaces.CardType.Simple,
        title: results.card.title,
        content: results.card.description,
      };
    }

    return {
      type: askInterfaces.CardType.Standard,
      title: results.card.title,
      text: results.card.description,
      image: {
        // TODO
        smallImageUrl: results.card.cardImage,
        largeImageUrl: results.card.cardImage,
      },
    };
  }

  private getBaseBody(results: Partial<CustomTypes>): askInterfaces.ResponseBody {
    const base = {
      version: "1.0",
      response: {
        shouldEndSession: !!results.shouldSessionEnd, // convert undefined to boolean
      },
    };
    // Merge sessionAttributes in base body when sessionData is not null
    return results.sessionData ? { sessionAttributes: { sessionKey: results.sessionData }, ...base } : base;
  }

  private getSpeechBody(voiceMessage: CustomTypes["voiceMessage"]): askInterfaces.OutputSpeech {
    if (voiceMessage.isSSML) {
      return {
        type: "SSML",
        ssml: voiceMessage.text,
      };
    }

    return {
      type: "PlainText",
      text: voiceMessage.text,
    };
  }
}
