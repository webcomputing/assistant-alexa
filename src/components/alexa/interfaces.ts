import { unifierInterfaces, rootInterfaces } from "assistant-source";
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
  unifierInterfaces.MinimalRequestExtraction, 
  unifierInterfaces.OptionalExtractions.TemporalAuthExtraction,
  unifierInterfaces.OptionalExtractions.OAuthExtraction {}
export interface HandlerInterface extends 
  unifierInterfaces.MinimalResponseHandler, 
  unifierInterfaces.OptionalHandlerFeatures.Reprompt,
  unifierInterfaces.OptionalHandlerFeatures.GUI.Card.Simple,
  unifierInterfaces.OptionalHandlerFeatures.GUI.Card.Image,
  unifierInterfaces.OptionalHandlerFeatures.AuthenticationHandler,
  unifierInterfaces.OptionalHandlerFeatures.SSMLHandler {}; 

export interface AlexaRequestContext extends rootInterfaces.RequestContext {
  body: askInterfaces.RequestBody;
}

export { askInterfaces };