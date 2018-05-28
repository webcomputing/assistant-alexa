import {
  MinimalRequestExtraction,
  MinimalResponseHandler,
  OptionalExtractions,
  OptionalHandlerFeatures,
  RequestContext
  } from "assistant-source";
import { Configuration } from "./private-interfaces";
import * as askInterfaces from "./skill-kit-interfaces";

/** Configuration of alexa component */
export interface AlexaConfiguration extends Partial<Configuration.Defaults>, Configuration.Required {};

/** Property describing the configuration of the alexa component */
export interface AlexaConfigurationAttribute {
  "alexa": AlexaConfiguration;
}

export interface ExtractionInterface extends 
  MinimalRequestExtraction, 
  OptionalExtractions.TemporalAuth,
  OptionalExtractions.Timestamp,
  OptionalExtractions.OAuth { }
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