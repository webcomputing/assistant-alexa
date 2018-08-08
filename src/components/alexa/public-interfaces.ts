import * as askInterfaces from "ask-sdk-model";
import { BasicAnswerTypes, BasicHandable, MinimalRequestExtraction, OptionalExtractions, OptionallyPromise, RequestContext } from "assistant-source";
import { Configuration } from "./private-interfaces";

/** Configuration of alexa component */
export interface AlexaConfiguration extends Partial<Configuration.Defaults>, Configuration.Required {}

/** Property describing the configuration of the alexa component */
export interface AlexaConfigurationAttribute {
  alexa: AlexaConfiguration;
}

export interface ExtractionInterface
  extends MinimalRequestExtraction,
    OptionalExtractions.SessionData,
    OptionalExtractions.TemporalAuth,
    OptionalExtractions.Timestamp,
    OptionalExtractions.OAuth {}

/**
 * All types and interfaces for subtypes, so that some properties are not necessary to set
 */
export namespace AlexaSubtypes {
  export namespace SubtypeProperties {
    /**
     * All necessary Properties of a ListTemplate
     */
    export type ListProperties = "token" | "backButton" | "backgroundImage" | "title" | "listItems";

    /**
     * Minimal Properties of BodyTemplates
     */
    export type BodyDefaultProperties = "token" | "backButton" | "backgroundImage";

    /**
     * Property when BodyTemplate supports Image
     */
    export type BodyImageProperty = "image";

    /**
     * Property when BodyTemplate supports Title
     */
    export type BodyTitleProperty = "title";

    /**
     * Property when BodyTemplate supports TextContent
     */
    export type BodyTextContentProperty = "textContent";
  }

  export type ListTemplate1 = Pick<askInterfaces.interfaces.display.ListTemplate1, SubtypeProperties.ListProperties>;

  export type ListTemplate2 = Pick<askInterfaces.interfaces.display.ListTemplate2, SubtypeProperties.ListProperties>;

  export type BodyTemplate1 = Pick<
    askInterfaces.interfaces.display.BodyTemplate1,
    SubtypeProperties.BodyDefaultProperties | SubtypeProperties.BodyTextContentProperty | SubtypeProperties.BodyTitleProperty
  >;

  export type BodyTemplate2 = Pick<
    askInterfaces.interfaces.display.BodyTemplate2,
    | SubtypeProperties.BodyDefaultProperties
    | SubtypeProperties.BodyTextContentProperty
    | SubtypeProperties.BodyImageProperty
    | SubtypeProperties.BodyTitleProperty
  >;

  export type BodyTemplate3 = Pick<
    askInterfaces.interfaces.display.BodyTemplate3,
    | SubtypeProperties.BodyDefaultProperties
    | SubtypeProperties.BodyTextContentProperty
    | SubtypeProperties.BodyImageProperty
    | SubtypeProperties.BodyTitleProperty
  >;

  export type BodyTemplate6 = Pick<
    askInterfaces.interfaces.display.BodyTemplate6,
    SubtypeProperties.BodyDefaultProperties | SubtypeProperties.BodyTextContentProperty | SubtypeProperties.BodyImageProperty
  >;

  export type BodyTemplate7 = Pick<
    askInterfaces.interfaces.display.BodyTemplate7,
    SubtypeProperties.BodyDefaultProperties | SubtypeProperties.BodyTitleProperty | SubtypeProperties.BodyImageProperty
  >;
}

/**
 * Add custom types here
 */
export interface AlexaSpecificTypes extends BasicAnswerTypes {
  card: BasicAnswerTypes["card"] & {
    smallCardImage?: string;
  };

  /**
   * allows to set all derectives at once, this will overwrite all other directives
   */
  customDirectives: askInterfaces.Directive[];

  /**
   * Alexa Hint
   */
  alexaHint: askInterfaces.interfaces.display.PlainTextHint;

  /**
   * Only one Template can be set
   */
  alexaTemplate: askInterfaces.interfaces.display.Template;
}

/**
 * Add custom methods for Alexa
 *
 * some of the descriptions for the Methods are from https://developer.amazon.com/blogs/alexa/post/05a2ea89-2118-4dcb-a8df-af3d8ac623a8/building-for-echo-show-and-echo-spot-vui-gui-best-practices
 */
export interface AlexaSpecificHandable<MergedAnswerTypes extends AlexaSpecificTypes> extends BasicHandable<MergedAnswerTypes> {
  /**
   * sets any Directive Alexa supports, overwrites any other directives, wich are set via the other methods, like ListTemplate1
   * @param customDirectives
   */
  setAlexaCustomDirectives(customDirectives: OptionallyPromise<MergedAnswerTypes["customDirectives"]>): this;

  /**
   * Add hint directive to Response
   * A Hint directive requires that a display template, other than BodyTemplate3 or ListTemplate1, is also be included.
   * @param hint string without ssml to show as Hint
   */
  setAlexaHint(hint: OptionallyPromise<string>): this;

  /**
   * List Template 1 should be used for lists where images are not the primary content because the content will be relatively small on Echo Spot.
   *
   * Be aware that you can set only one Template, the last set template will be used for the response.
   * @param template
   */
  setAlexaListTemplate1(template: OptionallyPromise<AlexaSubtypes.ListTemplate1>): this;

  /**
   * List template 2 should be used for lists where images are the primary content. Note that for Echo Spot, only one item will be visible at a time.
   *
   * Be aware that you can set only one Template, the last set template will be used for the response.
   * @param template
   */
  setAlexaListTemplate2(template: OptionallyPromise<AlexaSubtypes.ListTemplate2>): this;

  /**
   * Use this template to present information in long blocks of text.
   *
   * Be aware that you can set only one Template, the last set template will be used for the response.
   * @param template only necessary Objects of
   */
  setAlexaBodyTemplate1(template: OptionallyPromise<AlexaSubtypes.BodyTemplate1>): this;

  /**
   * Use this template for presenting information on a specific entity with a lot of detail.
   * This screen typically follows selecting an item from a list or if a user’s request yields only one item.
   * Note: Hints can be displayed on Echo Show, but not on Echo Spot.
   *
   * Be aware that you can set only one Template, the last set template will be used for the response.
   * @param template
   */
  setAlexaBodyTemplate2(template: OptionallyPromise<AlexaSubtypes.BodyTemplate2>): this;

  /**
   * Use this template for presenting information on a specific entity with a lot of detail.
   * This screen typically follows selecting an item from a list or if a user’s request yields only one item.
   * Note: Hints can be displayed on Echo Show, but not on Echo Spot.
   *
   * Be aware that you can set only one Template, the last set template will be used for the response.
   * @param template
   */
  setAlexaBodyTemplate3(template: OptionallyPromise<AlexaSubtypes.BodyTemplate3>): this;

  /**
   * This template is used as an introductory, title, or header screen.
   *
   * Be aware that you can set only one Template, the last set template will be used for the response.
   * @param template
   */
  setAlexaBodyTemplate6(template: OptionallyPromise<AlexaSubtypes.BodyTemplate6>): this;

  /**
   * Use this template to display a full-width foreground image.
   *
   * Be aware that you can set only one Template, the last set template will be used for the response.
   * @param template
   */
  setAlexaBodyTemplate7(template: OptionallyPromise<AlexaSubtypes.BodyTemplate7>): this;
}

export interface AlexaRequestContext extends RequestContext {
  body: askInterfaces.RequestEnvelope;
}

export { askInterfaces };

/**
 * Conndition based Subtype
 * source: https://medium.com/dailyjs/typescript-create-a-condition-based-subset-types-9d902cea5b8c
 */
export type SubType<Base, Condition> = Pick<Base, { [Key in keyof Base]: Base[Key] extends Condition ? Key : never }[keyof Base]>;
