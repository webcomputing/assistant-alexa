/** Names of injectionable services, leads to fewer typing errors for most important injections */
export const componentInjectionNames = {
  /**
   * Inject an instance of @type {Component<Configuration.Runtime>}
   */
  alexaComponent: "meta:component//alexa",
  /**
   * Inject an instance of @type {AlexaHandler}
   */
  alexaResponseHandler: "alexa:current-response-handler",
};
