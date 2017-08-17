import { unifierInterfaces, rootInterfaces } from "assistant-source";
import * as askInterfaces from "./skill-kit-interfaces";

export interface OptionalConfiguration {
  route?: string;
  parameters?: { [name: string]: string };

  /** If set to false, we will not use alexa-verifier to test valid requests. */
  useVerifier?: boolean;
};

export interface Configuration extends OptionalConfiguration {
  applicationID: string;
};

export interface ExtractionInterface extends 
  unifierInterfaces.MinimalRequestExtraction, 
  unifierInterfaces.OptionalExtractions.TemporalAuthExtraction,
  unifierInterfaces.OptionalExtractions.OAuthExtraction {}
export interface HandlerInterface extends 
  unifierInterfaces.MinimalResponseHandler, 
  unifierInterfaces.OptionalHandlerFeatures.Display.SimpleCardDisplay,
  unifierInterfaces.OptionalHandlerFeatures.Display.ImageCardDisplay,
  unifierInterfaces.OptionalHandlerFeatures.AuthenticationHandler,
  unifierInterfaces.OptionalHandlerFeatures.SSMLHandler {}; 

export interface AlexaRequestContext extends rootInterfaces.RequestContext {
  body: askInterfaces.RequestBody;
}

export { askInterfaces };