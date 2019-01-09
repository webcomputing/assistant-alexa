// tslint:disable:no-console
import { GenericIntent, PlatformGenerator } from "assistant-source";
import * as fs from "fs";
import { inject, injectable } from "inversify";
import { Component } from "inversify-components";
import { genericIntentToAmazon } from "./intent-dict";
import { Configuration } from "./private-interfaces";

@injectable()
export class AlexaGenerator implements PlatformGenerator.Extension {
  constructor(@inject("meta:component//alexa") private component: Component<Configuration.Runtime>) {}

  public execute(
    language: string,
    buildDir: string,
    intentConfigurations: PlatformGenerator.IntentConfiguration[],
    entityMapping: PlatformGenerator.EntityMapping,
    customEntityMapping: PlatformGenerator.CustomEntityMapping
  ) {
    const currentBuildDir = buildDir + "/alexa";

    console.log("================= PROCESSING ON ALEXA =================");
    console.log("Intents: #" + intentConfigurations.length + ", language: " + language);

    console.log("validating...");
    const convertedIntents = this.prepareConfiguration(intentConfigurations);

    console.log("building entities (" + Object.keys(customEntityMapping).length + ")...");
    const customEntities = this.buildCustomEntities(customEntityMapping);

    console.log("building intent schema...");
    const intentSchema = this.buildIntentSchema(convertedIntents, entityMapping, customEntityMapping);
    const fullSchema = this.buildFullSchema(intentSchema, customEntities);

    console.log("creating build directory: " + currentBuildDir);
    fs.mkdirSync(currentBuildDir);

    console.log("writing to files...");
    fs.writeFileSync(currentBuildDir + "/schema.json", JSON.stringify(fullSchema, null, 2));

    console.log("=================      FINISHED.      =================");
  }

  /**
   * Returns an entity schema for Alexa Config
   * @param customEntityMapping
   */
  private buildCustomEntities(customEntityMapping: PlatformGenerator.CustomEntityMapping): TypeSchema[] {
    const config = this.component.configuration;
    const slotTypes: TypeSchema[] = [];

    Object.keys(customEntityMapping).map(type => {
      if (typeof config.entities[type] === "undefined") {
        // Return Custom Slot Type
        slotTypes.push({
          name: type,
          values: customEntityMapping[type].map(valuePair => {
            return { name: valuePair };
          }),
        });
      } else {
        // Extend a Built-in Slot Type with Additional Values
        slotTypes.push({
          name: config.entities[type],
          values: customEntityMapping[type].map(valuePair => {
            return { name: { value: valuePair.value } };
          }),
        });
      }
    });
    return slotTypes;
  }

  /**
   * Returns Intent Schema for Amazon Alexa Config
   * @param preparedIntentConfiguration: Result of prepareConfiguration()
   */
  private buildIntentSchema(
    preparedIntentConfiguration: PreparedIntentConfiguration[],
    parameterMapping: PlatformGenerator.EntityMapping,
    customEntityMapping: PlatformGenerator.CustomEntityMapping
  ): IntentSchema[] {
    return preparedIntentConfiguration.map(config => {
      const slots = this.makeSlots(config.entities, parameterMapping, customEntityMapping);
      return {
        name: config.intent,
        slots: slots.length === 0 ? [] : slots,
        samples: [
          ...new Set(
            config.utterances.map(utterance => {
              return utterance.replace(/\{\{(.*?)\}\}/g, (match, value) => {
                return `{${value.split("|").pop()}}`;
              });
            })
          ),
        ],
      };
    });
  }

  /** Builds full schema out of given intent schemas */
  private buildFullSchema(intentSchema: IntentSchema[], typeSchema: TypeSchema[]): FullAlexaSchema {
    let invocationName: string = this.component.configuration.invocationName;
    /** Validate invocationName characters */
    if (!invocationName.match(/^[a-z][a-z\s\.']*$/)) {
      invocationName = "setup-your-invocation-name-in-config";
      console.warn("Invocation name must start with a letter and can only contain lower case letters, spaces, apostrophes, and periods. Omitting..");
    }

    return {
      interactionModel: {
        languageModel: {
          invocationName,
          intents: intentSchema,
          types: typeSchema,
        },
      },
    };
  }

  /** Returns BuildIntentConfiguration[] but with all unspeakable intents filtered out, and all other GenericIntents converted to amazon specific strings */
  private prepareConfiguration(intentConfigurations: PlatformGenerator.IntentConfiguration[]): PreparedIntentConfiguration[] {
    // Leave out unspeakable intents
    const withoutUnspeakable = intentConfigurations.filter(config => typeof config.intent === "string" || GenericIntent.isSpeakable(config.intent));
    // Leave out all non-platform intents without utterances, but tell user about this
    const withoutUndefinedUtterances: PlatformGenerator.IntentConfiguration[] = [];
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
    const preparedSet = withoutUndefinedUtterances
      .map(config => {
        return { ...config, intent: typeof config.intent === "string" ? config.intent : genericIntentToAmazon[config.intent] };
      })
      .filter(config => typeof config.intent === "string");

    // Check if all intents are still present, even after filtering
    if (preparedSet.length !== withoutUndefinedUtterances.length) {
      console.warn(
        "Could not convert all intents, missing " +
          (withoutUndefinedUtterances.length - preparedSet.length) +
          " intents. " +
          "Possibly some platform intents are not implemented into the alexa platform yet. Omitting them."
      );
    }

    return preparedSet;
  }

  private makeSlots(
    parameters: string[],
    parameterMapping: PlatformGenerator.EntityMapping,
    customEntityMapping: PlatformGenerator.CustomEntityMapping
  ): Array<{ name: string; type: string }> {
    return parameters.map(name => {
      const config = this.component.configuration;

      // Return custom data type
      if (typeof customEntityMapping[parameterMapping[name]] !== "undefined" && typeof config.entities[parameterMapping[name]] === "undefined") {
        return { name, type: parameterMapping[name] };
      }

      if (typeof config.entities === "undefined" || typeof config.entities[parameterMapping[name]] === "undefined") {
        throw Error("Missing amazon configured type for parameter '" + name + "'");
      }

      return { name, type: config.entities[parameterMapping[name]] };
    });
  }
}

export interface PreparedIntentConfiguration extends PlatformGenerator.IntentConfiguration {
  intent: string;
}

export interface IntentSchema {
  name: string;
  slots: Array<{ name: string; type: string }>;
  samples: string[];
}

export interface FullAlexaSchema {
  interactionModel: {
    languageModel: {
      invocationName: string;
      intents: IntentSchema[];
      types: TypeSchema[];
    };
  };
}

export interface TypeSchema {
  name: string;
  values: TypeValueSchema[];
}

export interface TypeValueSchema {
  id?: string;
  name: {
    value: string;
    synonyms?: string[];
  };
}
