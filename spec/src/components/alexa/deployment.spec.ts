import { injectionNames, Logger } from "assistant-source";
import { execSync } from "child_process";
import * as fs from "fs";
import { Component, getMetaInjectionName } from "inversify-components";
import * as path from "path";
import { AlexaDeployment } from "../../../../src/components/alexa/deployment";
import { COMPONENT_NAME, Configuration } from "../../../../src/components/alexa/private-interfaces";
import { ThisContext } from "../../../support/this-context";

interface CurrentThisContext extends ThisContext {
  /** Includes the current instance of the AlexaDeployment */
  alexaDeployment: AlexaDeployment;
  /** Includes the assistant-alexa specific component metadata */
  componentMeta: Component<Configuration.Runtime>;
  /** Includes an instance of the current component logger */
  logger: Logger;
  /** Includes the build path used by the execute method */
  buildPath: string;
  /** Includes the return values of any created Spies */
  spyReturns: any;
  /** Includes the current instance of the Spy function from the execSync method */
  execSyncSpy: any;
  /** Includes the exported skill schema */
  skillSchema: {};
}

const { readdirSync, mkdirSync, writeFileSync, existsSync, readFileSync } = fs;
const { error, log } = console;
const setIntervalFunction = setInterval;
const clearIntervalFunction = clearInterval;

describe("AlexaDeployment", function() {
  afterEach(async function(this: CurrentThisContext) {
    /** Cleanup the overridden functions */
    (fs as any).readdirSync = readdirSync;
    (fs as any).readFileSync = readFileSync;
    (fs as any).mkdirSync = mkdirSync;
    (fs as any).writeFileSync = writeFileSync;
    (fs as any).existsSync = existsSync;

    (console as any).error = error;
    (console as any).log = log;

    (setInterval as any) = setIntervalFunction;
    (clearInterval as any) = clearIntervalFunction;
  });

  beforeEach(async function(this: CurrentThisContext) {
    /** Inject an instance of the current component metadata. */
    this.componentMeta = this.container.inversifyInstance.get(getMetaInjectionName(COMPONENT_NAME));
    /** Inject an instance of the current logger factory. */
    this.logger = this.container.inversifyInstance.get(injectionNames.logger);
    spyOn(this.logger, "error");

    /** Set the spec specific build path. File operations will be disabled so this is a mock value */
    this.buildPath = "tmp";

    /** Instantiate sypReturns, used to store any return values in it */
    this.spyReturns = {};

    /** Mock default deployed kill schema */
    this.skillSchema = { manifest: { publishingInformation: { locales: { "de-DE": { name: "test" } } } } };

    /** Disable disk IO. */
    (fs as any).writeFileSync = jasmine.createSpy("writeFileSync");
    (fs as any).readdirSync = jasmine.createSpy("readdirSync").and.returnValues(["schema_de.json"]);
    (fs as any).mkdirSync = jasmine.createSpy("mkdirSync").and.callFake((...args) => {});
    (fs as any).existsSync = jasmine.createSpy("existsSync").and.callFake((...args) => {});
    (fs as any).readFileSync = jasmine.createSpy("readFileSync").and.callFake((...args) => {
      return Buffer.from(JSON.stringify(this.skillSchema));
    });

    /** Set default execSync return values. Returned by the execSyncSpy */
    this.spyReturns.execSync = {
      version: Buffer.from("1.6.2"),
      updateModel: Buffer.from("Model for de-DE submitted."),
      getSkillStatus: Buffer.from(JSON.stringify({ interactionModel: { "de-DE": { lastUpdateRequest: { status: "SUCCEEDED" } } } })),
      getModel: Buffer.from(JSON.stringify({})),
      getSkill: Buffer.from(JSON.stringify(this.skillSchema)),
      updateSkill: Buffer.from(JSON.stringify({})),
    };

    /** Disable process execution and adds spy object. */
    this.execSyncSpy = (execSync as any) = jasmine.createSpy("execSync").and.callFake((command: string) => {
      if (command.includes("ask api get-skill-status")) {
        return this.spyReturns.execSync.getSkillStatus;
      }
      if (command.includes("ask api get-model")) {
        return this.spyReturns.execSync.getModel;
      }
      if (command.includes("ask api update-model -s")) {
        return this.spyReturns.execSync.updateModel;
      }
      if (command.includes("ask --version")) {
        return this.spyReturns.execSync.version;
      }
      if (command.includes("ask api get-skill ")) {
        return this.spyReturns.execSync.getSkill;
      }
      if (command.includes("ask api update-skill")) {
        return this.spyReturns.execSync.updateSkill;
      }
    });

    /** Replace console log and error with an spy instance */
    (console as any).error = jasmine.createSpy("console.error");
    (console as any).log = jasmine.createSpy("console.log");

    /**
     * Mock the setInterval method used by the AlexaDeployment
     */
    (setInterval as any) = jasmine.createSpy("setInterval").and.callFake((callback: () => {}, intervalTime: number) => {
      // setInterval is an asynchronous function we first have to return a value before the callback method will be invoked
      setTimeout(callback.bind(this.alexaDeployment), 0);
      return 1;
    });

    /**
     * Spy on the clearInterval method
     */
    (clearInterval as any) = jasmine.createSpy("clearInterval");

    /**
     * Instance of the AlexaDeployment
     */
    this.alexaDeployment = new AlexaDeployment(this.componentMeta, this.logger);
  });

  describe("#execute", function() {
    describe("regarding status checking", function() {
      beforeEach(async function(this: CurrentThisContext) {
        (this.alexaDeployment as any).isAskInstalled = () => true;

        await this.alexaDeployment.execute(this.buildPath);
      });

      it("indicate the current update status", async function(this: CurrentThisContext) {
        expect(execSync).toHaveBeenCalledWith(`ask api get-skill-status -s ${this.componentMeta.configuration.applicationID}`);
      });
    });

    describe("with mocked status checking", function() {
      it("reads all country codes from folder structure", async function(this: CurrentThisContext) {
        await this.alexaDeployment.execute(this.buildPath);
        // The build path should includes a folder for each language, like en or de
        expect(fs.readdirSync).toHaveBeenCalledWith(path.join(this.buildPath, "alexa"));
      });

      describe("regarding ask-cli", function() {
        it("checks whether ask-cli is installed", async function(this: CurrentThisContext) {
          await this.alexaDeployment.execute(this.buildPath);
          expect(execSync).toHaveBeenCalledWith("ask --version");
        });

        describe("with thrown error in execSync function", function() {
          beforeEach(async function(this: CurrentThisContext) {
            (execSync as any) = () => {
              throw new Error("");
            };
            await this.alexaDeployment.execute(this.buildPath);
          });

          it("returns console error output for uninstalled ask-cli package", async function(this: CurrentThisContext) {
            expect((console as any).error).toHaveBeenCalledWith(jasmine.stringMatching("The ask-cli is currently not installed"));
          });
        });

        it("checks if the current installed version is supported", async function(this: CurrentThisContext) {
          try {
            await this.alexaDeployment.execute(this.buildPath);

            // If the command 'ask --version' is executable we know wether the package is installed or not
            expect(execSync).toHaveBeenCalledWith("ask --version");
          } catch (error) {
            fail("Should not throw an unsupported ask-cli version exception");
          }
        });

        it("throws an unsupported ask-cli version exception", async function(this: CurrentThisContext) {
          try {
            this.spyReturns.execSync.version = Buffer.from("1.6.0");

            await this.alexaDeployment.execute(this.buildPath);
            fail("Should throw in unsupported ask-cli version exception");
          } catch (error) {
            expect(error.message).toEqual(jasmine.stringMatching("Unsupported ask-cli version installed"));
          }
        });

        describe("regarding skill schema deployment", function() {
          describe("regarding general operations", function() {
            beforeEach(async function(this: CurrentThisContext) {
              await this.alexaDeployment.execute(this.buildPath);
            });

            it("will check if a current exported schema exists", async function(this: CurrentThisContext) {
              expect(fs.existsSync).toHaveBeenCalledWith(`${this.buildPath}/deployments/alexa/skill-backup.json`);
            });

            it("reads the skill schema from file disk", async function(this: CurrentThisContext) {
              expect(fs.readFileSync).toHaveBeenCalledWith(`${this.buildPath}/deployments/alexa/skill-backup.json`);
            });
          });

          describe("with previous exported skill schema", function() {
            beforeEach(async function(this: CurrentThisContext) {
              (fs as any).existsSync = (command: string) => {
                // Returns true if existsSync will check for existing skill schema
                return command.includes(`${this.buildPath}/deployments/alexa/skill-backup.json`);
              };
              await this.alexaDeployment.execute(this.buildPath);
            });

            it("will not export the skill schema from the 'alexa developer console'", async function(this: CurrentThisContext) {
              expect(execSync).not.toHaveBeenCalledWith(`ask api get-skill -s ${this.componentMeta.configuration.applicationID}`);
            });

            it("will not write a exported skill schema to disk", async function(this: CurrentThisContext) {
              expect(fs.writeFileSync).not.toHaveBeenCalledWith(`${this.buildPath}/deployments/alexa/skill-backup.json`, jasmine.anything());
            });
          });

          describe("without exported skill schema", function() {
            beforeEach(async function(this: CurrentThisContext) {
              await this.alexaDeployment.execute(this.buildPath);
            });
            it("export the skill schema from the 'alexa developer console'", async function(this: CurrentThisContext) {
              expect(execSync).toHaveBeenCalledWith(`ask api get-skill -s ${this.componentMeta.configuration.applicationID}`);
            });

            it("creates a deployment directory", async function(this: CurrentThisContext) {
              expect(fs.mkdirSync).toHaveBeenCalledWith(`${this.buildPath}/deployments/`);
            });

            it("creates a alexa directory within the deployment directory", async function(this: CurrentThisContext) {
              expect(fs.mkdirSync).toHaveBeenCalledWith(`${this.buildPath}/deployments/alexa/`);
            });

            it("writes the exported skill schema to disk", async function(this: CurrentThisContext) {
              expect(fs.writeFileSync).toHaveBeenCalledWith(
                `${this.buildPath}/deployments/alexa/skill-backup.json`,
                this.spyReturns.execSync.getSkill.toString()
              );
            });
          });

          describe("regarding skill schema generation ", function() {
            describe("with new locales", function() {
              beforeEach(async function(this: CurrentThisContext) {
                // Mock exported Skill schema
                this.skillSchema = { manifest: { publishingInformation: { locales: { "de-DE": { name: "test" }, "en-GB": { name: "test" } } } } };
                await this.alexaDeployment.execute(this.buildPath);
              });

              it("writes console massage 'schema will be updated'", async function(this: CurrentThisContext) {
                expect(console.log).toHaveBeenCalledWith(jasmine.stringMatching("Skill schema will be updated"));
              });

              it("writes the new generated skill schema to disk", async function(this: CurrentThisContext) {
                expect(fs.writeFileSync).toHaveBeenCalledWith(
                  `${this.buildPath}/deployments/alexa/skill.json`,
                  JSON.stringify(
                    { manifest: { publishingInformation: { locales: { "de-DE": { name: this.componentMeta.configuration.invocationName } } } } },
                    null,
                    2
                  )
                );
              });
              it("submit the generated schema to the alexa developer console", async function(this: CurrentThisContext) {
                expect(execSync).toHaveBeenCalledWith(
                  `ask api update-skill -s ${this.componentMeta.configuration.applicationID} -f ${this.buildPath}/deployments/alexa/skill.json`
                );
              });
            });
          });
        });

        describe("regarding model export", function() {
          beforeEach(async function(this: CurrentThisContext) {
            await this.alexaDeployment.execute(this.buildPath);
          });

          it("exports the model from the 'alexa developer console'", async function(this: CurrentThisContext) {
            expect(execSync).toHaveBeenCalledWith(`ask api get-model -s ${this.componentMeta.configuration.applicationID} -l de-DE`);
          });

          it("writes model schema to disk", async function(this: CurrentThisContext) {
            expect(fs.writeFileSync).toHaveBeenCalledWith(`${this.buildPath}/deployments/alexa/schema_de-DE.json`, JSON.stringify({}, null, 2));
          });
        });

        describe("regarding model update", function() {
          it("returns a logging output for the current building status", async function(this: CurrentThisContext) {
            await this.alexaDeployment.execute(this.buildPath);
            expect(console.log).toHaveBeenCalledWith("Amazon model training for de-DE: SUCCEEDED");
          });

          describe("regarding shell execution", function() {
            beforeEach(async function(this: CurrentThisContext) {
              await this.alexaDeployment.execute(this.buildPath);
            });

            it("executes ask api model update command", async function(this: CurrentThisContext) {
              expect(execSync).toHaveBeenCalledWith(
                `ask api update-model -s ${this.componentMeta.configuration.applicationID} -f ${this.buildPath}/alexa/schema_de.json -l de-DE`
              );
            });
          });
        });
      });

      describe("regarding waiting while model is in progress", function() {
        describe("without timeout in whileModelIsInProgress", function() {
          beforeEach(async function(this: CurrentThisContext) {
            /**
             * Set the get skill status to return value SUCCEEDED
             */
            this.spyReturns.execSync.getSkillStatus = Buffer.from(
              JSON.stringify({
                interactionModel: {
                  "de-DE": {
                    lastUpdateRequest: { status: "SUCCEEDED" },
                  },
                },
              })
            );

            /**
             * Create a spy on the private AlexaDeployment status method
             */
            (this.alexaDeployment as any).status = jasmine.createSpy("status").and.callThrough();

            await this.alexaDeployment.execute(this.buildPath);
          });

          it("creates an interval witch will be called every 1000ms", async function(this: CurrentThisContext) {
            expect(setInterval).toHaveBeenCalledWith(jasmine.anything(), 1000);
          });

          it("clears the whileModelIsInProgress interval", async function(this: CurrentThisContext) {
            expect(clearInterval).toHaveBeenCalledWith(1);
          });

          it("checks the alexa deployment status", async function(this: CurrentThisContext) {
            expect((this.alexaDeployment as any).status).toHaveBeenCalled();
          });
        });

        describe("with timeout in whileModelIsInProgress", function() {
          beforeEach(async function(this: CurrentThisContext) {
            /**
             * Set get skill status to IN_PROGRESS
             */
            this.spyReturns.execSync.getSkillStatus = Buffer.from(
              JSON.stringify({ interactionModel: { "de-DE": { lastUpdateRequest: { status: "IN_PROGRESS" } } } })
            );

            /**
             * Set a spy on the logModelBuildStatus method from the AlexaDeployment
             */
            (this.alexaDeployment as any).logModelBuildStatus = jasmine.createSpy("logModelBuildStatus").and.callThrough();

            /**
             * Mock the setInterval method used by the AlexaDeployment. It will invoke the timeout
             */
            const currentTimeStamp = Date.now;
            (setInterval as any) = jasmine.createSpy("setInterval").and.callFake((callback: () => {}, intervalTime: number) => {
              Date.now = () => currentTimeStamp() + 120000;
              // setInterval is an asynchronous function we first have to return a value before the callback method will be invoked
              setTimeout(() => {
                // The callback needs the context from the AlexaDeployment so we have to bin it to the callback function.
                callback.bind(this.alexaDeployment)();
              }, 0);
              return 1;
            });
          });

          it("should not call logModelBuildStatus", async function(this: CurrentThisContext) {
            expect((this.alexaDeployment as any).logModelBuildStatus).not.toHaveBeenCalled();
          });

          it("reject the whileModelIsInProgress Promise and throws a timeout exception", async function(this: CurrentThisContext) {
            try {
              await this.alexaDeployment.execute(this.buildPath);
              fail("Should throw a timeout exception");
            } catch (error) {
              expect(error).toEqual("Model training runs in a timeout exception.");
            }
          });

          it("pint a timeout exception to the console output", async function(this: CurrentThisContext) {
            try {
              await this.alexaDeployment.execute(this.buildPath);
              fail("Should throw a timeout exception");
            } catch (error) {
              expect(console.log).toHaveBeenCalledWith("Model training runs in a timeout exception.");
            }
          });

          it("clears the whileModelIsInProgress waiting interval", async function(this: CurrentThisContext) {
            try {
              await this.alexaDeployment.execute(this.buildPath);
              fail("Should throw a timeout exception");
            } catch (error) {
              expect(clearInterval).toHaveBeenCalled();
            }
          });
        });
      });
    });
  });
});
