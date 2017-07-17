import { ComponentDescriptor } from "inversify-components";
import { RequestExtractor } from "./request-extractor";
import { AlexaHandle } from "./handle";
import { AlexaGenerator } from "./generator";
import { OptionalConfiguration } from "./interfaces";

import { unifierInterfaces } from "assistant-source";

export const defaultConfiguration: OptionalConfiguration = {
  route: "/alexa",
  parameters: {
    number: "AMAZON.NUMBER"
  },
  useVerifier: true
};

export let descriptor: ComponentDescriptor = {
  name: "alexa",
  defaultConfiguration: defaultConfiguration,
  bindings: {
    root: (bindService, lookupService) => {
      bindService
        .bindExtension<unifierInterfaces.RequestConversationExtractor>(lookupService.lookup("core:unifier").getInterface("requestProcessor"))
        .to(RequestExtractor);

      bindService.bindExtension<unifierInterfaces.PlatformGenerator>(lookupService.lookup("core:unifier").getInterface("platformGenerator")).to(AlexaGenerator);
    },
    request: (bindService) => {
      bindService.bindGlobalService("current-response-handler").to(AlexaHandle);
    }
  }
};
