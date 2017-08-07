import { SpecHelper } from "../src/spec-helper";

describe("Handler", function() {
  let alexaHelper: SpecHelper;

  beforeEach(function() {
    alexaHelper = new SpecHelper(this.specHelper);
  })

  it("sets an image card correctly", function() {
    return alexaHelper.pretendIntentCalled("imageCard").then(handler => {
      let card = (handler as any).getBody().response.card;

      expect(card.type).toEqual("Standard");
      expect(card.title).toEqual("My title");
      expect(card.text).toEqual("My body");
      expect(card.image.smallImageUrl).toEqual("My image");
      expect(card.image.largeImageUrl).toEqual("My image");
    });
  });

  it("sets a standard card correctly", function() {
    return alexaHelper.pretendIntentCalled("standardCard").then(handler => {
      let card = (handler as any).getBody().response.card;

      expect(card.type).toEqual("Simple");
      expect(card.title).toEqual("My title");
      expect(card.content).toEqual("My body");
    });
  });

  it("is correctly linked to spec setup", function() {
    return alexaHelper.pretendIntentCalled("test").then(handler => {
      expect(handler.endSession).toBeTruthy();
      expect(handler.voiceMessage).toBe("Hello from alexa!");
    });
  });

  it("cannot be executed twice", function() {
    return alexaHelper.pretendIntentCalled("test").then(handler => {
      expect(function() {
        handler.sendResponse();
      }).toThrow();
    });
  });
});