import {
  HandlerProxyFactory,
  injectionNames,
  intent as Intent,
  PlatformSpecHelper,
  RequestContext,
  SpecHelper,
  UnsupportedFeatureSupportForHandables,
} from "assistant-source";
import { AlexaHandler } from "./components/alexa/handler";
import { alexaInjectionNames } from "./components/alexa/injection-names";
import { AlexaSpecificHandable, AlexaSpecificTypes, ExtractionInterface } from "./components/alexa/public-interfaces";

export class AlexaSpecHelper implements PlatformSpecHelper<AlexaSpecificTypes, AlexaSpecificHandable<AlexaSpecificTypes>> {
  constructor(public specHelper: SpecHelper) {}

  public async pretendIntentCalled(intent: Intent, additionalExtractions = {}, additionalContext = {}): Promise<AlexaSpecificHandable<AlexaSpecificTypes>> {
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

    this.specHelper.createRequestScope(extraction, context);

    // Bind handler as singleton
    this.specHelper.assistantJs.container.inversifyInstance.unbind(alexaInjectionNames.current.responseHandler);
    this.specHelper.assistantJs.container.inversifyInstance
      .bind(alexaInjectionNames.current.responseHandler)
      .to(AlexaHandler)
      .inSingletonScope();

    const proxyFactory = this.specHelper.assistantJs.container.inversifyInstance.get<HandlerProxyFactory>(injectionNames.handlerProxyFactory);

    const currentHandler = this.specHelper.assistantJs.container.inversifyInstance.get<
      AlexaSpecificHandable<AlexaSpecificTypes> & UnsupportedFeatureSupportForHandables
    >(alexaInjectionNames.current.responseHandler);

    const proxiedHandler = proxyFactory.createHandlerProxy(currentHandler);

    return proxiedHandler;
  }
}
