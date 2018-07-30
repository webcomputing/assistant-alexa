require("reflect-metadata");
let assistantJsCore = require("assistant-source");
let ownDescriptor = require("../../src/components/alexa/descriptor").descriptor;
let configuration = require("../support/mocks/configuration").configuration;
let mainState = require("../support/mocks/state").MainState;

beforeEach(function() {
  this.specHelper = new assistantJsCore.SpecHelper();

  // Bind and configure alexa extension
  this.specHelper.setup.registerComponent(ownDescriptor);
  this.specHelper.setup.configureComponent("alexa", configuration);

  // Prepare all other steps
  this.specHelper.prepare([mainState]);

  this.assistantJs = this.specHelper.setup;
  this.container = this.assistantJs.container;
});
