import { GenericIntent } from "assistant-source";

// Taken from: http://stackoverflow.com/questions/23013573/swap-key-with-value-json
const swap = function(json) {
  const ret = {};
  // tslint:disable-next-line:forin
  for (const key in json) {
    ret[json[key]] = key;
  }
  return ret;
};

export const amazonToGenericIntent: { [name: string]: GenericIntent } = {
  "AMAZON.YesIntent": GenericIntent.Yes,
  "AMAZON.NoIntent": GenericIntent.No,
  "AMAZON.HelpIntent": GenericIntent.Help,
  "AMAZON.CancelIntent": GenericIntent.Cancel,
  "AMAZON.StopIntent": GenericIntent.Stop,
};

export const genericIntentToAmazon: { [intent: number]: string } = swap(amazonToGenericIntent);
