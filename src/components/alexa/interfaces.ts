import { unifierInterfaces } from "assistant-source";

export interface OptionalConfiguration {
  route?: string;
  parameters?: { [name: string]: string };
};

export interface Configuration extends OptionalConfiguration {
  applicationID: string;
};

export interface ExtractionInterface extends 
  unifierInterfaces.MinimalRequestExtraction, 
  unifierInterfaces.OptionalExtractions.OAuthExtraction {}
export interface HandlerInterface extends 
  unifierInterfaces.MinimalResponseHandler, 
  unifierInterfaces.OptionalHandlerFeatures.AuthenticationHandler,
  unifierInterfaces.OptionalHandlerFeatures.SSMLHandler {}; 

import * as askInterfaces from "./skill-kit-interfaces";
export { askInterfaces };