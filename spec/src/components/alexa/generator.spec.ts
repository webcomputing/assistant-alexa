import { GenericIntent, PlatformGenerator, SpecHelper } from "assistant-source";
import * as fs from "fs";
import { Component } from "inversify-components";
import { AlexaSpecificHandable, AlexaSpecificTypes } from "../../../../src/assistant-alexa";
import { AlexaGenerator } from "../../../../src/components/alexa/generator";
import { Configuration } from "../../../../src/components/alexa/private-interfaces";
import { AlexaSpecHelper } from "../../../../src/spec-helper";
import { deleteFolderRecursive } from "../../../support/mocks/utils/fs-utils";
import { ThisContext } from "../../../support/this-context";

interface CurrentThisContext extends ThisContext {
  specHelper: SpecHelper;
  alexaSpecHelper: AlexaSpecHelper;
  handler: AlexaSpecificHandable<AlexaSpecificTypes>;
  rootDir: string;
  buildDir: string;
  alexaGenerator: AlexaGenerator;
  language: string;
  intentConfigurations: PlatformGenerator.IntentConfiguration[];
  entityMapping: PlatformGenerator.EntityMapping;
  customEntityMapping: PlatformGenerator.CustomEntityMapping;
  expectedSchema: {};
  componentMetadata: Component<Configuration.Runtime>;
  itbehavesLikeAnAlexaGenerator: () => void;
}

describe("AlexaGenerator", function() {
  beforeAll(function(this: CurrentThisContext) {
    this.rootDir = __dirname.replace("spec/src/components/alexa", `tmp`);
    deleteFolderRecursive(this.rootDir);
    fs.mkdirSync(this.rootDir);
  });

  afterAll(function(this: CurrentThisContext) {
    deleteFolderRecursive(this.rootDir);
  });

  beforeEach(async function(this: CurrentThisContext) {
    this.alexaSpecHelper = new AlexaSpecHelper(this.specHelper);
    this.componentMetadata = this.container.inversifyInstance.get<Component<Configuration.Runtime>>("meta:component//alexa");

    // Create a single folder for each executed spec
    this.buildDir = `${this.rootDir}/${new Date().getTime()}`;
    deleteFolderRecursive(this.buildDir);
    fs.mkdirSync(this.buildDir);
  });

  function itbehavesLikeAnAlexaGenerator(additionalSpecs: () => void = () => {}) {
    describe("#execute", function(this: CurrentThisContext) {
      describe("it behaves like an AlexaGenerator", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.alexaGenerator.execute(this.language, this.buildDir, this.intentConfigurations, this.entityMapping, this.customEntityMapping);
        });
        it("creates an alexa specific build directory", async function(this: CurrentThisContext) {
          expect(fs.existsSync(`${this.buildDir}/alexa`)).toBeTruthy();
        });

        it("creates an schema.json file", async function(this: CurrentThisContext) {
          expect(fs.existsSync(`${this.buildDir}/alexa/schema.json`)).toBeTruthy();
        });

        it("schema.json contains expected schema", async function(this: CurrentThisContext) {
          const schema = JSON.parse(fs.readFileSync(`${this.buildDir}/alexa/schema.json`).toLocaleString());
          expect(schema).toEqual(this.expectedSchema);
        });

        additionalSpecs();
      });
    });
  }

  describe("with single intent and utterance", function(this: CurrentThisContext) {
    beforeEach(async function(this: CurrentThisContext) {
      this.alexaGenerator = new AlexaGenerator(this.componentMetadata);
      this.language = "en";

      this.intentConfigurations = [
        {
          intent: "okay",
          utterances: ["This is correct?"],
          entities: [],
        },
      ];
      this.entityMapping = {};
      this.customEntityMapping = {};
      this.expectedSchema = {
        interactionModel: {
          languageModel: {
            invocationName: "invocationname",
            intents: [{ name: "okay", slots: [], samples: ["This is correct?"] }],
            types: [],
          },
        },
      };
    });

    itbehavesLikeAnAlexaGenerator();
  });

  describe("with multiple intents and utterances", function(this: CurrentThisContext) {
    beforeEach(async function(this: CurrentThisContext) {
      this.alexaGenerator = new AlexaGenerator(this.componentMetadata);
      this.language = "en";

      this.intentConfigurations = [
        {
          intent: "okay",
          utterances: ["This is correct?"],
          entities: [],
        },
        {
          intent: "wellcome",
          utterances: ["Hello there", "Wellcome"],
          entities: [],
        },
      ];
      this.entityMapping = {};
      this.customEntityMapping = {};
      this.expectedSchema = {
        interactionModel: {
          languageModel: {
            invocationName: "invocationname",
            intents: [{ name: "okay", slots: [], samples: ["This is correct?"] }, { name: "wellcome", slots: [], samples: ["Hello there", "Wellcome"] }],
            types: [],
          },
        },
      };
    });

    itbehavesLikeAnAlexaGenerator();
  });

  describe("with single intent, utterance and entities", function(this: CurrentThisContext) {
    beforeEach(async function(this: CurrentThisContext) {
      this.alexaGenerator = new AlexaGenerator(this.componentMetadata);
      this.language = "en";

      this.intentConfigurations = [
        {
          intent: "okay",
          utterances: ["This is {{correct}}?"],
          entities: ["correct"],
        },
      ];
      this.entityMapping = { correct: "ENTITIES_TYPE", ENTITIES_TYPE: "ENTITIES_TYPE" };
      this.customEntityMapping = {
        ENTITIES_TYPE: [{ value: "correct" }],
      };

      this.expectedSchema = {
        interactionModel: {
          languageModel: {
            invocationName: "invocationname",
            intents: [
              {
                name: "okay",
                slots: [
                  {
                    name: "correct",
                    type: "ENTITIES_TYPE",
                  },
                ],
                samples: ["This is {correct}?"],
              },
            ],
            types: [
              {
                name: "ENTITIES_TYPE",
                values: [
                  {
                    name: {
                      value: "correct",
                    },
                  },
                ],
              },
            ],
          },
        },
      };
    });

    itbehavesLikeAnAlexaGenerator();
  });

  describe("with single intent, utterance and multiple entities", function(this: CurrentThisContext) {
    beforeEach(async function(this: CurrentThisContext) {
      this.alexaGenerator = new AlexaGenerator(this.componentMetadata);
      this.language = "en";

      this.intentConfigurations = [
        {
          intent: "okay",
          utterances: ["{{pronoun}} is {{correct}}?"],
          entities: ["correct", "pronoun"],
        },
      ];
      this.entityMapping = { pronoun: "ENTITIES_TYPE2", correct: "ENTITIES_TYPE", ENTITIES_TYPE: "ENTITIES_TYPE", ENTITIES_TYPE2: "ENTITIES_TYPE2" };

      this.customEntityMapping = {
        ENTITIES_TYPE: [{ value: "correct" }],
        ENTITIES_TYPE2: [{ value: "pronoun", synonyms: ["This", "That"] }],
      };

      this.expectedSchema = {
        interactionModel: {
          languageModel: {
            invocationName: "invocationname",
            intents: [
              {
                name: "okay",
                slots: [{ name: "correct", type: "ENTITIES_TYPE" }, { name: "pronoun", type: "ENTITIES_TYPE2" }],
                samples: ["{pronoun} is {correct}?"],
              },
            ],
            types: [
              {
                name: "ENTITIES_TYPE",
                values: [{ name: { value: "correct" } }],
              },
              {
                name: "ENTITIES_TYPE2",
                values: [{ name: { value: "pronoun", synonyms: ["This", "That"] } }],
              },
            ],
          },
        },
      };
    });

    itbehavesLikeAnAlexaGenerator();
  });

  describe("with intents and without utterances and entities", function(this: CurrentThisContext) {
    beforeEach(async function(this: CurrentThisContext) {
      this.alexaGenerator = new AlexaGenerator(this.componentMetadata);
      this.language = "en";

      this.intentConfigurations = [
        {
          intent: "okay",
          utterances: [],
          entities: [],
        },
      ];
      this.entityMapping = {};

      this.customEntityMapping = {};

      this.expectedSchema = {
        interactionModel: {
          languageModel: {
            invocationName: "invocationname",
            intents: [],
            types: [],
          },
        },
      };
    });

    itbehavesLikeAnAlexaGenerator();
  });

  describe("without intents, utterances and entities", function(this: CurrentThisContext) {
    beforeEach(async function(this: CurrentThisContext) {
      this.alexaGenerator = new AlexaGenerator(this.componentMetadata);
      this.language = "en";

      this.intentConfigurations = [];
      this.entityMapping = {};

      this.customEntityMapping = {};

      this.expectedSchema = {
        interactionModel: {
          languageModel: {
            invocationName: "invocationname",
            intents: [],
            types: [],
          },
        },
      };
    });

    itbehavesLikeAnAlexaGenerator();
  });

  describe("with GenericIntent Cancel (Speakable GenericIntent)", function(this: CurrentThisContext) {
    beforeEach(async function(this: CurrentThisContext) {
      this.alexaGenerator = new AlexaGenerator(this.componentMetadata);
      this.language = "en";

      this.intentConfigurations = [
        {
          intent: GenericIntent.Cancel,
          utterances: [],
          entities: [],
        },
      ];
      this.entityMapping = {};

      this.customEntityMapping = {};

      this.expectedSchema = {
        interactionModel: {
          languageModel: {
            invocationName: "invocationname",
            intents: [{ name: "AMAZON.CancelIntent", slots: [], samples: [] }],
            types: [],
          },
        },
      };
    });

    itbehavesLikeAnAlexaGenerator();
  });

  describe("with GenericIntent Cancel (Speakable GenericIntent) and utterances", function(this: CurrentThisContext) {
    beforeEach(async function(this: CurrentThisContext) {
      this.alexaGenerator = new AlexaGenerator(this.componentMetadata);
      this.language = "en";

      this.intentConfigurations = [
        {
          intent: GenericIntent.Cancel,
          utterances: ["Cancel"],
          entities: [],
        },
      ];
      this.entityMapping = {};

      this.customEntityMapping = {};

      this.expectedSchema = {
        interactionModel: {
          languageModel: {
            invocationName: "invocationname",
            intents: [{ name: "AMAZON.CancelIntent", slots: [], samples: [] }],
            types: [],
          },
        },
      };
    });

    itbehavesLikeAnAlexaGenerator();
  });

  describe("with unsupported GenericIntent", function(this: CurrentThisContext) {
    beforeEach(async function(this: CurrentThisContext) {
      this.alexaGenerator = new AlexaGenerator(this.componentMetadata);
      this.language = "en";

      this.intentConfigurations = [
        {
          intent: 100,
          utterances: [],
          entities: [],
        },
      ];
      this.entityMapping = {};

      this.customEntityMapping = {};

      this.expectedSchema = {
        interactionModel: {
          languageModel: {
            invocationName: "invocationname",
            intents: [],
            types: [],
          },
        },
      };
    });

    itbehavesLikeAnAlexaGenerator();
  });

  describe("with GenericIntent Unanswered (Unspeakable GenericIntent)", function(this: CurrentThisContext) {
    beforeEach(async function(this: CurrentThisContext) {
      this.alexaGenerator = new AlexaGenerator(this.componentMetadata);
      this.language = "en";

      this.intentConfigurations = [
        {
          intent: GenericIntent.Unanswered,
          utterances: [],
          entities: [],
        },
      ];
      this.entityMapping = {};

      this.customEntityMapping = {};

      this.expectedSchema = {
        interactionModel: {
          languageModel: {
            invocationName: "invocationname",
            intents: [],
            types: [],
          },
        },
      };
    });

    itbehavesLikeAnAlexaGenerator();
  });

  describe("with single intent, utterances and registerd custom slot type entity", function(this: CurrentThisContext) {
    beforeEach(async function(this: CurrentThisContext) {
      this.componentMetadata.configuration.entities.ENTITIES_TYPE = "@TYPE";

      this.alexaGenerator = new AlexaGenerator(this.componentMetadata);
      this.language = "en";

      this.intentConfigurations = [
        {
          intent: "okay",
          utterances: ["This is {{correct}}?"],
          entities: ["correct"],
        },
      ];
      this.entityMapping = { correct: "ENTITIES_TYPE", ENTITIES_TYPE: "ENTITIES_TYPE" };
      this.customEntityMapping = {
        ENTITIES_TYPE: [{ value: "correct" }],
      };

      this.expectedSchema = {
        interactionModel: {
          languageModel: {
            invocationName: "invocationname",
            intents: [
              {
                name: "okay",
                slots: [
                  {
                    name: "correct",
                    type: "@TYPE",
                  },
                ],
                samples: ["This is {correct}?"],
              },
            ],
            types: [
              {
                name: "@TYPE",
                values: [
                  {
                    name: { value: "correct" },
                  },
                ],
              },
            ],
          },
        },
      };
    });

    itbehavesLikeAnAlexaGenerator();
  });

  describe("with single intent, utterances and unregisterd custom slot type entity", function(this: CurrentThisContext) {
    beforeEach(async function(this: CurrentThisContext) {
      this.componentMetadata.configuration.entities.ENTITIES_TYPE = "@TYPE";

      this.alexaGenerator = new AlexaGenerator(this.componentMetadata);
      this.language = "en";

      this.intentConfigurations = [
        {
          intent: "okay",
          utterances: ["This is {{correct}}?"],
          entities: ["correct"],
        },
      ];
      this.entityMapping = {};
      this.customEntityMapping = {
        ENTITIES_TYPE: [{ value: "correct" }],
      };

      this.expectedSchema = {
        interactionModel: {
          languageModel: {
            invocationName: "invocationname",
            intents: [
              {
                name: "okay",
                slots: [
                  {
                    name: "correct",
                    type: "@TYPE",
                  },
                ],
                samples: ["This is {correct}?"],
              },
            ],
            types: [
              {
                name: "@TYPE",
                values: [
                  {
                    name: { value: "correct" },
                  },
                ],
              },
            ],
          },
        },
      };
    });

    describe("#execute", function() {
      it("throws a missing amazon configured type error ", async function(this: CurrentThisContext) {
        try {
          await this.alexaGenerator.execute(this.language, this.buildDir, this.intentConfigurations, this.entityMapping, this.customEntityMapping);
          fail("should throw an error of type missing amazon configured");
        } catch (e) {
          expect(e.message).toEqual("Missing amazon configured type for parameter 'correct'");
        }
      });
    });
  });

  describe("with single intent, utterances, entities but invalid invocation name", function(this: CurrentThisContext) {
    beforeEach(async function(this: CurrentThisContext) {
      this.componentMetadata.configuration.invocationName = "WRONGinvocationName";

      this.alexaGenerator = new AlexaGenerator(this.componentMetadata);
      this.language = "en";

      this.intentConfigurations = [
        {
          intent: "okay",
          utterances: ["This is {{correct}}?"],
          entities: ["correct"],
        },
      ];
      this.entityMapping = { correct: "ENTITIES_TYPE", ENTITIES_TYPE: "ENTITIES_TYPE" };
      this.customEntityMapping = {
        ENTITIES_TYPE: [{ value: "correct" }],
      };

      this.expectedSchema = {
        interactionModel: {
          languageModel: {
            invocationName: "setup-your-invocation-name-in-config",
            intents: [
              {
                name: "okay",
                slots: [
                  {
                    name: "correct",
                    type: "@TYPE",
                  },
                ],
                samples: ["This is {correct}?"],
              },
            ],
            types: [
              {
                name: "@TYPE",
                values: [
                  {
                    name: { value: "correct" },
                  },
                ],
              },
            ],
          },
        },
      };
    });

    itbehavesLikeAnAlexaGenerator();
  });
});
