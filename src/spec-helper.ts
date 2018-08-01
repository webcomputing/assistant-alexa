import { intent as Intent, PlatformSpecHelper, RequestContext, SpecHelper } from "assistant-source";
import { AlexaHandler } from "./components/alexa/handler";
import { AlexaSpecificHandable, AlexaSpecificTypes, ExtractionInterface } from "./components/alexa/public-interfaces";

export class AlexaSpecHelper implements PlatformSpecHelper<AlexaSpecificTypes, AlexaSpecificHandable<AlexaSpecificTypes>> {
  public specSetup: SpecHelper;

  constructor(assistantSpecSetup: SpecHelper) {
    this.specSetup = assistantSpecSetup;
  }

  public async pretendIntentCalled(intent: Intent, autoStart = true, additionalExtractions = {}, additionalContext = {}) {
    const extraction: ExtractionInterface = {
      intent,
      platform: "alexa",
      sessionID: "alexa-mock-session-id",
      language: "en",
      oAuthToken: "alexa-mock-oauth-token",
      temporalAuthToken: "alexa-mock-temp-auth-token",
      requestTimestamp: "2017-06-24T16:00:18Z",
      sessionData: '{"alexa-mock-first-session-attribute": "first-session-attribute","alexa-mock-second-session-attribute": "second-session-attribute"}',
      ...additionalExtractions,
    };

    const context: RequestContext = {
      id: "mocked-alexa-request-id",
      method: "POST",
      path: "/alexa",
      body: {},
      headers: {},
      // tslint:disable-next-line:no-empty
      responseCallback: () => {},
      ...additionalContext,
    };

    this.specSetup.createRequestScope(extraction, context);

    // Bind handler as singleton
    this.specSetup.setup.container.inversifyInstance.unbind("alexa:current-response-handler");
    this.specSetup.setup.container.inversifyInstance
      .bind("alexa:current-response-handler")
      .to(AlexaHandler)
      .inSingletonScope();

    // auto run machine if wanted
    if (autoStart) {
      await this.specSetup.runMachine();
    }

    return this.specSetup.setup.container.inversifyInstance.get<AlexaSpecificHandable<AlexaSpecificTypes>>("alexa:current-response-handler");
  }
}
