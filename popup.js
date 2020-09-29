import {
   $,
   DOMrestore,
   DOMsave,
   captureScreenshot,
   delay,
   learnify,
   exec,
   getSetting
} from "./popup.utils.js";

$("#open-guidelines").addEventListener("click", () => {
  chrome.tabs.create({
    url: "https://review.docs.microsoft.com/help/contribute/contribute-how-to-create-screenshot?branch=master",
  });
});
$("#open-contribute").addEventListener("click", () => {
  chrome.tabs.create({
    url: "https://github.com/manekinekko/ms-moonshot",
  });
});
$("#container").addEventListener("click", async () => {
  let shouldAnonymize = await getSetting("anonymize");

  if (shouldAnonymize) {
    await DOMsave();
    await learnify();
    await delay(500);
    await captureScreenshot(true);
    await DOMrestore();
  } else {
    await captureScreenshot(true);
  }
});
$("#anonymize").addEventListener("change", async (event) => {
  await setSetting({
    anonymize: event.target.checked,
  });
});

window.addEventListener("load", async () => {
  let dataUrl = await captureScreenshot(false);

  // load screenshot
  let container = $("#container");
  container.src = dataUrl;
  let img = new Image();
  img.onload = function () {
    container.style.cssText = `background-image: url(${dataUrl});`;
  };
  img.src = dataUrl;

  // sync settings
  let isAnonymizeEnabled = await getSetting("anonymize");
  $("#anonymize").checked = isAnonymizeEnabled;
});

window.addEventListener("load", async () => {
  let code = function () {
    if (!document.querySelector("#preload")) {
      var css = document.createElement("style");
      css.id = "preload";
      css.type = "text/css";
      css.innerHTML = `
        # Note: this is just a hack to preload the avatar over the wire!
        .preload {
          position: absolute;
          top: -99999px;
          left: -99999px;
          background-image: url(https://portal.azure.com/Content/static/MsPortalImpl/AvatarMenu/AvatarMenu_defaultAvatarSmall.png);
        }
        `;
      document.body.appendChild(css);
    }
  };
  await exec(code);
});
