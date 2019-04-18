import { CLIDeploymentExtension, injectionNames, Logger } from "assistant-source";
import { execSync } from "child_process";
import * as fs from "fs";
import { inject, injectable } from "inversify";
import { Component, getMetaInjectionName } from "inversify-components";
import * as path from "path";
import { AlexaSkillSchema, COMPONENT_NAME, Configuration } from "./private-interfaces";

/**
 * Manage the Alexa skill deployment
 */
@injectable()
export class AlexaDeployment implements CLIDeploymentExtension {
  constructor(
    @inject(getMetaInjectionName(COMPONENT_NAME)) private componentMeta: Component<Configuration.Runtime>,
    @inject(injectionNames.logger) private logger: Logger
  ) {}

  /**
   * Execute the Alexa agent deployment
   * @param buildPath Path to the current build directory
   */
  public async execute(buildPath: string) {
    // tslint:disable-next-line:no-console
    console.log("===============     ALEXA DEPLOYMENT     ===============");

    // Reads all names of given languages specific schema files.
    const schemaFiles = fs.readdirSync(path.join(buildPath, "alexa"));

    // Extract the country code from
    const countryCodes: string[] = this.getCountryCodes(schemaFiles);

    if (countryCodes && countryCodes.length > 0) {
      if (this.isAskInstalled()) {
        await this.deploySkillSchema(buildPath, countryCodes);

        await Promise.all(this.deployModelSchema(buildPath, countryCodes));

        // tslint:disable-next-line:no-console
        console.log("============        FINISHED.             ============");
      }
    } else {
      throw new Error("There is no configuration given: Please execute the 'assistant generator' before uploading the current configuration.");
    }
    return;
  }

  /**
   * Deploy the model schema for all country codes.
   * This model schema includes all configured intents, utterances and all other skill specific configurations.
   * @param buildPath Path to the current build folder
   * @param countryCodes list of all configured country codes like ['de', 'en']
   */
  private deployModelSchema(buildPath: string, countryCodes: string[]) {
    return countryCodes.map(countryCode => {
      const currentLocale = this.languageMapping(countryCode);
      this.exportModel(buildPath, currentLocale);
      this.updateModel(buildPath, countryCode, currentLocale);

      // Wait until the model upload is out of state in progress.
      return this.whileModelTrainingIsInProgress(countryCode);
    });
  }

  /**
   * Extract all given country codes
   * @param schemaFiles List of the path to all given schema files
   */
  private getCountryCodes(schemaFiles: string[]): string[] {
    return schemaFiles
      .map(schemaFile => {
        const schemaFileMatchTheLanguage = schemaFile.match(/schema_(..)\.json/);
        return schemaFileMatchTheLanguage && schemaFileMatchTheLanguage[1] ? schemaFileMatchTheLanguage[1] : undefined;
      })
      .filter(countryCode => typeof countryCode !== "undefined") as string[];
  }

  /**
   * Get the current deployed model schema from the 'alexa developer console'.
   * This model schema includes all configured intents, utterances and all other skill specific configurations.
   * @param locale locale of the model definition like 'de-DE' or 'en-GB'
   * @returns skill model
   */
  private getModel(locale: string) {
    try {
      const modelSchema = execSync(`ask api get-model -s ${this.componentMeta.configuration.applicationID} -l ${locale}`);
      return JSON.parse(modelSchema.toString());
    } catch (error) {
      return {};
    }
  }

  /**
   * Update the skill specific model schema. This model schema includes all configured intents,
   * utterances and all other skill specific configurations.
   * @param buildPath Path to the current build folder
   * @param countryCode code of the current country like 'de' or 'en'
   * @param locale code of the current locale definition like 'de-DE' or 'en-GB'
   */
  private updateModel(buildPath: string, countryCode: string, locale: string) {
    try {
      // Execute the ask update model command. e.g. 'ask api update-model -s schema.json -l de-DE'
      const updateModelExecution = execSync(
        `ask api update-model -s ${this.componentMeta.configuration.applicationID} -f ${path.join(
          buildPath,
          "alexa",
          `schema_${countryCode}.json`
        )} -l ${locale}`
      );

      /**
       * Show debug output only if the model could not be submitted.
       */
      if (!updateModelExecution.toString().includes(`Model for ${locale} submitted.`)) {
        // tslint:disable-next-line:no-console
        console.log("##############################################################################################");
        // tslint:disable-next-line:no-console
        console.log(updateModelExecution.toString());
        // tslint:disable-next-line:no-console
        console.log("##############################################################################################");
      }

      this.logModelBuildStatus(countryCode);
    } catch (error) {
      this.logger.error(error);
      // Exit Process if upload failed
      return;
    }
  }

  /**
   * Export the currently deployed alexa model schema and store it to the given buildPath.
   * This model schema includes all configured intents, utterances and all other skill specific configurations.
   * @param buildPath Path to the current build folder. like {root}/builds/123456789
   * @param locale LCID Code
   */
  private async exportModel(buildPath: string, locale: string) {
    const model = this.getModel(locale);

    try {
      fs.writeFileSync(path.join(buildPath, "deployments", "alexa", `schema_${locale}.json`), JSON.stringify(model, null, 2));
    } catch (error) {
      // tslint:disable-next-line:no-console
      console.error(error);
    }
  }

  /**
   * Get the status from the current skill configuration.
   * @param countryCode country code like de or en
   * @returns The status of the current skill, like IN_PROGRESS or SUCCEEDED
   */
  private status(countryCode: string) {
    const skillStatus = execSync(`ask api get-skill-status -s ${this.componentMeta.configuration.applicationID}`);
    const parsedSkillStatus = JSON.parse(skillStatus.toString());

    if (
      parsedSkillStatus &&
      parsedSkillStatus.interactionModel &&
      parsedSkillStatus.interactionModel[this.languageMapping(countryCode)] &&
      parsedSkillStatus.interactionModel[this.languageMapping(countryCode)].lastUpdateRequest &&
      parsedSkillStatus.interactionModel[this.languageMapping(countryCode)].lastUpdateRequest.status
    ) {
      return parsedSkillStatus.interactionModel[this.languageMapping(countryCode)].lastUpdateRequest.status;
    }
    return "ERROR";
  }

  /**
   * Print the current build status to the console
   * @param countryCode country code as a string like 'de' or 'en'
   */
  private logModelBuildStatus(countryCode: string) {
    // tslint:disable-next-line:no-console
    console.log(`Amazon model training for ${this.languageMapping(countryCode)}: ${this.status(countryCode)}`);
  }

  /**
   *  Wait until the status of the model upload is in state IN_PROGRESS
   * @param countryCode Country code like de or en
   */
  private async whileModelTrainingIsInProgress(countryCode: string) {
    const startTime: number = Date.now();

    const untilStateInProgress = await new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        const state = this.status(countryCode);

        if (state !== "IN_PROGRESS") {
          this.logModelBuildStatus(countryCode);
          // Clear setInterval and reduce memory use
          clearInterval(interval);
          // Resolve Promise because status is out of state IN_PROGRESS
          resolve();
        }

        this.checkTimeout(startTime, interval, reject);
      }, 1000);
    });

    return untilStateInProgress;
  }

  /**
   * Check if the setInterval runs in a timeout, stop the interval and reject the Promise
   * @param startTime Timestamp of when the model training has been started
   * @param interval Reference to the setInterval instance
   * @param reject Promise reject callback
   */
  private checkTimeout(startTime: number, interval: NodeJS.Timeout, reject: (reason: string) => void) {
    // If a timeout of 2 minutes will reach, the Promise will be rejected and the interval will be cleared
    if (Date.now() - startTime > 120000) {
      clearInterval(interval);
      // tslint:disable-next-line:no-console
      console.log("Model training runs in a timeout exception.");
      reject("Model training runs in a timeout exception.");
    }
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
      // tslint:disable-next-line:no-console
      console.error("##############################################################################################");
      // tslint:disable-next-line:no-console
      console.error(
        `The ask-cli is currently not installed. Please install it using 'npm i -g ask-cli'.\n After installation you have to run the command 'ask init' and login to the developer console with your \namazon developer account.`
      );
      // tslint:disable-next-line:no-console
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

  /**
   * Export the current skill configuration as a JSON file in the build directory.
   * This skill schema includes all global configured skill settings like used languages or the fulfilment URL.
   * @param buildPath Path to the current build folder like 'builds/1550067893551'
   */
  private exportCurrentSkillSchema(buildPath: string) {
    /**
     * Get the current skill configuration.
     */
    const currentSkillSchema = execSync(`ask api get-skill -s ${this.componentMeta.configuration.applicationID}`).toString();

    fs.mkdirSync(`${buildPath}/deployments/`);
    fs.mkdirSync(`${buildPath}/deployments/alexa/`);
    fs.writeFileSync(`${buildPath}/deployments/alexa/skill-backup.json`, currentSkillSchema);
  }

  /**
   * Get the current alexa skill schema from disk.
   * This skill schema includes all global configured skill settings like used languages or the fulfilment URL.
   * @param buildPath Path to the current build folder like 'builds/1550067893551'
   * @returns skill schema as @type {AlexaSkillSchema}
   */
  private getCurrentSkillSchema(buildPath: string) {
    if (!fs.existsSync(path.join(buildPath, "deployments", "alexa", "skill-backup.json"))) {
      this.exportCurrentSkillSchema(buildPath);
    }
    const alexaSkillSchema: AlexaSkillSchema = JSON.parse(fs.readFileSync(path.join(buildPath, "deployments", "alexa", "skill-backup.json")).toString());
    return alexaSkillSchema;
  }

  /**
   * Generates the locales skill schema for the given country codes
   * This skill schema includes all global configured skill settings like used languages or the fulfilment URL.
   * @param skillSchema @type {AlexaSkillSchema} witch should be updated
   * @param countryCodes Array of country codes like ["de", "en"]
   * @returns locales schema @type {AlexaSkillSchema["manifest"]["publishingInformation"]["locales"]}
   */
  private generateLocalesDefinition(skillSchema: AlexaSkillSchema, countryCodes: string[]) {
    const configuredLocales = Object.keys(skillSchema.manifest.publishingInformation.locales);
    let localesDefinitions;

    if (JSON.stringify(configuredLocales.sort()) !== JSON.stringify(countryCodes.map(countryCode => this.languageMapping(countryCode)).sort())) {
      // tslint:disable-next-line:no-console
      console.log("Skill schema will be updated because the language definitions are incorrect. Missing languages.");

      /**
       * Creates the locales definition schema. It creates an Object with all given languages and there invocation name.
       * Currently AssistantJS will not support multi lingual invocation names so it's always the same name.
       */
      localesDefinitions = countryCodes
        .map(countryCode => {
          return {
            [this.languageMapping(countryCode)]: {
              name: this.componentMeta.configuration.invocationName,
            },
          };
        })
        .reduce((previousValue, currentValue) => ({ ...previousValue, ...currentValue }), {});
    }
    return localesDefinitions;
  }

  /**
   * Update the alexa skill schema.
   * This skill schema includes all global configured skill settings like used languages or the fulfilment URL.
   * @param buildPath Path to the current build folder like 'builds/1550067893551'
   * @param countryCodes Array of country codes like ["de", "en"]
   * @param skillSchema @type {AlexaSkillSchema} witch should be updated
   */
  private async updateSkillSchema(buildPath: string, countryCodes: string[], skillSchema: AlexaSkillSchema) {
    fs.writeFileSync(path.join(buildPath, "deployments", "alexa", "skill.json"), JSON.stringify(skillSchema, null, 2));

    const updateSkillResult = execSync(
      `ask api update-skill -s ${this.componentMeta.configuration.applicationID} -f ${path.join(buildPath, "deployments", "alexa", "skill.json")}`
    );
    // tslint:disable-next-line:no-console
    console.log("##############################################################################################");
    // tslint:disable-next-line:no-console
    console.log(updateSkillResult.toString());
    // tslint:disable-next-line:no-console
    console.log("##############################################################################################");

    await Promise.all(countryCodes.map(countryCode => this.whileModelTrainingIsInProgress(countryCode)));
  }

  /**
   * Deploy the skill schema if the current configured languages will not be match with the 'alexa developer console' configuration.
   * This skill schema includes all global configured skill settings like used languages or the fulfilment URL.
   * @param buildPath Path to the current build folder like 'builds/1550067893551'
   * @param countryCodes Array of country codes like ["de", "en"]
   */
  private async deploySkillSchema(buildPath: string, countryCodes: string[]) {
    /**
     * Get the current skill configuration.
     */
    const currentSkillSchema = this.getCurrentSkillSchema(buildPath);

    /**
     * Generates a new locales schema from the given country codes
     */
    const localesDefinitions = this.generateLocalesDefinition(currentSkillSchema, countryCodes);

    /**
     * If new locales will be given, we have to update the skill with all configured locales.
     */
    if (localesDefinitions) {
      /**
       * Reset the configured locales in the 'alexa developer console'.
       * Only languages witch will configured in the voice application should be deployed.
       * Models from non configured languages will be deleted!!!
       */
      currentSkillSchema.manifest.publishingInformation.locales = localesDefinitions;

      await this.updateSkillSchema(buildPath, countryCodes, currentSkillSchema);
    }
  }
  /**
   * Alexa needs the locales in a LCID Format. Currently we use the country code for indicating the language.
   * This mapping function allows you to get the LCID Code for the country codes: de or en.
   * If an unknown country code will be given, these will not be mapped and the given country code will be returned.
   * @param countryCode country code as a string like de or en
   * @returns LCID Code or country code as a string
   */
  private languageMapping(countryCode) {
    const countryCodeLanguageMapping = { de: "de-DE", en: "en-GB" };
    return countryCodeLanguageMapping[countryCode] || countryCode;
  }
}
