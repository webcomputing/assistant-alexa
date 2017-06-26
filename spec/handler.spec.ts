import { SpecHelper } from "../src/spec-helper";

describe("Handler", function() {
  let alexaHelper: SpecHelper;

  beforeEach(function() {
    alexaHelper = new SpecHelper(this.specHelper);
  })

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