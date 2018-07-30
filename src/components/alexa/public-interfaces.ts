import { BasicAnswerTypes, BasicHandable, MinimalRequestExtraction, OptionalExtractions, RequestContext } from "assistant-source";
import { Configuration } from "./private-interfaces";
import * as askInterfaces from "./skill-kit-interfaces";

/** Configuration of alexa component */
export interface AlexaConfiguration extends Partial<Configuration.Defaults>, Configuration.Required {}

/** Property describing the configuration of the alexa component */
export interface AlexaConfigurationAttribute {
  alexa: AlexaConfiguration;
}

export interface ExtractionInterface
  extends MinimalRequestExtraction,
    OptionalExtractions.SessionData,
    OptionalExtractions.TemporalAuth,
    OptionalExtractions.Timestamp,
    OptionalExtractions.OAuth {}

/**
 * Add custom types here
 */
export interface AlexaSpecificTypes extends BasicAnswerTypes {}

/**
 * Add custom methods for here
 */
export interface AlexaSpecificHandable<CustomTypes extends AlexaSpecificTypes> extends BasicHandable<CustomTypes> {}

export interface AlexaRequestContext extends RequestContext {
  body: askInterfaces.RequestBody;
}

export { askInterfaces };
