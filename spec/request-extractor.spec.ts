import { unifierInterfaces, rootInterfaces } from "assistant-source";
import { RequestExtractor } from "../src/components/alexa/request-extractor";
import { validRequestContext } from "./support/mocks/request-context";

describe("RequestExtractor", function() {
  let extractor: RequestExtractor;
  let context: rootInterfaces.RequestContext;

  beforeEach(function() {
    extractor = this.container.inversifyInstance.get(unifierInterfaces.componentInterfaces.requestProcessor);
    context = Object.assign({}, validRequestContext);
  });

  describe("fits", function() {
    describe("with verifyAlexa proxyfied", function() {
      describe("when a valid (but signature missing) amazon request is given", function() {
        it("returns true", function() {
          return extractor.fits(context).then(result => expect(result).toBeTruthy());
        });
      });
    });

    describe("without verifyAlexa proxyfied", function() {
      beforeEach(function() {
        (extractor as any).configuration.useVerifier = true;
        extractor.verifyAlexaProxy = extractor.resolveVerifier();
      });

      describe("when a valid (but signature missing) amazon request is given", function() {
        it("returns true", function() {
          return extractor.fits(context).then(result => expect(result).toBeFalsy());
        });
      });
    })

    describe("with wrong path", function() {
      beforeEach(function() {
        context.path = "/wrong-path";
      });

      it("returns false", function() {
        return extractor.fits(context).then(result => expect(result).toBeFalsy());
      });
    });

    describe("with wrong applicationId", function() {
      beforeEach(function() {
        context.body.session.application.applicationId = "wrong-applicationId";
      });

      it("returns false", function() {
        return extractor.fits(context).then(result => expect(result).toBeFalsy());
      });
    });
  });

  describe("extract", function() {
    beforeEach(async function(done) {
      this.extraction = await extractor.extract(context);
      done();
    });

    it("returns correct extraction", function() {
      expect(this.extraction).toEqual({
        sessionID: "alexa-SessionId.d391741c-a96f-4393-b7b4-ee76c81c24d3",
        intent: "test",
        entities: {"entity1": "entityvalue"},
        language: "en",
        component: extractor.component,
        oAuthToken: "mockOAuthToken",
        temporalAuthToken: "temporalUserId"
      });
    });
  });
});