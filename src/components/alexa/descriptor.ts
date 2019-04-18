import { CLIDeploymentExtension, PlatformGenerator, RequestExtractor as AssistantJSRequestExtractor } from "assistant-source";
import { ComponentDescriptor } from "inversify-components";
import { AlexaDeployment } from "./deployment";
import { AlexaGenerator } from "./generator";
import { AlexaHandler } from "./handler";
import { COMPONENT_NAME, Configuration } from "./private-interfaces";
import { RequestExtractor } from "./request-extractor";

export const defaultConfiguration: Configuration.Defaults = {
  route: "/alexa",
  entities: {},
  useVerifier: true,
};

export let descriptor: ComponentDescriptor<Configuration.Defaults> = {
  defaultConfiguration,
  name: COMPONENT_NAME,
  bindings: {
    root: (bindService, lookupService) => {
      bindService.bindExtension<AssistantJSRequestExtractor>(lookupService.lookup("core:unifier").getInterface("requestProcessor")).to(RequestExtractor);

      bindService.bindExtension<PlatformGenerator.Extension>(lookupService.lookup("core:unifier").getInterface("platformGenerator")).to(AlexaGenerator);

      bindService.bindExtension<CLIDeploymentExtension>(lookupService.lookup("core:root").getInterface("deployments")).to(AlexaDeployment);
    },
    request: bindService => {
      bindService.bindGlobalService("current-response-handler").to(AlexaHandler);
    },
  },
};
