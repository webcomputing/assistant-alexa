import { GenericIntent, PlatformGenerator } from "assistant-source";
import * as fs from "fs";
import { Component, getMetaInjectionName } from "inversify-components";
import { AlexaGenerator, IntentSchema } from "../../../../src/components/alexa/generator";
import { COMPONENT_NAME, Configuration } from "../../../../src/components/alexa/private-interfaces";
import { ThisContext } from "../../../support/this-context";

interface CurrentThisContext extends ThisContext {
  /** Current component metadata used by the AlexaGenerator */
  componentMetaData: Component<Configuration.Runtime>;

  params: {
    /** Language transmitted to the AlexaGenerator execute method */
    language: string;

    /** Build directory transmitted to the AlexaGenerator execute method */
    buildDir: string;

    /** Intent configurations transmitted to the AlexaGenerator execute method */
    intentConfigurations: PlatformGenerator.IntentConfiguration[];

    /** Entity mapping transmitted to the AlexaGenerator execute method */
    entityMapping: PlatformGenerator.EntityMapping;

    /** Custom entity mapping transmitted to the AlexaGenerator execute method */
    customEntityMapping: PlatformGenerator.CustomEntityMapping;
  };

  /** Returns an new instance of the AlexaGenerator */
  getAlexaGenerator: () => AlexaGenerator;

  /** Run AlexaGenerator execute method an returns the result */
  execAlexaGenerator: () => ReturnType<AlexaGenerator["execute"]>;

  /** Helper function for expected write to schema functionality */
  expectSchemaWith: (params?: { invocationName?: string; intents?: IntentSchema[]; types?: any[] }) => void;
}

// Original functions which are going to be mocked
const { mkdirSync, writeFileSync } = fs;
const { warn } = console;
const { stringify } = JSON;

describe("AlexaGenerator", function() {
  beforeEach(async function(this: CurrentThisContext) {
    /** Disable reading and writing files from file system */
    (fs.mkdirSync as any) = jasmine.createSpy("mkdirSync").and.callFake(() => {});
    (fs.writeFileSync as any) = jasmine.createSpy("writeFileSync").and.callFake(() => {});

    /** Spy on console log */
    // tslint:disable-next-line:no-console
    console.warn = jasmine.createSpy("warn");

    /** Disable JSON.stringify ability. It allows to use jasmine.any or jasmine.anything in expect check. */
    JSON.stringify = (...params) => params[0];

    /** Set default parameter */
    this.params = {} as any;
    this.params.buildDir = "tmp";
    this.params.language = "en";
    this.params.intentConfigurations = [];
    this.params.entityMapping = {};
    this.params.customEntityMapping = {};

    this.componentMetaData = this.container.inversifyInstance.get(getMetaInjectionName(COMPONENT_NAME));
    this.componentMetaData.configuration.entities = {};

    /** Helper function for generate an instance of the AlexaGenerator  */
    this.getAlexaGenerator = function(this: CurrentThisContext) {
      return new AlexaGenerator(this.componentMetaData);
    };

    this.execAlexaGenerator = async function(this: CurrentThisContext) {
      return this.getAlexaGenerator().execute(
        this.params.language,
        this.params.buildDir,
        this.params.intentConfigurations,
        this.params.entityMapping,
        this.params.customEntityMapping
      );
    };

    this.expectSchemaWith = (params: { invocationName?: string; intents?: IntentSchema[]; types?: any[] } = {}) => {
      const expectedReturnValue = {
        interactionModel: {
          languageModel: {
            invocationName: params.invocationName || (jasmine.any(String) as any),
            intents: params.intents || (jasmine.any(Array) as any),
            types: params.types || (jasmine.any(Array) as any),
          },
        },
      };
      expect(fs.writeFileSync).toHaveBeenCalledWith(`${this.params.buildDir}/alexa/schema.json`, expectedReturnValue);
    };
  });

  afterEach(async function(this: CurrentThisContext) {
    /** Reset mocked fs functions */
    (fs as any).mkdirSync = mkdirSync;
    (fs as any).writeFileSync = writeFileSync;

    /** Reset ability of JSON.stringify */
    JSON.stringify = stringify;

    /** Reset spied waring method */
    // tslint:disable-next-line:no-console
    console.warn = warn;
  });

  describe("#execute", function() {
    it("creates an alexa build directory", async function(this: CurrentThisContext) {
      this.execAlexaGenerator();
      expect(fs.mkdirSync).toHaveBeenCalledWith(`${this.params.buildDir}/alexa`);
    });

    it("creates a schema.json file in the alexa build directory", async function(this: CurrentThisContext) {
      this.execAlexaGenerator();
      expect(fs.writeFileSync).toHaveBeenCalledWith(`${this.params.buildDir}/alexa/schema.json`, jasmine.anything());
    });

    describe("without entities", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.params.intentConfigurations = [
          {
            intent: "helloWorld",
            utterances: ["hello world"],
            entities: [],
          },
        ];
        await this.execAlexaGenerator();
      });

      it("maps transmitted intent configuration to alexa specific ones", async function(this: CurrentThisContext) {
        this.expectSchemaWith({
          intents: [
            { name: this.params.intentConfigurations[0].intent as string, slots: [], samples: this.params.intentConfigurations[0].utterances as string[] },
          ],
        });
      });
    });

    describe("with entities", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.params.intentConfigurations = [
          {
            intent: "helloWorld",
            utterances: ["hello {{entity1}}"],
            entities: ["entity1"],
          },
        ];

        this.params.entityMapping = { entity1: "ENTITIES_TYPE", ENTITIES_TYPE: "ENTITIES_TYPE" };
      });

      describe("with customEntityMapping", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.params.customEntityMapping = {
            ENTITIES_TYPE: [{ value: "entity1" }],
          };
        });

        describe("without defined entities in the component configuration", function() {
          beforeEach(async function(this: CurrentThisContext) {
            await this.execAlexaGenerator();
          });

          it("maps transmitted intent configuration to alexa specific ones", async function(this: CurrentThisContext) {
            this.expectSchemaWith({
              intents: [
                {
                  name: this.params.intentConfigurations[0].intent as string,
                  slots: [{ name: "entity1", type: "ENTITIES_TYPE" }],
                  samples: ["hello {entity1}"],
                },
              ],
            });
          });

          it("transfers custom entity mapping to alexa specific type definition", async function(this: CurrentThisContext) {
            this.expectSchemaWith({
              types: [{ name: "ENTITIES_TYPE", values: [{ name: { value: "entity1" } }] }],
            });
          });

          it("pass invocation name", async function(this: CurrentThisContext) {
            this.expectSchemaWith({
              invocationName: this.componentMetaData.configuration.invocationName,
            });
          });
        });

        describe("with defined entities in the component configuration (custom slot types)", function() {
          beforeEach(async function(this: CurrentThisContext) {
            this.componentMetaData.configuration.entities = { ENTITIES_TYPE: "@TYPE" };
            await this.execAlexaGenerator();
          });

          it("transmits defined entity as a custom slot type", async function(this: CurrentThisContext) {
            this.expectSchemaWith({
              types: [{ name: "@TYPE", values: [{ name: { value: "entity1" } }] }],
            });
          });

          it("references custom slot type in the intent definition", async function(this: CurrentThisContext) {
            this.expectSchemaWith({
              intents: [
                { name: this.params.intentConfigurations[0].intent as string, slots: [{ name: "entity1", type: "@TYPE" }], samples: ["hello {entity1}"] },
              ],
            });
          });
        });
      });

      describe("without customEntityMapping", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.params.customEntityMapping = {};
        });

        it("throws an missing amazon configured type exception", async function(this: CurrentThisContext) {
          try {
            await this.execAlexaGenerator();
            fail("Should throw an exception");
          } catch (error) {
            expect(error.message).toEqual("Missing amazon configured type for parameter 'entity1'");
          }
        });
      });
    });

    describe("with utterances", function() {
      describe("without entities", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.params.intentConfigurations = [{ intent: "helloWorld", utterances: ["hello world", "hello earth", "Salon world", "Salon earth"], entities: [] }];
          await this.execAlexaGenerator();
        });
        it("returns all given utterances", async function(this: CurrentThisContext) {
          this.expectSchemaWith({
            intents: [{ name: jasmine.anything() as any, slots: [], samples: jasmine.any(Array) as any }],
          });
        });

        it("returns an empty array of intent configurations slots", async function(this: CurrentThisContext) {
          this.expectSchemaWith({
            intents: [{ name: jasmine.anything() as any, slots: jasmine.any(Array) as any, samples: this.params.intentConfigurations[0].utterances }],
          });
        });
      });

      describe("with multiple entities with given examples", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.params.intentConfigurations = [
            { intent: "helloWorld", utterances: ["hello {{world|type}}, how are {{you|type2}}"], entities: ["type", "type2"] },
          ];
          this.params.entityMapping = { type: "ENTITIES_TYPE", type2: "ENTITIES_TYPE_2", ENTITIES_TYPE: "ENTITIES_TYPE", ENTITIES_TYPE_2: "ENTITIES_TYPE_2" };
          this.componentMetaData.configuration.entities = { ENTITIES_TYPE: "type", ENTITIES_TYPE_2: "type2" };

          await this.execAlexaGenerator();
        });

        it("returns all given slot type from utterances", async function(this: CurrentThisContext) {
          this.expectSchemaWith({
            intents: [
              {
                name: jasmine.anything() as any,
                slots: [{ name: "type", type: "type" }, { name: "type2", type: "type2" }],
                samples: jasmine.any(Array) as any,
              },
            ],
          });
        });

        it("removes entities examples", async function(this: CurrentThisContext) {
          this.expectSchemaWith({
            intents: [
              {
                name: jasmine.anything() as any,
                slots: jasmine.any(Array) as any,
                samples: ["hello {type}, how are {type2}"],
              },
            ],
          });
        });
      });
    });

    describe("with invalid invocationName", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.componentMetaData.configuration.invocationName = "WRONGinvocationName";
        await this.execAlexaGenerator();
      });

      it("replace the given one with an default invocationName", async function(this: CurrentThisContext) {
        this.expectSchemaWith({ invocationName: "setup-your-invocation-name-in-config" });
      });

      it("returns an invalid name warning", async function(this: CurrentThisContext) {
        expect(console.warn).toHaveBeenCalledWith(
          "Invocation name must start with a letter and can only contain lower case letters, spaces, apostrophes, and periods. Omitting.."
        );
      });
    });

    describe("with speakable intents", function() {
      describe("with utterances matching to the intent", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.params.intentConfigurations = [{ intent: GenericIntent.Yes, entities: [], utterances: ["Yes thats right"] }];
          await this.execAlexaGenerator();
        });

        it("returns an empty utterances array", async function(this: CurrentThisContext) {
          this.expectSchemaWith({ intents: [{ name: "AMAZON.YesIntent", slots: [], samples: [] }] });
        });
      });

      describe("without utterances matching to the intent", function() {
        beforeEach(async function(this: CurrentThisContext) {
          this.params.intentConfigurations = [{ intent: "noUtterances", entities: [], utterances: [] }];
          await this.execAlexaGenerator();
        });

        it("returns an did not specify utterance warning", async function(this: CurrentThisContext) {
          expect(console.warn).toHaveBeenCalledWith(jasmine.stringMatching("You did not specify any utterances for intent:"));
        });
      });
    });

    describe("with unspeakable generic intents", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.params.intentConfigurations = [{ intent: 11, entities: [], utterances: [] }];
        await this.execAlexaGenerator();
      });

      it("removes the intent from the schema definition", async function(this: CurrentThisContext) {
        this.expectSchemaWith({ intents: [] });
      });

      it("returns an could not convert all intents warning", async function(this: CurrentThisContext) {
        expect(console.warn).toHaveBeenCalledWith(jasmine.stringMatching("Could not convert all intents, missing"));
      });
    });
  });
});
