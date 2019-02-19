import { AlexaSubtypes, askInterfaces } from "../../../src/assistant-alexa";

export const listTemplate1: AlexaSubtypes.ListTemplate1 = {
  backButton: "HIDDEN",
  title: "Test",
  backgroundImage: { contentDescription: "ListTemplate1", sources: [{ url: "www.example.org" }] },
};

export const listTemplate2: AlexaSubtypes.ListTemplate2 = {
  backButton: "HIDDEN",
  title: "Test",
  backgroundImage: { contentDescription: "ListTemplate2", sources: [{ url: "www.example.org" }] },
};

export const bodyTemplate1: AlexaSubtypes.BodyTemplate1 = {
  backButton: "VISIBLE",
  textContent: {
    primaryText: { text: "primaryText", type: "PlainText" },
    secondaryText: { text: "secondaryText", type: "PlainText" },
    tertiaryText: { text: "tertiaryText", type: "PlainText" },
  },
  backgroundImage: { contentDescription: "BodyTemplate1", sources: [{ url: "www.example.org" }] },
};

export const videoItem: AlexaSubtypes.VideoTemplate = {
  source: "http://link.de/video.mp4",
};

export const bodyTemplate2: AlexaSubtypes.BodyTemplate2 = {
  backButton: "VISIBLE",
  textContent: {
    primaryText: { text: "primaryText", type: "PlainText" },
    secondaryText: { text: "secondaryText", type: "PlainText" },
    tertiaryText: { text: "tertiaryText", type: "PlainText" },
  },
  backgroundImage: { contentDescription: "BodyTemplate2", sources: [{ url: "www.example.org" }] },
  title: "Title",
};

export const bodyTemplate3: AlexaSubtypes.BodyTemplate3 = {
  backButton: "VISIBLE",
  textContent: {
    primaryText: { text: "primaryText", type: "PlainText" },
    secondaryText: { text: "secondaryText", type: "PlainText" },
    tertiaryText: { text: "tertiaryText", type: "PlainText" },
  },
  backgroundImage: { contentDescription: "BodyTemplate2", sources: [{ url: "www.example.org" }] },
  title: "Title",
  image: {
    contentDescription: "contentDescription",
    sources: [
      {
        url: "www.example.org",
      },
    ],
  },
};

export const bodyTemplate6: AlexaSubtypes.BodyTemplate6 = {
  backButton: "VISIBLE",
  textContent: {
    primaryText: { text: "primaryText", type: "PlainText" },
    secondaryText: { text: "secondaryText", type: "PlainText" },
    tertiaryText: { text: "tertiaryText", type: "PlainText" },
  },
  backgroundImage: { contentDescription: "BodyTemplate2", sources: [{ url: "www.example.org" }] },
  image: {
    contentDescription: "contentDescription",
    sources: [
      {
        url: "www.example.org",
      },
    ],
  },
};

export const bodyTemplate7: AlexaSubtypes.BodyTemplate7 = {
  backButton: "VISIBLE",
  title: "BodyTemplate2",
  backgroundImage: { contentDescription: "BodyTemplate2", sources: [{ url: "www.example.org" }] },
  image: {
    contentDescription: "contentDescription",
    sources: [
      {
        url: "www.example.org",
      },
    ],
  },
};

export const hint: askInterfaces.interfaces.display.Hint = {
  text: "my hint",
  type: "PlainText",
};
