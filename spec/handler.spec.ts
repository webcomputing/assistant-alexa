import { SpecHelper } from "assistant-source";
import { AlexaSpecificHandable, AlexaSpecificTypes } from "../src/assistant-alexa";
import { AlexaSpecHelper } from "../src/spec-helper";

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
});
