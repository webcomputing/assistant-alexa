/** Taken from https://github.com/ibgib/askGib/blob/master/src/alexa-skills-kit.ts, thanks! */

/**
 * Alexa Skills Kit TypeScript definitions built from
 * [Alexa Skills Kit Interface Reference](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-interface-reference).
 *
 * Date: 2016/04/01
 */

"use strict";

/**
 * The request body sent to your service is in JSON format.
 * @example
    {
    "version": "string",
    "session": {
        "new": boolean,
        "sessionId": "string",
        "application": {
        "applicationId": "string"
        },
        "attributes": {
        "string": object
        },
        "user": {
        "userId": "string",
        "accessToken": "string"
        }
    },
    "request": object
    }
 */
export interface RequestBody {
  /** The version specifier for the request with the value defined as: “1.0” */
  version: string;
  /** The session object provides additional context associated with the request. */
  session: Session;
  /** An object that is composed of associated parameters that further describes the user’s request. */
  request: AlexaRequest;
}

/**
 * Session Object
 */
export interface Session {
  /** A boolean value indicating whether this is a new session. Returns true for a new session or false for an existing session. */
  new: boolean;
  /** A string that represents a unique identifier per a user’s active session. Note: A sessionId is consistent for multiple subsequent requests for a user and session. If the session ends for a user, then a new unique sessionId value is provided for subsequent requests for the same user. */
  sessionId: string;
  /** A map of key-value pairs. The attributes map is empty for requests where a new session has started with the attribute new set to true.
   * The key is a string that represents the name of the attribute. Type: string
   * The value is an object that represents the value of the attribute. Type: object
   */
  attributes: any;
  /** An object containing an application ID. This is used to verify that the request was intended for your service. */
  application: any;
  /**
   * An object that describes the user making the request.
   * @see User
   */
  user: User;
}

/** User object used in Session */
export interface User {
  /** A string that represents a unique identifier for the user who made the request. The length of this identifier can vary, but is never more than 255 characters. The userId is automatically generated when a user enables the skill in the Alexa app. Note that disabling and re-enabling a skill generates a new identifier. */
  userId: string;
  /** A token identifying the user in another system. This is only provided if the user has successfully linked their account. See [Linking an Alexa User with a User in Your System](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/linking-an-alexa-user-with-a-user-in-your-system) for more details. */
  accessToken?: any;
}

/**
 * Request made to an Alexa skill. This is an "abstract base class" interface.
 *
 * Called "AlexaRequest" instead of just Request to show that this is not the "request" object per se, but specific to the Alexa domain.
 */
export interface AlexaRequest {
  /**
   * Type of concrete request.
   * @see RequestType
   * */
  type: RequestType;
  /** Represents the unique identifier for the specific request. */
  requestId: string;
  /** Provides the date and time when Alexa sent the request. Use this to verify that the request is current and not part of a “replay” attack. Timestamp is provided as an ISO 8601 formatted string (for example, 2015-05-13T12:34:56Z). */
  timestamp: string;
  locale: string;
}

/** String literal with possible values. Used in place of an enum to allow string type. */
export type RequestType = "LaunchRequest" | "IntentRequest" | "SessionEndedRequest";
export const RequestType = {
  LaunchRequest: "LaunchRequest" as RequestType,
  IntentRequest: "IntentRequest" as RequestType,
  SessionEndedRequest: "SessionEndedRequest" as RequestType,
};

/** Represents that a user made a request to an Alexa skill, but did not provide a specific intent. */
export interface LaunchRequest extends AlexaRequest {
  // Adds nothing
}

/** Request made to a skill based on what the user wants to do. */
export interface IntentRequest extends AlexaRequest {
  /**
   * An object that represents what the user wants.
   * @see Intent
   * */
  intent: Intent;
}

/** Represents an intent from a user. */
export interface Intent {
  /** A string representing the name of the intent. */
  name: string;
  /** A map of key-value pairs that further describes what the user meant based on a predefined intent schema. The map can be empty.
   * The key is a string that describes the name of the slot. Type: string.
   * The value is an object of type slot. Type: object.
   * @see Slot */
  slots: { [slotName: string]: Slot };
}

/**
 * Part of intent.
 * @see Intent.
 */
export interface Slot {
  /** A string that represents the name of the slot. */
  name: string;
  /** A string that represents the value of the slot. The value is not required.
   * Note that AMAZON.LITERAL slot values sent to your service are always in all lower case. */
  value?: string;
}

/** A SessionEndedRequest is an object that represents a request made to an Alexa skill to notify that a session was ended. */
export interface SessionEndedRequest {
  /**
   * Describes why the session ended. Possible values:
   *   USER_INITIATED: The user explicitly ended the session.
   *   ERROR: An error occurred that caused the session to end.
   *   EXCEEDED_MAX_REPROMPTS: The user either did not respond or responded with an utterance that did not match any of the intents defined in your voice interface.
   * @see SessionEndedReason
   */
  reason: SessionEndedReason;
}

/** String literal with possible values. Used in place of an enum to allow string type. */
export type SessionEndedReason = "USER_INITIATED" | "ERROR" | "EXCEEDED_MAX_REPROMPTS";
export const SessionEndedReason = {
  USER_INITIATED: "USER_INITIATED" as SessionEndedReason,
  ERROR: "ERROR" as SessionEndedReason,
  EXCEEDED_MAX_REPROMPTS: "EXCEEDED_MAX_REPROMPTS" as SessionEndedReason,
};

/**
 * Response Body Object
 * https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-interface-reference#Response Format
 * @example {
                "version": "string",
                "sessionAttributes": {
                    "string": object
                },
                "response": {
                    "outputSpeech": {
                        "type": "string",
                        "text": "string",
                        "ssml": "string"
                    },
                    "card": {
                        "type": "string",
                        "title": "string",
                        "content": "string",
                        "text": "string",
                        "image": {
                            "smallImageUrl": "string",
                            "largeImageUrl": "string"
                        }
                    },
                    "reprompt": {
                        "outputSpeech": {
                            "type": "string",
                            "text": "string",
                            "ssml": "string"
                        }
                    },
                    "shouldEndSession": boolean
                }
            }
 */
export interface ResponseBody {
  /** The version specifier for the response with the value to be defined as: “1.0” */
  version: string;
  /** A map of key-value pairs to persist in the session.
   * The key is a string that represents the name of the attribute. Type: string.
   * The value is an object that represents the value of the attribute. Type: object. */
  sessionAttributes?: any[];
  /**
   * A response object that defines what to render to the user and whether to end the current session.
   * @see Response
   */
  response: Response;
}

/** https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-interface-reference#response-object */
export interface Response {
  /**
   * The object containing the speech to render to the user.
   * @see OutputSpeech
   */
  outputSpeech?: OutputSpeech;
  /**
   * The object containing a card to render to the Amazon Alexa App.
   * @see Card
   */
  card?: Card;
  /**
   * The object containing the outputSpeech to use if a re-prompt is necessary.
   *
   * This is used if the your service keeps the session open after sending the response, but the user does not respond with anything that maps to an intent defined in your voice interface while the audio stream is open.
   *
   * If this is not set, the user is not re-prompted.
   * @see Reprompt
   */
  reprompt?: Reprompt;
  /** A boolean value with true meaning that the session should end, or false if the session should remain active. */
  shouldEndSession: boolean;
}

/**
 * This object is used for setting both the outputSpeech and the reprompt properties.
 * */
export interface OutputSpeech {
  /**
   * A string containing the type of output speech to render. Valid types are:
   *   "PlainText": Indicates that the output speech is defined as plain text.
   *   "SSML": Indicatesthat the output speech is text marked up with SSML.
   */
  type: OutputSpeechType;
  /** A string containing the speech to render to the user. Use this when type is "PlainText" */
  text?: string;
  /** A string containing text marked up with SSML to render to the user. Use this when type is "SSML" */
  ssml?: string;
}

/** String literal with possible values. Used in place of an enum to allow string type. */
export type OutputSpeechType = "PlainText" | "SSML";
/** String literal with possible values. Used in place of an enum to allow string type. */
export const OutputSpeechType = {
  PlainText: "PlainText" as OutputSpeechType,
  SSML: "SSML" as OutputSpeechType,
};

/** Object describing a card presented to the user in the Alexa app. */
export interface Card {
  /**A string describing the type of card to render. Valid types are:
   * "Simple": A card that contains a title and plain text content.
   * "Standard": A card that contains a title, text content, and an image to display.
   * "LinkAccount": a card that displays a link to an authorization URL that the user can use to link their Alexa account with a user in another system. See Linking an Alexa User with a User in Your System for details. */
  type: CardType;
  /**A string containing the title of the card. (not applicable for cards of type LinkAccount). */
  title?: string;
  /**A string containing the contents of a Simple card (not applicable for cards of type Standard or LinkAccount).
   * Note that you can include line breaks in the content for a card of type Simple. Use either “\r\n” or “\n” within the text of the card to insert line breaks. */
  content?: string;
  /**A string containing the text content for a Standard card (not applicable for cards of type Simple or LinkAccount)
   * Note that you can include line breaks in the text for a Standard card. Use either “\r\n” or “\n” within the text of the card to insert line breaks. */
  text?: string;
  /**
   * An image object that specifies the URLs for the image to display on a Standard card. Only applicable for Standard cards.
   * @see Image
   */
  image?: Image;
}

/** String literal with possible values. Used in place of an enum to allow string type. */
export type CardType = "Simple" | "Standard" | "LinkAccount";
/** String literal with possible values. Used in place of an enum to allow string type. */
export const CardType = {
  Simple: "Simple" as CardType,
  Standard: "Standard" as CardType,
  LinkAccount: "LinkAccount" as CardType,
};

/**
 * Allows to specify small and large urls for images in cards.
 * https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/providing-home-cards-for-the-amazon-alexa-app
 */
export interface Image {
  /** Url for small image. */
  smallImageUrl?: string;
  /** Url for large image. */
  largeImageUrl?: string;
}

/**
 * A prompt that asks the user a question after a dialogue error has occurred. The general purpose of a re-prompt is to help the user recover from errors. Example:

User: “Alexa, open Score Keeper”
Alexa: Score Keeper. What’s your update?
User: (no response)
Alexa: “You can add points for a player, ask for the current score, or start a new game. To hear a list of everything you can do, say Help. Now, what would you like to do?”
 * A re-prompt is usually played to encourage the user to respond.
 */
export interface Reprompt {
  /** An OutputSpeech object containing the text or SSML to render as a re-prompt. */
  outputSpeech?: OutputSpeech;
}

/** From http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html */
export interface Context {
  /** AWS request ID associated with the request. This is the ID returned to the client that called the invoke method.
   * Note: If AWS Lambda retries the invocation (for example, in a situation where the Lambda function that is processing Amazon Kinesis records throws an exception), the request ID remains the same. */
  awsRequestId: string;
  /** Information about the client application and device when invoked through the AWS Mobile SDK. It can be null. Using clientContext, you can get the following information:
   *   clientContext.client.installation_id
   *   clientContext.client.app_title
   *   clientContext.client.app_version_name
   *   clientContext.client.app_version_code
   *   clientContext.client.app_package_name
   *   clientContext.Custom
   * Custom values set by the mobile client application.
   *   clientContext.env.platform_version
   *   clientContext.env.platform
   *   clientContext.env.make
   *   clientContext.env.model
   *   clientContext.env.locale
   * For more information about the exact values for a specific mobile platform, go to Client Context in the AWS Mobile SDK iOS Developer Guide, and Client Context in the AWS Mobile SDK Android Developer Guide. */
  clientContext?: any;
  /** Information about the Amazon Cognito identity provider when invoked through the AWS Mobile SDK. It can be null.
   *   identity.cognito_identity_id
   *   identity.cognito_identity_pool_id
   * For more information about the exact values for a specific mobile platform, go to Identity Context in the AWS Mobile SDK iOS Developer Guide, and Identity Context in the AWS Mobile SDK Android Developer Guide. */
  identity?: any;
  invokeId: string;
  /** The name of the CloudWatch log group where you can find logs written by your Lambda function. */
  logGroupName: string;
  /** The name of the CloudWatch log group where you can find logs written by your Lambda function. The log stream may or may not change for each invocation of the Lambda function.
   *
   * The value is null if your Lambda function is unable to create a log stream, which can happen if the execution role that grants necessary permissions to the Lambda function does not include permissions for the CloudWatch actions. */
  logStreamName: string;
  /** Name of the Lambda function that is executing. */
  functionName: string;
  /** Memory limit, in MB, you configured for the Lambda function. You set the memory limit at the time you create a Lambda function and you can change it later. */
  memoryLimitInMB: number;
  /** The Lambda function version that is executing. If an alias is used to invoke the function, then function_version will be the version the alias points to. */
  functionVersion: string;
  /** The ARN used to invoke this function. It can be function ARN or alias ARN. An unqualified ARN executes the $LATEST version and aliases execute the function version it is pointing to. */
  invokedFunctionArn: string;
  /** Indicates the Lambda function execution and all callbacks completed successfully.
   * @param result is an optional parameter and it can be used to provide the result of the function execution.
   */
  succeed(result?: any): void;
  /** Indicates the Lambda function execution and all callbacks completed unsuccessfully, resulting in a handled exception.
   * @param error is an optional parameter that you can use to provide the result of the Lambda function execution.
   */
  fail(error?: Error): void;
  /** Causes the Lambda function execution to terminate.
   * Note: This method complements the succeed() and fail() methods by allowing the use of the "error first" callback design pattern.  It provides no additional functionality.
   * @param error is an optional parameter that you can use to provide results of the failed Lambda function execution.
   * @param result is an optional parameter that you can use to provide the result of a successful function execution. The result provided must be JSON.stringify compatible. If an error is provided, this parameter is expected to be null. */
  done(error?: Error, result?: any): void;
  /** Returns the approximate remaining execution time (before timeout occurs) of the Lambda function that is currently executing. The timeout is one of the Lambda function configuration. When the timeout reaches, AWS Lambda terminates your Lambda function.
   * You can use this method to check the remaining time during your function execution and take appropriate corrective action at run time.  */
  getRemainingTimeInMillis();
}
