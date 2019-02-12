import { CLIDeploymentExtension, injectionNames, Logger } from "assistant-source";
import { execSync } from "child_process";
import * as fs from "fs";
import { inject, injectable } from "inversify";
import { Component, getMetaInjectionName } from "inversify-components";
import { COMPONENT_NAME, Configuration } from "./private-interfaces";

@injectable()
export class AlexaDeployment implements CLIDeploymentExtension {
  constructor(
    @inject(getMetaInjectionName(COMPONENT_NAME)) private componentMeta: Component<Configuration.Runtime>,
    @inject(injectionNames.logger) private logger: Logger
  ) {}

  public async execute(buildPath: string) {
    // Reads all given languages from folder structure.
    const countryCodes = fs.readdirSync(`${buildPath}`);
    if (!countryCodes || countryCodes.length === 0) {
      throw new Error("There is no configuration given: Please execute the 'assistant generator' before uploading the current configuration.");
    }
    if (this.isAskInstalled()) {
      await Promise.all(
        countryCodes.map(async countryCode => {
          try {
            // Execute the ask update model command. e.g. 'ask api update-model -s schema.json -l de-DE'
            const updateModelExecution = execSync(
              `ask api update-model -s ${this.componentMeta.configuration.applicationID} -f ${buildPath}/${countryCode}/alexa/schema.json -l ${languageMapping(
                countryCode
              )}`
            );
            console.log("##############################################################################################");
            console.log(updateModelExecution.toString());
            console.log("##############################################################################################");

            console.log(`Interaction model building: ${this.status(countryCode)}`);
          } catch (error) {
            console.log(error);

            this.logger.error(error);
            // Exit Process if upload failed
            return;
          }

          // Wait until the model upload is out of state in progress.
          await this.whileModelIsInProgress(countryCode);
          console.log("##############################################################################################");
        })
      );
    }
    return;
  }

  /**
   * Get the status from the current skill configuration.
   * @param countryCode country code like de or en
   * @returns The status of the current skill, like IN_PROGRESS or SUCCEEDED
   */
  private status(countryCode: string) {
    const skillStatus = execSync(`ask api get-skill-status -s ${this.componentMeta.configuration.applicationID}`);

    return JSON.parse(skillStatus.toString()).interactionModel[languageMapping(countryCode)].lastUpdateRequest.status;
  }

  /**
   *  Wait until the status of the model upload is in state IN_PROGRESS
   * @param countryCode Country code like de or en
   */
  private async whileModelIsInProgress(countryCode: string) {
    const startTime: number = Date.now();
    const untilStateInProgress = new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        if (this.status(countryCode) !== "IN_PROGRESS") {
          // Clear setInterval and reduce memory use
          clearInterval(interval);
          // Resolve Promise because status is out of state IN_PROGRESS
          resolve();
        }

        // If a timeout of 2 minutes will reach, the Promise will be rejected and the interval will be cleared
        if (Date.now() - startTime > 120) {
          clearInterval(interval);
          reject();
        }
      }, 1000);
    });
    console.log(`Building ${this.status(countryCode)}`);
    return untilStateInProgress;
  }

  /**
   * Check it the ask-cli package will be installed. Its needed to upload the current agent configuration.
   * @returns A boolean flag, that indicates, whether the ask-cli package is installed or not
   */
  private isAskInstalled() {
    let aksVersion;
    try {
      // Execute the ask command line tool for indicating the current installed version. If this command will be executable we know that the cli tool is installed
      aksVersion = execSync("ask --version");
    } catch (e) {
      console.error("##############################################################################################");
      console.error(
        `The ask-cli is currently not installed. Please install it using 'npm i -g ask-cli'.\n After installation you have to run the command 'ask init' and login to the developer console with your \namazon developer account.`
      );
      console.error("##############################################################################################");
      return false;
    }
    // Check the given version. We need at leased the ask version 1.6.2
    if (
      Number(
        aksVersion
          .toString()
          .split(".")
          .join("")
      ) >= 162
    ) {
      return true;
    }
    throw new Error("Unsupported ask-cli version installed: Please install at leased version 1.6.2");
  }
}

/**
 * Alexa needs the locales in a LCID Format. Currently we use the country code for indicating the language.
 * This mapping function allows to get the LCID Code for the country code de or en.
 * If an unknown country code will be given, these will not be mapped it returned the code.
 * @param language country code as a string like de or en
 * @returns LCID Code or country code as a string
 */
const languageMapping = language => {
  const languages = { de: "de-DE", en: "en-GB" };
  return languages[language] || language;
};
