import { PlatformGenerator, RequestExtractor as AssistantJSRequestExtractor } from "assistant-source";
import { ComponentDescriptor } from "inversify-components";
import { AlexaGenerator } from "./generator";
import { AlexaHandle } from "./handle";
import { COMPONENT_NAME, Configuration } from "./private-interfaces";
import { RequestExtractor } from "./request-extractor";

export const defaultConfiguration: Configuration.Defaults = {
  route: "/alexa",
  entities: {},
  useVerifier: true,
};

export let descriptor: ComponentDescriptor<Configuration.Defaults> = {
  name: COMPONENT_NAME,
  defaultConfiguration: defaultConfiguration,
  bindings: {
    root: (bindService, lookupService) => {
      bindService.bindExtension<AssistantJSRequestExtractor>(lookupService.lookup("core:unifier").getInterface("requestProcessor")).to(RequestExtractor);

      bindService.bindExtension<PlatformGenerator.Extension>(lookupService.lookup("core:unifier").getInterface("platformGenerator")).to(AlexaGenerator);
    },
    request: bindService => {
      bindService.bindGlobalService("current-response-handler").to(AlexaHandle);
    },
  },
};
