export const validRequestContext = {
  responseCallback: () => {},
  path: "/alexa",
  method: "POST",
  headers: {
    "content-type": "application/json; charset=utf-8",
    accept: "application/json",
    "accept-charset": "utf-8",
    signature: "...",
    signaturecertchainurl: "https://s3.amazonaws.com/echo.api/echo-api-cert-4.pem",
    "content-length": "627",
  },
  body: {
    version: "1.0",
    session: {
      new: false,
      sessionId: "SessionId.d391741c-a96f-4393-b7b4-ee76c81c24d3",
      application: { applicationId: "mock-applicationId" },
      attributes: {},
      user: {
        userId: "temporalUserId",
        permissions: {
          consentToken: "consentToken",
        },
        accessToken: "mockOAuthToken",
      },
    },
    request: {
      type: "IntentRequest",
      requestId: "EdwRequestId.26a93822-a362-4c6c-a947-0d39f00f8ca6",
      timestamp: "2017-06-24T16:00:18Z",
      locale: "en-US",
      intent: {
        name: "test",
        slots: {
          entity1: { value: "entityvalue" },
        },
      },
    },
  },
};
