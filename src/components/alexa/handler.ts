import * as askInterfaces from "ask-sdk-model";
import {
  applyMixin,
  AuthenticationMixin,
  BasicHandler,
  CardMixin,
  injectionNames,
  MinimalRequestExtraction,
  OptionalHandlerFeatures,
  OptionallyPromise,
  RepromptsMixin,
  RequestContext,
  ResponseHandlerExtensions,
  SessionDataMixin,
} from "assistant-source";
import { inject, injectable } from "inversify";
import { AlexaSpecificHandable, AlexaSpecificTypes, AlexaSubtypes } from "./public-interfaces";

@injectable()
export class AlexaHandler<MergedAnswerTypes extends AlexaSpecificTypes> extends BasicHandler<MergedAnswerTypes>
  implements
    AlexaSpecificHandable<MergedAnswerTypes>,
    OptionalHandlerFeatures.Authentication,
    OptionalHandlerFeatures.Card<MergedAnswerTypes>,
    OptionalHandlerFeatures.Reprompts<MergedAnswerTypes>,
    OptionalHandlerFeatures.SessionData<MergedAnswerTypes> {
  /**
   * define missing methods from Mixins here
   */
  public setCard!: (card: MergedAnswerTypes["card"] | Promise<MergedAnswerTypes["card"]>) => this;
  // @ts-ignore
  public prompt!: (
    inputText: MergedAnswerTypes["voiceMessage"]["text"] | Promise<MergedAnswerTypes["voiceMessage"]["text"]>,
    ...reprompts: Array<MergedAnswerTypes["voiceMessage"]["text"] | Promise<MergedAnswerTypes["voiceMessage"]["text"]>>
  ) => this;
  public setReprompts!: (
    reprompts:
      | Array<MergedAnswerTypes["voiceMessage"]["text"] | Promise<MergedAnswerTypes["voiceMessage"]["text"]>>
      | Promise<Array<MergedAnswerTypes["voiceMessage"]["text"]>>
  ) => this;
  public setSessionData!: (sessionData: MergedAnswerTypes["sessionData"] | Promise<MergedAnswerTypes["sessionData"]>) => this;
  public getSessionData!: () => Promise<MergedAnswerTypes["sessionData"]> | undefined;
  public setUnauthenticated!: () => this;

  constructor(
    @inject(injectionNames.current.requestContext) requestContext: RequestContext,
    @inject(injectionNames.current.extraction) extraction: MinimalRequestExtraction,
    @inject(injectionNames.current.killSessionService) killSession: () => Promise<void>,
    @inject(injectionNames.current.responseHandlerExtensions)
    responseHandlerExtensions: ResponseHandlerExtensions<MergedAnswerTypes, AlexaSpecificHandable<MergedAnswerTypes>>
  ) {
    super(requestContext, extraction, killSession, responseHandlerExtensions);
  }

  public setAlexaCustomDirectives(customDirectives: OptionallyPromise<MergedAnswerTypes["customDirectives"]>): this {
    this.promises.customDirectives = { resolver: customDirectives };
    return this;
  }

  public setAlexaHint(hint: OptionallyPromise<string>): this {
    this.promises.alexaHint = {
      resolver: hint,
      thenMap: (value: string) => {
        return {
          type: "PlainText",
          text: value,
        };
      },
    };

    return this;
  }

  public setAlexaListTemplate1(template: OptionallyPromise<AlexaSubtypes.ListTemplate1>): this {
    this.promises.alexaTemplate = {
      resolver: template,
      thenMap: this.mapTemplate<"ListTemplate1", askInterfaces.interfaces.display.ListTemplate1>("ListTemplate1"),
    };
    return this;
  }

  public setAlexaListTemplate2(template: OptionallyPromise<AlexaSubtypes.ListTemplate2>): this {
    this.promises.alexaTemplate = {
      resolver: template,
      thenMap: this.mapTemplate<"ListTemplate2", askInterfaces.interfaces.display.ListTemplate2>("ListTemplate2"),
    };
    return this;
  }

  public setAlexaBodyTemplate1(template: OptionallyPromise<AlexaSubtypes.BodyTemplate1>): this {
    this.promises.alexaTemplate = {
      resolver: template,
      thenMap: this.mapTemplate<"BodyTemplate1", askInterfaces.interfaces.display.BodyTemplate1>("BodyTemplate1"),
    };
    return this;
  }

  public setAlexaBodyTemplate2(template: OptionallyPromise<AlexaSubtypes.BodyTemplate2>): this {
    this.promises.alexaTemplate = {
      resolver: template,
      thenMap: this.mapTemplate<"BodyTemplate2", askInterfaces.interfaces.display.BodyTemplate2>("BodyTemplate2"),
    };
    return this;
  }

  public setAlexaBodyTemplate3(template: OptionallyPromise<AlexaSubtypes.BodyTemplate3>): this {
    this.promises.alexaTemplate = {
      resolver: template,
      thenMap: this.mapTemplate<"BodyTemplate3", askInterfaces.interfaces.display.BodyTemplate3>("BodyTemplate3"),
    };
    return this;
  }

  public setAlexaBodyTemplate6(template: OptionallyPromise<AlexaSubtypes.BodyTemplate6>): this {
    this.promises.alexaTemplate = {
      resolver: template,
      thenMap: this.mapTemplate<"BodyTemplate6", askInterfaces.interfaces.display.BodyTemplate6>("BodyTemplate6"),
    };
    return this;
  }

  public setAlexaBodyTemplate7(template: OptionallyPromise<AlexaSubtypes.BodyTemplate7>): this {
    this.promises.alexaTemplate = {
      resolver: template,
      thenMap: this.mapTemplate<"BodyTemplate7", askInterfaces.interfaces.display.BodyTemplate7>("BodyTemplate7"),
    };
    return this;
  }

  /**
   * Returns the Response
   * @param results
   */
  public getBody(results: Partial<MergedAnswerTypes>): askInterfaces.ResponseEnvelope {
    // Add base body
    let response = this.getBaseBody(results);

    [this.fillListTemplate, this.fillHint, this.fillCustomDirectives].forEach(
      (fn: (results: Partial<MergedAnswerTypes>, payload: askInterfaces.ResponseEnvelope) => askInterfaces.ResponseEnvelope) => {
        response = fn.bind(this)(results, response);
      }
    );

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

  private createLinkAccountCard(): askInterfaces.ui.Card {
    return { type: "LinkAccount" };
  }

  private createCard(results: Partial<MergedAnswerTypes>): askInterfaces.ui.Card {
    if (!results.card || !results.card.title || !results.card.description) {
      throw new Error("Title and discription must be filled for a card!");
    }

    if (!results.card.cardImage) {
      return {
        type: "Simple",
        title: results.card.title,
        content: results.card.description,
      };
    }

    return {
      type: "Standard",
      title: results.card.title,
      text: results.card.description,
      image: {
        smallImageUrl: results.card.smallCardImage ? results.card.smallCardImage : results.card.cardImage,
        largeImageUrl: results.card.cardImage,
      },
    };
  }

  private getBaseBody(results: Partial<MergedAnswerTypes>): askInterfaces.ResponseEnvelope {
    const base = {
      version: "1.0",
      response: {
        shouldEndSession: !!results.shouldSessionEnd, // convert undefined to boolean
      },
    };
    // Merge sessionAttributes in base body when sessionData is not null
    return results.sessionData ? { sessionAttributes: { sessionKey: results.sessionData }, ...base } : base;
  }

  private getSpeechBody(voiceMessage: MergedAnswerTypes["voiceMessage"]): askInterfaces.ui.OutputSpeech {
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

  private fillListTemplate(results: Partial<MergedAnswerTypes>, payload: askInterfaces.ResponseEnvelope): askInterfaces.ResponseEnvelope {
    if (results.alexaTemplate) {
      payload.response.directives = [
        {
          type: "Display.RenderTemplate",
          template: results.alexaTemplate,
        },
      ];
    }

    return payload;
  }

  private fillHint(results: Partial<MergedAnswerTypes>, payload: askInterfaces.ResponseEnvelope): askInterfaces.ResponseEnvelope {
    if (results.alexaHint) {
      if (!payload.response.directives) {
        payload.response.directives = [];
      }

      payload.response.directives.push({
        type: "Hint",
        hint: results.alexaHint,
      });
    }

    return payload;
  }

  private fillCustomDirectives(results: Partial<MergedAnswerTypes>, payload: askInterfaces.ResponseEnvelope): askInterfaces.ResponseEnvelope {
    if (results.customDirectives) {
      payload.response.directives = results.customDirectives;
    }

    return payload;
  }

  /**
   * Maps TemplateSubType to full Template Directive
   * @param type
   */
  private mapTemplate<K, T extends { type: K }>(type: K): ((value: any) => T) {
    return (value: T) => {
      return { ...(value as any), type };
    };
  }
}

/**
 * Apply Mixins
 */
applyMixin(AlexaHandler, [AuthenticationMixin, CardMixin, RepromptsMixin, SessionDataMixin]);
