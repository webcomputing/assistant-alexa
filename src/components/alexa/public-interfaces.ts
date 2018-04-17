import { MinimalRequestExtraction, OptionalExtractions, OptionalHandlerFeatures, MinimalResponseHandler, RequestContext } from "assistant-source";
import * as askInterfaces from "./skill-kit-interfaces";
import { Configuration } from "./private-interfaces";

/** Configuration of alexa component */
export interface AlexaConfiguration extends Partial<Configuration.Defaults>, Configuration.Required {};

/** Property describing the configuration of the alexa component */
export interface AlexaConfigurationAttribute {
  "alexa": AlexaConfiguration;
}

export interface ExtractionInterface extends 
  MinimalRequestExtraction, 
  OptionalExtractions.TemporalAuth,
  OptionalExtractions.OAuth {}
export interface HandlerInterface extends 
  MinimalResponseHandler, 
  OptionalHandlerFeatures.Reprompt,
  OptionalHandlerFeatures.GUI.Card.Simple,
  OptionalHandlerFeatures.GUI.Card.Image,
  OptionalHandlerFeatures.Authentication,
  OptionalHandlerFeatures.SSML {}; 

export interface AlexaRequestContext extends RequestContext {
  body: askInterfaces.RequestBody;
}

export { askInterfaces };