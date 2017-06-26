import { unifierInterfaces, stateMachineInterfaces } from "assistant-source";
import { injectable, inject } from "inversify";

@injectable()
export class MainState implements stateMachineInterfaces.State {
  responseFactory: unifierInterfaces.ResponseFactory;

  constructor(@inject("core:unifier:current-response-factory") factory: unifierInterfaces.ResponseFactory) {
    this.responseFactory = factory;
  }

  unhandledIntent() {
    this.responseFactory.createSimpleVoiceResponse().endSessionWith("Hello from alexa!");
  }
}