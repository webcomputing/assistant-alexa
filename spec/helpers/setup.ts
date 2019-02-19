// tslint:disable-next-line
require("reflect-metadata");

import { AssistantJSSetup, SpecHelper } from "assistant-source";
import { descriptor } from "../../src/assistant-alexa";
import { configuration } from "../support/mocks/configuration";
import { MainState } from "../support/mocks/state";
import { ThisContext } from "../support/this-context";

beforeEach(function(this: ThisContext) {
  this.assistantJs = new AssistantJSSetup();
  this.specHelper = new SpecHelper(this.assistantJs);

  // Bind and configure alexa extension
  this.assistantJs.registerComponent(descriptor);
  this.assistantJs.configureComponent("alexa", configuration);

  // Prepare all other steps
  this.specHelper.prepare([MainState]);

  this.container = this.assistantJs.container;
});
