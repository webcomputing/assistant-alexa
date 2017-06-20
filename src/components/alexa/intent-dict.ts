import { unifierInterfaces } from "assistant-source";

// Taken from: http://stackoverflow.com/questions/23013573/swap-key-with-value-json
let swap = function(json) {
  let ret = {};
  for (let key in json) {
    ret[json[key]] = key;
  }
  return ret;
};

export const amazonToGenericIntent: {[name: string]: unifierInterfaces.GenericIntent} = {
  "AMAZON.YesIntent": unifierInterfaces.GenericIntent.Yes,
  "AMAZON.NoIntent": unifierInterfaces.GenericIntent.No,
  "AMAZON.HelpIntent": unifierInterfaces.GenericIntent.Help,
  "AMAZON.CancelIntent": unifierInterfaces.GenericIntent.Cancel
};

export const genericIntentToAmazon: {[intent: number]: string} = swap(amazonToGenericIntent);