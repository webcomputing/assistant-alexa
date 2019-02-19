import { AssistantJSSetup, SpecHelper } from "assistant-source";
import { Container } from "inversify-components";

export interface ThisContext {
  /** AssistantJS setup instance */
  assistantJs: AssistantJSSetup;

  /** Instance of AssistantJS's spec helper */
  specHelper: SpecHelper;

  /** Current dependency injection container, recreated for every spec */
  container: Container;
}
