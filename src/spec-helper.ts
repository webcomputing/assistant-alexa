import { Component } from "inversify-components";
import { AlexaHandle } from "./components/alexa/handle";
import { ExtractionInterface, HandlerInterface } from "./components/alexa/public-interfaces";
import { SpecSetup, PlatformSpecHelper, RequestContext, intent, } from "assistant-source";


export class SpecHelper implements PlatformSpecHelper {
  specSetup: SpecSetup

  constructor(assistantSpecSetup: SpecSetup) {
    this.specSetup = assistantSpecSetup;
  }

  async pretendIntentCalled(intent: intent, autoStart = true, additionalExtractions = {}, additionalContext = {}): Promise<HandlerInterface> {
    let extraction: ExtractionInterface = Object.assign({
      platform: "alexa",
      intent: intent,
      sessionID: "alexa-mock-session-id",
      language: "en",
      oAuthToken: "alexa-mock-oauth-token",
      temporalAuthToken: "alexa-mock-temp-auth-token",
      requestTimestamp: "2017-06-24T16:00:18Z"
    }, additionalExtractions);

    let context: RequestContext = Object.assign({
      id: "mocked-alexa-request-id",
      method: 'POST',
      path: '/alexa',
      body: {},
      headers: {},
      responseCallback: () => {}
    }, additionalContext);

    this.specSetup.createRequestScope(extraction, context);

    // Bind handler as singleton
    this.specSetup.setup.container.inversifyInstance.unbind("alexa:current-response-handler");
    this.specSetup.setup.container.inversifyInstance.bind("alexa:current-response-handler").to(AlexaHandle).inSingletonScope();
    
    // auto run machine if wanted
    if (autoStart) {
      await this.specSetup.runMachine();
    }
    
    return this.specSetup.setup.container.inversifyInstance.get<AlexaHandle>("alexa:current-response-handler");  
  }
}