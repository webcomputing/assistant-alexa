export interface OptionalConfiguration {
  route?: string;
  parameters?: { [name: string]: string };
};

export interface Configuration extends OptionalConfiguration {
  applicationID: string;
};

export const identifiers = {
  alexaHandle: Symbol(),
  responseBuilder: Symbol()
};

import * as askInterfaces from "./skill-kit-interfaces";
export { askInterfaces };