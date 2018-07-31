import * as askInterfaces from "ask-sdk-model";
import { BasicAnswerTypes, BasicHandable, MinimalRequestExtraction, OptionalExtractions, RequestContext } from "assistant-source";
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
 * Property when BoddyTemplate supports Title
 */
export type BodyTitleProperty = "title";

/**
 * Property when BoddyTemplate supports TextContent
 */
export type BodyTextContentProperty = "textContent";

/**
 * Add custom types here
 */
export interface AlexaSpecificTypes extends BasicAnswerTypes {
  /**
   * allows to set all derectives at once, this will overwrite all other directives
   */
  customDirectives: askInterfaces.Directive[];

  /**
   * Alexa Hint
   */
  alexaHint: askInterfaces.interfaces.display.PlainTextHint;

  /**
   * any full template for display
   */
  alexaTemplate: askInterfaces.interfaces.display.Template;

  /**
   * ListTemplate1
   */
  alexaListTemplate1: Pick<askInterfaces.interfaces.display.ListTemplate1, ListProperties>;

  /**
   * ListTemplate2
   */
  alexaListTemplate2: Pick<askInterfaces.interfaces.display.ListTemplate2, ListProperties>;

  /**
   * BodyTemplate1
   */
  alexaBodyTemplate1: Pick<askInterfaces.interfaces.display.BodyTemplate1, BodyDefaultProperties | BodyTextContentProperty | BodyTitleProperty>;

  /**
   * BodyTemplate2
   */
  alexaBodyTemplate2: Pick<
    askInterfaces.interfaces.display.BodyTemplate2,
    BodyDefaultProperties | BodyTextContentProperty | BodyImageProperty | BodyTitleProperty
  >;

  /**
   * BodyTemplate3
   */
  alexaBodyTemplate3: Pick<
    askInterfaces.interfaces.display.BodyTemplate3,
    BodyDefaultProperties | BodyTextContentProperty | BodyImageProperty | BodyTitleProperty
  >;

  /**
   * BodyTemplate6
   */
  alexaBodyTemplate6: Pick<askInterfaces.interfaces.display.BodyTemplate6, BodyDefaultProperties | BodyTextContentProperty | BodyImageProperty>;

  /**
   * BodyTemplate7
   */
  alexaBodyTemplate7: Pick<askInterfaces.interfaces.display.BodyTemplate7, BodyDefaultProperties | BodyTitleProperty | BodyImageProperty>;
}

/**
 * Add custom methods for Alexa
 *
 * some of the descriptions for the Methods are from https://developer.amazon.com/blogs/alexa/post/05a2ea89-2118-4dcb-a8df-af3d8ac623a8/building-for-echo-show-and-echo-spot-vui-gui-best-practices
 */
export interface AlexaSpecificHandable<CustomTypes extends AlexaSpecificTypes> extends BasicHandable<CustomTypes> {
  /**
   * sets any Directive Alexa supports, overwrites any other directives, wich are set via the other methods, like ListTemplate1
   * @param customDirectives
   */
  setAlexaCustomDirectives(customDirectives: CustomTypes["customDirectives"] | Promise<CustomTypes["customDirectives"]>): this;

  /**
   * Add hint directive to Response
   * A Hint directive requires that a display template, other than BodyTemplate3 or ListTemplate1, is also be included.
   * @param hint string without ssml to show as Hint
   */
  setAlexaHint(hint: string | Promise<string>): this;

  /**
   * List Template 1 should be used for lists where images are not the primary content because the content will be relatively small on Echo Spot.
   * @param template
   */
  setAlexaListTemplate1(template: CustomTypes["alexaTemplate"] | Promise<CustomTypes["alexaTemplate"]>): this;

  /**
   * List template 2 should be used for lists where images are the primary content. Note that for Echo Spot, only one item will be visible at a time.
   * @param template
   */
  setAlexaListTemplate2(template: CustomTypes["alexaListTemplate1"] | Promise<CustomTypes["alexaListTemplate1"]>): this;

  /**
   * Use this template to present information in long blocks of text.
   * @param template only necessary Objects of
   */
  setAlexaBodyTemplate1(template: CustomTypes["alexaBodyTemplate1"] | Promise<CustomTypes["alexaBodyTemplate1"]>): this;

  /**
   * Use this template for presenting information on a specific entity with a lot of detail.
   * This screen typically follows selecting an item from a list or if a user’s request yields only one item.
   * Note: Hints can be displayed on Echo Show, but not on Echo Spot.
   * @param template
   */
  setAlexaBodyTemplate2(template: CustomTypes["alexaBodyTemplate2"] | Promise<CustomTypes["alexaBodyTemplate2"]>): this;

  /**
   * Use this template for presenting information on a specific entity with a lot of detail.
   * This screen typically follows selecting an item from a list or if a user’s request yields only one item.
   * Note: Hints can be displayed on Echo Show, but not on Echo Spot.
   * @param template
   */
  setAlexaBodyTemplate3(template: CustomTypes["alexaBodyTemplate3"] | Promise<CustomTypes["alexaBodyTemplate3"]>): this;

  /**
   * This template is used as an introductory, title, or header screen.
   * @param template
   */
  setAlexaBodyTemplate6(template: CustomTypes["alexaBodyTemplate6"] | Promise<CustomTypes["alexaBodyTemplate6"]>): this;

  /**
   * Use this template to display a full-width foreground image.
   * @param template
   */
  setAlexaBodyTemplate7(template: CustomTypes["alexaBodyTemplate7"] | Promise<CustomTypes["alexaBodyTemplate7"]>): this;
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
