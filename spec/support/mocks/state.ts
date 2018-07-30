import { injectionNames, State } from "assistant-source";
import { inject, injectable } from "inversify";
import { AlexaSpecificTypes } from "../../../src/assistant-alexa";
import { AlexaHandler } from "../../../src/components/alexa/handler";

@injectable()
export class MainState implements State.Required {
  constructor(@inject(injectionNames.current.responseHandler) private handler: AlexaHandler<AlexaSpecificTypes>) {}

  public imageCardIntent() {
    this.handler.setCard({ title: "My title", description: "My body", cardImage: "My image" });
  }

  public standardCardIntent() {
    this.handler.setCard({ title: "My title", description: "My body" });
  }

  public async unhandledGenericIntent() {
    this.handler.endSessionWith("Hello from alexa!");
  }

  public unansweredGenericIntent() {
    this.handler.send();
  }
}
