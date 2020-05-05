(async function () {
  "use strict";

  // utils
  var $ = (s) => document.querySelector(s);

  // events
  $("#open-guidelines").addEventListener("click", () => {
    chrome.tabs.create({
      url:
        "https://review.docs.microsoft.com/help/contribute/contribute-how-to-create-screenshot?branch=master",
    });
  });
  $("#container").addEventListener("click", async () => {
    let shouldAnonymize = await getSetting("anonymize");

    if (shouldAnonymize) {
      await DOMsave();
      await learnify();
      await delay(100);
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

  // functions

  function learnify() {
    console.log("learnify");

    return new Promise((resolve, reject) => {
      try {
        chrome.tabs.query(
          { active: true, currentWindow: true },
          async function (tabs) {
            let url = tabs[0].url;

            if (url.includes("azure")) {
              await hideAzureInfo();
            } else if (url.includes("github")) {
              await hideGitHubInfo();
            }

            // defer microtask
            setTimeout(() => resolve(), 10);
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  async function DOMsave() {
    console.log("save DOM");

    let code = function () {
      if (document.querySelector("#XYZ")) return;

      let parent = document.body;
      let scrollY = document.querySelector(
        ".fxs-blade-content-wrapper:not(.fxs-menu-show-search)"
      ).scrollTop;
      let div = document.createElement("div");
      div.id = "XYZ";
      div.style.cssText = `
      display: block;
      position: absolute;
      left: 0;
      right: 0;
      height: 100%;
      width: 100%;
      z-index: 9999999;`;
      div.appendChild(parent.cloneNode(true));
      parent.appendChild(div);
      document
        .querySelector("#XYZ")
        .querySelector(
          ".fxs-blade-content-wrapper:not(.fxs-menu-show-search)"
        ).scrollTop = scrollY;
    };
    return await exec(code);
  }

  function delay(ms) {
    console.log("wait", ms, "ms");
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function DOMrestore() {
    console.log("restore DOM");

    let code = function () {
      let bodyElement = document.body;
      bodyElement.removeChild(document.querySelector("#XYZ"));
    };
    return await exec(code);
  }

  async function hideAzureInfo() {
    let code = function () {
      let cssFilter = "blur(2.5px)";
      let $ = (s) => document.querySelector("#XYZ").querySelector(s);
      let $$ = (s) => [...document.querySelector("#XYZ").querySelectorAll(s)];

      // user info
      $(".fxs-avatarmenu-tenant-image").src =
        "https://portal.azure.com/Content/static/MsPortalImpl/AvatarMenu/AvatarMenu_defaultAvatarSmall.png";

      $(".fxs-avatarmenu-username").innerText = "user@contso.com";

      // secrets to hide
      let selectors = [
        // subscription names and secrets
        `[aria-label="Subscription selector"]`,
        `.fxs-part-assetname`,
        `[aria-labelledby$="siteSubscriptionValue"]`,

        // SAS
        `input[title*="&sig="]`,
      ];

      $$(selectors.join(",")).map((el) => (el.style.filter = cssFilter));

      // subscription names in details screen
      try {
        [
          $(
            'label[title="Subscription"]'
          ).parentElement.parentElement.querySelector(
            "a.msportalfx-text-primary"
          ),
          ...$$(".fxc-pill-content-value"),
        ].map((el) => (el.style.filter = cssFilter));
      } catch (error) {}

      // subscription ID
      [...$$(".fxc-essentials-value, .fxc-summary-item-value")]
        .filter((el) =>
          /\w{8}\-\w{4}\-\w{4}\-\w{4}\-\w{12}/.test(el.textContent)
        )
        .map((el) => (el.style.filter = cssFilter));
    };

    return await exec(code);
  }

  async function hideGitHubInfo() {
    if (shouldAnonymize === false) return;

    let code = function () {
      let avatarSrc =
        "https://avatars3.githubusercontent.com/u/62345156?s=460&u=885c79b21d3f01e7d2caff6d721aff9c304257c4&v=4";
      let ghUsername = "staticwebdev";
      let $ = (s) => document.querySelector(s) || document.createElement("i");
      [...document.querySelectorAll(".ghh-user-x, .avatar")].map((el) => {
        if (el.nodeName === "IMG") {
          el.src = avatarSrc;
        } else {
          if (el.id === "repository-owner") {
            el.innerHTML =
              '<img alt="@' +
              ghUsername +
              '" width="20" height="20" src="' +
              avatarSrc +
              '" class="avatar avatar-user mr-1 ghh-user-x tooltipstered" style="box-shadow: transparent 0px 0px;"> ' +
              ghUsername +
              " ";
          } else {
            el.innerText = ghUsername;
          }
        }
      });
    };
    return await exec(code);
  }

  async function flash() {
    console.log("flash effect");

    let code = function () {
      let bodyElement = document.body;
      bodyElement.classList.add("flash");
      setTimeout(() => bodyElement.classList.remove("flash"), 0);
    };
    return await exec(code);
  }

  async function captureScreenshot(canDownload = false) {
    console.log("capture screenshot");

    return new Promise(async (resolve, reject) => {
      let { windowId } = await getActiveTabId();
      chrome.tabs.captureVisibleTab(
        windowId,
        {
          format: "png",
          quality: 100,
        },
        function (dataUrl) {
          if (canDownload) {
            let a = document.createElement("a");
            a.href = dataUrl;
            a.setAttribute("download", `screenshot-${Date.now()}.png`);
            a.click();
          }
          resolve(dataUrl);
        }
      );
    });
  }
  
  function getActiveTabId() {
    return new Promise((resolve, reject) => {
      try {
        chrome.tabs.query({ active: true, currentWindow: true }, function (
          tabs
        ) {
          resolve({
            tabId: tabs[0].id,
            windowId: tabs[0].windowId,
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  function xpath(xpathToExecute) {
    let result = [];
    let nodesSnapshot = document.evaluate(
      xpathToExecute,
      document,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );
    for (let i = 0; i < nodesSnapshot.snapshotLength; i++) {
      result.push(nodesSnapshot.snapshotItem(i));
    }
    return result;
  }

  function exec(code) {
    code = code.toString();
    code = code.slice(code.indexOf("{") + 1, code.lastIndexOf("}"));
    code = "(function() {" + code + " } ())";

    return new Promise(async (resolve, reject) => {
      try {
        let { tabId } = await getActiveTabId();
        chrome.tabs.executeScript(
          tabId,
          {
            code,
          },
          function (a) {
            resolve();
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  async function setSetting(obj) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set(obj, function () {
        resolve();
      });
    });
  }

  async function getSetting(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get([key], function (result) {
        resolve(result[key] || false);
      });
    });
  }
})();
