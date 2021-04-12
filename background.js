import { anonymize, getSetting } from "./utils.js";

chrome.runtime.onInstalled.addListener(function () {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { urlMatches: "(azure|github|microsoft).com" },
          }),
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()],
      },
    ]);
  });
});

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  if (/(azure|github|microsoft).com/.test(tab.url)) {
    if (changeInfo.status == "complete" && tab.active) {
      const shouldAnonymize = await getSetting("anonymize");
      setTimeout(async (_) => await anonymize(shouldAnonymize), 1000);
    }
  }
});
