import { MinimalRequestExtraction, OptionalExtractions, OptionalHandlerFeatures, RequestContext } from "assistant-source";
import * as askInterfaces from "./skill-kit-interfaces";

export namespace Configuration {
  /** Configuration defaults -> all of these keys are optional for user */
  export interface Defaults {
    /** Route of alexa requests. Defaults to "/alexa". */
    route?: string;

    /** Mapping of slot values. Use your AssistantJS slot type as key and your alexa slot type as value. */
    entities?: { [name: string]: string };

    /** If set to false, we will not use alexa-verifier to test valid requests. Using false might be useful for alexa simulator. Defaults to true. */
    useVerifier?: boolean;
  }

  /** Required configuration options, no defaults are used here */
  export interface Required {
    /** Your amazon alexa application id */
    applicationID: string;

    /** Your skill's invocation name to begin an interaction with */
    invocationName: string;
  }

  /** Available configuration settings in a runtime application */
  export interface Runtime extends Defaults, Required {}
}

/** Name of current component */
export const COMPONENT_NAME = "alexa";
