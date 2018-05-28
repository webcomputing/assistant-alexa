import { ResponseFactory, State } from "assistant-source";
import { inject, injectable } from "inversify";

@injectable()
export class MainState implements State.Required {
  responseFactory: ResponseFactory;

  constructor(@inject("core:unifier:current-response-factory") factory: ResponseFactory) {
    this.responseFactory = factory;
  }

  imageCardIntent() {
    this.responseFactory
      .createCardResponse()
      .setTitle("My title")
      .setBody("My body")
      .setImage("My image");
  }

  standardCardIntent() {
    this.responseFactory
      .createCardResponse()
      .setTitle("My title")
      .setBody("My body");
  }

  unhandledGenericIntent() {
    this.responseFactory.createSimpleVoiceResponse().endSessionWith("Hello from alexa!");
  }

  unansweredGenericIntent() {
    this.responseFactory.createAndSendEmptyResponse();
  }
}
