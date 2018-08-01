import { injectionNames, State } from "assistant-source";
import { inject, injectable } from "inversify";
import { AlexaSpecificTypes, AlexaSubtypes } from "../../../src/assistant-alexa";
import { AlexaHandler } from "../../../src/components/alexa/handler";
import { bodyTemplate1, bodyTemplate2, bodyTemplate3, bodyTemplate6, bodyTemplate7, hint, listTemplate1, listTemplate2 } from "./directives";

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

  public async unansweredGenericIntent() {
    await this.handler.send();
  }

  public customDirectivesIntent() {
    this.handler.setAlexaCustomDirectives([
      {
        type: "Display.RenderTemplate",
        template: { ...bodyTemplate1, type: "BodyTemplate1" },
      },
      {
        hint,
        type: "Hint",
      },
    ]);
  }

  public hintIntent() {
    this.handler.setAlexaHint("my hint").setAlexaBodyTemplate1(bodyTemplate1);
  }

  public listTemplate1Intent() {
    this.handler.setAlexaListTemplate1(listTemplate1);
  }

  public listTemplate2Intent() {
    this.handler.setAlexaListTemplate2(listTemplate2);
  }

  public bodyTemplate1Intent() {
    this.handler.setAlexaBodyTemplate1(bodyTemplate1);
  }

  public bodyTemplate2Intent() {
    this.handler.setAlexaBodyTemplate2(bodyTemplate2);
  }

  public bodyTemplate3Intent() {
    this.handler.setAlexaBodyTemplate3(bodyTemplate3);
  }

  public bodyTemplate6Intent() {
    this.handler.setAlexaBodyTemplate6(bodyTemplate6);
  }

  public bodyTemplate7Intent() {
    this.handler.setAlexaBodyTemplate7(bodyTemplate7);
  }
}
