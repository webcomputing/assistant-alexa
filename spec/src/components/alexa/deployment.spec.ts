import { injectionNames, Logger } from "assistant-source";
import { execSync } from "child_process";
import * as fs from "fs";
import { Component, getMetaInjectionName } from "inversify-components";
import { AlexaDeployment } from "../../../../src/components/alexa/deployment";
import { COMPONENT_NAME, Configuration } from "../../../../src/components/alexa/private-interfaces";
import { ThisContext } from "../../../support/this-context";

interface CurrentThisContext extends ThisContext {
  /** Includes the current instance of the AlexaDeployment */
  alexaDeployment: AlexaDeployment;
  /** Includes the assistant-alexa specific component metadata */
  componentMeta: Component<Configuration.Runtime>;
  /** Includes in instance of the current component logger */
  logger: Logger;
  /** Includes the build path used by the execute method */
  buildPath: string;
  /** Includes the return values of any created Spies */
  spyReturns: any;
  /** Includes the current instance of the Spy function from the execSync method */
  execSyncSpy: any;
}

const { readdirSync } = fs;
const { error, log } = console;

describe("AlexaDeployment", function() {
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

    /** Disable folder reading operations. */
    (fs as any).readdirSync = jasmine.createSpy("readdirSync").and.returnValues(["de"]);

    /** Disable process execution and adds spy object. */
    this.spyReturns.execSync = Buffer.from("1.6.2");
    this.execSyncSpy = jasmine.createSpy("execSync").and.callFake(params => this.spyReturns.execSync);
    (execSync as any) = this.execSyncSpy;

    /** Replace console log and error with an spy instance */
    (console as any).error = jasmine.createSpy("console.error");
    (console as any).log = jasmine.createSpy("console.log");

    this.alexaDeployment = new AlexaDeployment(this.componentMeta, this.logger);
  });

  afterEach(async function(this: CurrentThisContext) {
    /** Cleanup the overridden functions */
    (fs as any).readdirSync = readdirSync;
    (console as any).error = error;
    (console as any).log = log;
  });

  describe("#execute", function() {
    describe("regarding status checking", function() {
      beforeEach(async function(this: CurrentThisContext) {
        const currentExecSync = execSync;
        (execSync as any) = jasmine.createSpy("execSync").and.callFake((command: string) => {
          if (command.includes("ask api get-skill-status")) {
            return "{interactionModel: { de-DE: { lastUpdateRequest: { 'status': 'SUCCEEDED' } } } }";
          }
          return currentExecSync(command);
        });
        await this.alexaDeployment.execute(this.buildPath);
      });

      it("indicate the current update state", async function(this: CurrentThisContext) {
        expect(execSync).toHaveBeenCalledWith(`ask api get-skill-status -s ${this.componentMeta.configuration.applicationID}`);
      });
    });

    describe("with mocked status checking", function() {
      beforeEach(async function(this: CurrentThisContext) {
        /** Mock status checking. */
        (this.alexaDeployment as any).status = (countryCode: string) => "SUCCESS";
      });

      it("reads all country codes from folder structure", async function(this: CurrentThisContext) {
        await this.alexaDeployment.execute(this.buildPath);
        // The build path should includes a folder for each language, like en or de
        expect(fs.readdirSync).toHaveBeenCalledWith(this.buildPath);
      });

      describe("regarding ask-cli", function() {
        beforeEach(async function(this: CurrentThisContext) {
          (fs as any).readdirSync = jasmine.createSpy("readdirSync").and.returnValues(["de"]);
        });

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
            this.spyReturns.execSync = Buffer.from("1.6.0");

            await this.alexaDeployment.execute(this.buildPath);
            fail("Should throw in unsupported ask-cli version exception");
          } catch (error) {
            expect(error.message).toEqual(jasmine.stringMatching("Unsupported ask-cli version installed"));
          }
        });

        describe("regarding model update", function() {
          it("returns an logging output if the model build is out of state IN_PROGRESS", async function(this: CurrentThisContext) {
            this.alexaDeployment.execute(this.buildPath);
            expect(console.log).toHaveBeenCalledWith("Interaction model building: SUCCESS");
          });

          describe("regarding shell execution", function() {
            beforeEach(async function(this: CurrentThisContext) {
              await this.alexaDeployment.execute(this.buildPath);
            });

            it("executes ask api model update command", async function(this: CurrentThisContext) {
              expect(execSync).toHaveBeenCalledWith(
                `ask api update-model -s ${this.componentMeta.configuration.applicationID} -f ${this.buildPath}/de/alexa/schema.json -l de-DE`
              );
            });
          });
        });
      });

      describe("with status IN_PROGRESS", function() {
        describe("with timeout", function() {
          beforeEach(async function(this: CurrentThisContext) {
            (this.alexaDeployment as any).status = (countryCode: string) => "IN_PROGRESS";
            (clearInterval as any) = jasmine.createSpy("clearInterval").and.callThrough();
          });

          it("stops waiting until status is in state IN_PROGRESS and reject the promise", async function(this: CurrentThisContext) {
            try {
              await this.alexaDeployment.execute(this.buildPath);
              fail("Should reject Promise and run in an timeout");
            } catch (error) {
              expect(clearInterval).toHaveBeenCalled();
            }
          });
        });

        describe("without timeout", function() {
          beforeEach(async function(this: CurrentThisContext) {
            (this.alexaDeployment as any).status = (countryCode: string) => "IN_PROGRESS";
            (setInterval as any) = jasmine.createSpy("setInterval");
            this.alexaDeployment.execute(this.buildPath);
          });

          it("runs in an interval and wait as long as status is in IN_PROGRESS", async function(this: CurrentThisContext) {
            expect(setInterval).toHaveBeenCalledWith(jasmine.anything(), 1000);
          });
        });
      });
    });
  });
});
