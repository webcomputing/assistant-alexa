import { GenericIntent, PlatformGenerator } from "assistant-source";
import * as fs from "fs";
import { inject, injectable } from "inversify";
import { Component } from "inversify-components";
import { genericIntentToAmazon } from "./intent-dict";
import { Configuration } from "./private-interfaces";


@injectable()
export class AlexaGenerator implements PlatformGenerator.Extension {
  @inject("meta:component//alexa") private component: Component<Configuration.Runtime>;

  execute(
    language: string,
    buildDir: string,
    intentConfigurations: PlatformGenerator.IntentConfiguration[],
    parameterMapping: PlatformGenerator.EntityMapping
  ) {
    let currentBuildDir = buildDir + "/alexa";

    console.log("================= PROCESSING ON ALEXA =================");
    console.log("Intents: #" + intentConfigurations.length + ", language: " + language);

    console.log("validating...");
    let convertedIntents = this.prepareConfiguration(intentConfigurations);

    console.log("building intent schema...");
    let intentSchema = this.buildIntentSchema(convertedIntents, parameterMapping);

    console.log("building utterances...");
    let utterances = this.buildUtterances(convertedIntents);

    console.log("creating build directory: " + currentBuildDir);
    fs.mkdirSync(currentBuildDir);

    console.log("writing to files...");
    fs.writeFileSync(currentBuildDir + "/schema.json", JSON.stringify(intentSchema, null, 2));
    fs.writeFileSync(currentBuildDir + "/utterances.txt", utterances.join("\n"));

    console.log("=================      FINISHED.      =================");
  }

  /** Returns Intent Schema for Amazon Alexa Config
   * @param preparedIntentConfiguration: Result of prepareConfiguration()
   */
  buildIntentSchema(preparedIntentConfiguration: PreparedIntentConfiguration[], parameterMapping: PlatformGenerator.EntityMapping) {
    return {
      intents: preparedIntentConfiguration.map(config => {
        let slots = this.makeSlots(config.entities, parameterMapping);
        return {
          intent: config.intent,
          slots: slots.length === 0 ? undefined : slots,
        };
      }),
    };
  }

  /** Returns utterances for Amazon Alexa Config
   * @param preparedIntentConfiguration: Result of prepareConfiguration()
   */
  buildUtterances(preparedIntentConfiguration: PreparedIntentConfiguration[]) {
    // Initialize resultset and prepare input
    let result: string[] = [];
    preparedIntentConfiguration = preparedIntentConfiguration.filter(config => typeof config.utterances !== "undefined" && config.utterances.length > 0);

    // Get length of max intent name, for a nice viewing in editor
    let maxIntentLength = Math.max(...preparedIntentConfiguration.map(config => config.intent.length));

    // Prepare amazon utterance format
    preparedIntentConfiguration.forEach(config => {
      let currentSpace = maxIntentLength - config.intent.length + 1;
      config.utterances.forEach(utterance => {
        result.push(config.intent + Array(currentSpace).join(" ") + " " + utterance);
      });
    });

    return result;
  }

  /** Returns BuildIntentConfiguration[] but with all unspeakable intents filtered out, and all other GenericIntents converted to amazon specific strings */
  prepareConfiguration(intentConfigurations: PlatformGenerator.IntentConfiguration[]): PreparedIntentConfiguration[] {
    // Leave out unspeakable intents
    let withoutUnspeakable = intentConfigurations.filter(config => typeof config.intent === "string" || GenericIntent.isSpeakable(config.intent));

    // Leave out all non-platform intents without utterances, but tell user about this
    let withoutUndefinedUtterances: PlatformGenerator.IntentConfiguration[] = [];
    withoutUnspeakable.forEach(config => {
      if (typeof config.intent === "string" && (typeof config.utterances === "undefined" || config.utterances.length === 0)) {
        console.warn("You did not specify any utterances for intent: '" + config.intent + "'. Omitting..");
      } else {
        // Clear utterances of platform intents
        if (typeof config.intent !== "string") config.utterances = [];

        withoutUndefinedUtterances.push(config);
      }
    });

    // Create prepared set, without platform intents anymore
    let preparedSet = withoutUndefinedUtterances
      .map(config => {
        return Object.assign(config, { intent: typeof config.intent === "string" ? config.intent : genericIntentToAmazon[config.intent] });
      })
      .filter(config => typeof config.intent === "string");

    // Check if all intents are still present, even after filtering
    if (preparedSet.length !== withoutUndefinedUtterances.length)
      console.warn(
        "Could not convert all intents, missing " +
          (withoutUndefinedUtterances.length - preparedSet.length) +
          " intents. " +
          "Possibly some platform intents are not implemented into the alexa platform yet. Omitting them."
      );

    return preparedSet;
  }

  private makeSlots(parameters: string[], parameterMapping: PlatformGenerator.EntityMapping): { name: string; type: string }[] {
    return parameters.map(name => {
      let config = this.component.configuration;

      if (typeof config.entities === "undefined" || typeof config.entities[parameterMapping[name]] === "undefined")
        throw Error("Missing amazon configured type for parameter '" + name + "'");

      return { name: name, type: config.entities[parameterMapping[name]] };
    });
  }
}

export interface PreparedIntentConfiguration extends PlatformGenerator.IntentConfiguration {
  intent: string;
}
