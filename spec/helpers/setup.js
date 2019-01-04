require("reflect-metadata");
let assistantJsCore = require("assistant-source");
let ownDescriptor = require("../../src/components/alexa/descriptor").descriptor;
let configuration = require("../support/mocks/configuration").configuration;
let mainState = require("../support/mocks/state").MainState;

beforeEach(function() {
  this.assistantJs = assistantJsCore.AssistantJSSetup();
  this.specHelper = new assistantJsCore.SpecHelper(this.assistantJs);

  // Bind and configure alexa extension
  this.assistantJs.registerComponent(ownDescriptor);
  this.assistantJs.configureComponent("alexa", configuration);

  // Prepare all other steps
  this.specHelper.prepare([mainState]);

  this.container = this.assistantJs.container;
});
