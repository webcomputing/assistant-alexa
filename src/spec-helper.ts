import { HandlerProxyFactory, injectionNames, intent as Intent, PlatformSpecHelper, RequestContext, SpecHelper, VirtualDevices } from "assistant-source";
import { AlexaHandler } from "./components/alexa/handler";
import { AlexaDevice, AlexaSpecificHandable, AlexaSpecificTypes, ExtractionInterface } from "./components/alexa/public-interfaces";

export class AlexaSpecHelper implements PlatformSpecHelper<AlexaSpecificTypes, AlexaSpecificHandable<AlexaSpecificTypes>> {
  public devices: VirtualDevices;

  constructor(public specSetup: SpecHelper) {
    this.devices = this.setupDevices();
  }

  public setupDevices(): VirtualDevices {
    return {
      echoShow: {
        additionalRequestContext: {
          body: {
            context: {
              Viewport: {
                experiences: [],
                shape: "RECTANGLE",
                pixelWidth: 1024,
                pixelHeight: 600,
                dpi: 160,
                currentPixelWidth: 1024,
                currentPixelHeight: 600,
                touch: ["SINGLE"],
                keyboard: [],
              },
            },
          },
        },
        additionalExtractions: { device: "echoShow" },
      },
      echoSpot: {
        additionalRequestContext: {
          body: {
            context: {
              Viewport: {
                experiences: [],
                shape: "ROUND",
                pixelWidth: 480,
                pixelHeight: 480,
                dpi: 160,
                currentPixelWidth: 480,
                currentPixelHeight: 480,
                touch: ["SINGLE"],
                keyboard: [],
              },
            },
          },
        },
        additionalExtractions: { device: "echoSpot" },
      },
      echo: {
        additionalRequestContext: {},
        additionalExtractions: { device: "echo" },
      },
    };
  }

  public async pretendIntentCalled(intent: Intent, device: AlexaDevice): Promise<AlexaSpecificHandable<AlexaSpecificTypes>> {
    const additionalExtractions = device ? this.devices[device].additionalExtractions : {};
    const additionalRequestContext = device ? this.devices[device].additionalRequestContext : {};

    const extraction: ExtractionInterface = {
      intent,
      platform: "alexa",
      sessionID: "alexa-mock-session-id",
      language: "en",
      device: "alexaSpeaker",
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
      ...additionalRequestContext,
    };

    this.specSetup.createRequestScope(extraction, context);

    // Bind handler as singleton
    this.specSetup.assistantJs.container.inversifyInstance.unbind("alexa:current-response-handler");
    this.specSetup.assistantJs.container.inversifyInstance
      .bind("alexa:current-response-handler")
      .to(AlexaHandler)
      .inSingletonScope();

    const proxyFactory = this.specSetup.assistantJs.container.inversifyInstance.get<HandlerProxyFactory>(injectionNames.handlerProxyFactory);

    const currentHandler = this.specSetup.assistantJs.container.inversifyInstance.get<AlexaSpecificHandable<AlexaSpecificTypes>>(
      "alexa:current-response-handler"
    );
    const proxiedHandler = proxyFactory.createHandlerProxy(currentHandler);

    return proxiedHandler;
  }
}
