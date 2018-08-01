import * as askInterfaces from "ask-sdk-model";
import { SpecHelper } from "assistant-source";
import { AlexaSpecificHandable, AlexaSpecificTypes } from "../src/assistant-alexa";
import { AlexaSpecHelper } from "../src/spec-helper";
import { bodyTemplate1, bodyTemplate2, bodyTemplate3, bodyTemplate6, bodyTemplate7, hint, listTemplate1, listTemplate2 } from "./support/mocks/directives";

interface CurrentThisContext {
  specHelper: SpecHelper;
  alexaSpecHelper: AlexaSpecHelper;
  handler: AlexaSpecificHandable<AlexaSpecificTypes>;
  responseResults: Partial<AlexaSpecificTypes>;
}

describe("Handler", function() {
  beforeEach(async function(this: CurrentThisContext) {
    this.alexaSpecHelper = new AlexaSpecHelper(this.specHelper);
  });

  describe(" with spec setp", function() {
    beforeEach(async function(this: CurrentThisContext) {
      this.handler = await this.alexaSpecHelper.pretendIntentCalled("test");
      this.responseResults = this.specHelper.getResponseResults();
    });

    it("is correctly linked to spec setup", async function(this: CurrentThisContext) {
      expect(this.responseResults.shouldSessionEnd).toBeTruthy();
      expect(this.responseResults.voiceMessage).toBeTruthy();
      expect(this.responseResults.voiceMessage!.text).toBe("Hello from alexa!");
    });

    it("cannot be executed twice", async function(this: CurrentThisContext) {
      try {
        await this.handler.send();
        fail("should throw error");
      } catch (e) {
        expect(true).toBe(true);
      }
    });
  });

  describe("with image card", function() {
    beforeEach(async function(this: CurrentThisContext) {
      this.handler = await this.alexaSpecHelper.pretendIntentCalled("imageCard");
      this.responseResults = this.specHelper.getResponseResults();
    });

    it("sets an image card correctly", async function(this: CurrentThisContext) {
      const card = (this.handler as any).getBody(this.responseResults).response.card;

      expect(card.type).toEqual("Standard");
      expect(card.title).toEqual("My title");
      expect(card.text).toEqual("My body");
      expect(card.image.smallImageUrl).toEqual("My image");
      expect(card.image.largeImageUrl).toEqual("My image");
    });
  });

  describe("with standard card", function() {
    beforeEach(async function(this: CurrentThisContext) {
      this.handler = await this.alexaSpecHelper.pretendIntentCalled("standardCard");
      this.responseResults = this.specHelper.getResponseResults();
    });

    it("sets a standard card correctly", async function(this: CurrentThisContext) {
      const card = (this.handler as any).getBody(this.responseResults).response.card;

      expect(card.type).toEqual("Simple");
      expect(card.title).toEqual("My title");
      expect(card.content).toEqual("My body");
    });
  });

  describe("with customDirectives", function() {
    beforeEach(async function(this: CurrentThisContext) {
      this.handler = await this.alexaSpecHelper.pretendIntentCalled("customDirectives");
      this.responseResults = this.specHelper.getResponseResults();
    });

    it("sets a customDirectives correctly", async function(this: CurrentThisContext) {
      const directives = ((this.handler as any).getBody(this.responseResults) as askInterfaces.ResponseEnvelope).response.directives;

      expect(directives).not.toBeUndefined();
      expect(directives!.length).toBe(2);
    });
  });

  describe("with Hint", function() {
    beforeEach(async function(this: CurrentThisContext) {
      this.handler = await this.alexaSpecHelper.pretendIntentCalled("hint");
      this.responseResults = this.specHelper.getResponseResults();
    });

    it("sets a Hint correctly", async function(this: CurrentThisContext) {
      const directives = ((this.handler as any).getBody(this.responseResults) as askInterfaces.ResponseEnvelope).response.directives;

      expect(directives).not.toBeUndefined();
      expect(directives!.length).toBeGreaterThan(1);
      expect(directives![1]).toEqual({
        hint,
        type: "Hint",
      });
    });
  });

  describe("with ListTemplate1", function() {
    testDirective("ListTemplate1", "listTemplate1", {
      type: "Display.RenderTemplate",
      template: { ...listTemplate1, type: "ListTemplate1" },
    });
  });

  describe("with ListTemplate2", function() {
    testDirective("ListTemplate2", "listTemplate2", {
      type: "Display.RenderTemplate",
      template: { ...listTemplate2, type: "ListTemplate2" },
    });
  });

  describe("with BodyTemplate1", function() {
    testDirective("BodyTemplate1", "bodyTemplate1", {
      type: "Display.RenderTemplate",
      template: { ...bodyTemplate1, type: "BodyTemplate1" },
    });
  });

  describe("with BodyTemplate2", function() {
    testDirective("BodyTemplate2", "bodyTemplate2", {
      type: "Display.RenderTemplate",
      template: { ...bodyTemplate2, type: "BodyTemplate2" },
    });
  });

  describe("with BodyTemplate3", function() {
    testDirective("BodyTemplate3", "bodyTemplate3", {
      type: "Display.RenderTemplate",
      template: { ...bodyTemplate3, type: "BodyTemplate3" },
    });
  });

  describe("with BodyTemplate6", function() {
    testDirective("BodyTemplate6", "bodyTemplate6", {
      type: "Display.RenderTemplate",
      template: { ...bodyTemplate6, type: "BodyTemplate6" },
    });
  });

  describe("with BodyTemplate7", function() {
    testDirective("BodyTemplate7", "bodyTemplate7", {
      type: "Display.RenderTemplate",
      template: { ...bodyTemplate7, type: "BodyTemplate7" },
    });
  });
});

function testDirective(directiveName: string, intent: string, expectedDirective: any, minDirectiveLength: number = 1) {
  beforeEach(async function(this: CurrentThisContext) {
    this.handler = await this.alexaSpecHelper.pretendIntentCalled(intent);
    this.responseResults = this.specHelper.getResponseResults();
  });
  it(`sets ${directiveName} correctly`, async function(this: CurrentThisContext) {
    const directives = ((this.handler as any).getBody(this.responseResults) as askInterfaces.ResponseEnvelope).response.directives;
    expect(directives).not.toBeUndefined();
    expect(directives!.length).toBeGreaterThanOrEqual(minDirectiveLength);
    expect(directives![0]).toEqual(expectedDirective);
  });
}
