import { AlexaConfiguration } from "../../../src/components/alexa/public-interfaces";
import { validRequestContext } from "./requests/intent-request";

export const configuration: AlexaConfiguration = {
  applicationID: validRequestContext.body.session.application.applicationId,
  route: validRequestContext.path,
  useVerifier: false,
  invocationName: "invocationname",
};
