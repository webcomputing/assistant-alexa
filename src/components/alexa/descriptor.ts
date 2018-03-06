import { ComponentDescriptor } from "inversify-components";
import { RequestExtractor } from "./request-extractor";
import { AlexaHandle } from "./handle";
import { AlexaGenerator } from "./generator";
import { Configuration, COMPONENT_NAME } from "./private-interfaces";

import { RequestExtractor as AssistantJSRequestExtractor, PlatformGenerator } from "assistant-source";

export const defaultConfiguration: Configuration.Defaults = {
  route: "/alexa",
  parameters: {},
  useVerifier: true
};

export let descriptor: ComponentDescriptor<Configuration.Defaults> = {
  name: COMPONENT_NAME,
  defaultConfiguration: defaultConfiguration,
  bindings: {
    root: (bindService, lookupService) => {
      bindService
        .bindExtension<AssistantJSRequestExtractor>(lookupService.lookup("core:unifier").getInterface("requestProcessor"))
        .to(RequestExtractor);

      bindService.bindExtension<PlatformGenerator.Extension>(lookupService.lookup("core:unifier").getInterface("platformGenerator")).to(AlexaGenerator);
    },
    request: (bindService) => {
      bindService.bindGlobalService("current-response-handler").to(AlexaHandle);
    }
  }
};
