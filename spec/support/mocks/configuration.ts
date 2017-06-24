import { Configuration } from "../../../src/components/alexa/interfaces";
import { validRequestContext } from "./request-context";

export const configuration: Configuration = {
  applicationID: validRequestContext.body.session.application.applicationId,
  route: validRequestContext.path
};