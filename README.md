## assistant-alexa

This package integrates Amazon Alexa into [AssistantJS][1]. Just install it with `npm install assistant-alexa --save` and add it as an dependency to your `index.ts`:

```typescript
import { descriptor as alexaDescriptor } from "assistant-alexa";

/** and below, in your "initializeSetups" method: */
assistantJs.registerComponent(alexaDescriptor);
```

This component also integrates a generator into AssistantJS. So executing `assistant g` creates an alexa-specific build in your `builds` directory.

### Configuration

Possible configuration options, as listed in our [interfaces](src/components/alexa/private-interfaces.ts):

```typescript
/** Optional configuration settings */
export interface Defaults {
  /** Route of alexa requests. Defaults to "/alexa". */
  route?: string;

  /** Mapping of slot values. Use your AssistantJS slot type as key and your alexa slot type as value. */
  entities?: { [name: string]: string };

  /** If set to false, we will not use alexa-verifier to test valid requests. Using false might be useful for alexa simulator. Defaults to true. */
  useVerifier?: boolean;
}

/** Required configuration settings */
export interface Required {
  /** Your amazon alexa application id */
  applicationID: string;

  /** Your skill's invocation name to begin an interaction with */
  invocationName: string;
}
```

As you can see, you need to configure your amazon alexa `applicationID` in order to use assistant-alexa. To do so, merge our `AlexaConfigurationAttribute` interface with your existing AssistantJS configuration in `config/components.ts`.

#### Debugging OAuth

If you start your AssistantJS server with `FORCED_ALEXA_OAUTH_TOKEN="mytoken"`, all alexa requests will return "mytoken" as OAuth token.
That way, you can test or demo your skill without having a full OAuth setup in place.


#### Deployment

With the command `assistant deploy` you will be able to upload your generated Skill configuration to your configured Alexa agent.
For this process we use the Alexa own CLI interface `ask-cli`. You need to install this package before you can use the `assistant deploy` command.

We recommend you to use at leased the version 1.6.2 of the ask-cli package. You can install it using npm by the command `npm i -g ask-cli`.

After you have installed ask-cli you have to run `ask init` and link you alexa account. Proper information about the ASK CLI you can find on the [official documentation](https://developer.amazon.com/de/docs/smapi/quick-start-alexa-skills-kit-command-line-interface.html).


[1]: http://assistantjs.org
