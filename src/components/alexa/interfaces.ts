import { MinimalRequestExtraction, OptionalExtractions, OptionalHandlerFeatures, MinimalResponseHandler, RequestContext } from "assistant-source";
import * as askInterfaces from "./skill-kit-interfaces";

export interface OptionalConfiguration {
  /** Route of alexa requests. Defaults to "/alexa". */
  route?: string;

  /** Mapping of slot values. Use your AssistantJS slot type as key and your alexa slot type as value. */
  parameters?: { [name: string]: string };

  /** If set to false, we will not use alexa-verifier to test valid requests. Using false might be useful for alexa simulator. Defaults to true. */
  useVerifier?: boolean;
};

export interface Configuration extends OptionalConfiguration {
  /** Your amazon alexa application id */
  applicationID: string;
};

export interface ExtractionInterface extends 
  MinimalRequestExtraction, 
  OptionalExtractions.TemporalAuthExtraction,
  OptionalExtractions.OAuthExtraction {}
export interface HandlerInterface extends 
  MinimalResponseHandler, 
  OptionalHandlerFeatures.Reprompt,
  OptionalHandlerFeatures.GUI.Card.Simple,
  OptionalHandlerFeatures.GUI.Card.Image,
  OptionalHandlerFeatures.AuthenticationHandler,
  OptionalHandlerFeatures.SSMLHandler {}; 

export interface AlexaRequestContext extends RequestContext {
  body: askInterfaces.RequestBody;
}

export { askInterfaces };