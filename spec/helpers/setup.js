require("reflect-metadata");
let assistantJsCore = require("assistant-source");


beforeEach(function() {
  this.specHelper = new assistantJsCore.SpecSetup();
  this.specHelper.prepare();

  this.assistantJs = this.specHelper.setup;
  this.container = this.assistantJs.container;
});