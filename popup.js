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

    makeTextNodesEditable();
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

    return new Promise(async (resolve, reject) => {
      try {
        let { url } = await getActiveTab();

        if (url.includes("azure")) {
          await hideAzureInfo();
        } else if (url.includes("github")) {
          await hideGitHubInfo();
        }

        // defer microtask
        setTimeout(() => resolve(), 10);
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
      let azureScrollContainer = document.querySelector(
        ".fxs-blade-content-wrapper:not(.fxs-menu-show-search)"
      );
      let scrollY = azureScrollContainer ? azureScrollContainer.scrollTop : 0;
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
      if (azureScrollContainer) {
        document
          .querySelector("#XYZ")
          .querySelector(
            ".fxs-blade-content-wrapper:not(.fxs-menu-show-search)"
          ).scrollTop = scrollY;
      }
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
        // subscription names 
        `[aria-label="Subscription selector"]`,
        `.fxs-part-assetname`,
        `[aria-labelledby$="siteSubscriptionValue"]`,

        // SAS
        `input[title*="&sig="]`,
        
        // Storage Access keys
        `input[aria-label*="Key"]`,
        
        // Storage connection string
        `input[aria-label*="Connection string"]`,
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
    let code = function () {
      let avatarSrc =
        "https://avatars3.githubusercontent.com/u/62345156?s=460&u=885c79b21d3f01e7d2caff6d721aff9c304257c4&v=4";
      let ghUsername = "staticwebdev";
      let $ = (s) => document.querySelector(s) || document.createElement("i");
      [
        ...document.querySelectorAll(
          ".commit-form-avatar img, a.u-photo img, a.avatar-user > img"
        ),
      ].map((el) => {
        el.src = avatarSrc;
      });
      [
        ...document.querySelectorAll(
          "a.author, a.commit-author, a[rel='author']"
        ),
      ].map((el) => {
        el.innerText = ghUsername;
      });
      [
        ...document.querySelectorAll(
          "#sponsorships-profile-button, .js-profile-editable-area, div.mt-3, div.border-top.py-3.clearfix.hide-sm.hide-md"
        ),
      ].map((el) => {
        el.style.cssText = `display: none !important;`;
      });
      [...document.querySelectorAll("h1.vcard-names")].map((el) => {
        el.innerHTML =
          `
        <span class="p-nickname vcard-username d-block" itemprop="additionalName">` +
          ghUsername +
          `</span>`;
      });
    };
    return await exec(code);
  }

  async function captureScreenshot(canDownload = false) {
    console.log("capture screenshot");

    return new Promise(async (resolve, reject) => {
      let { windowId } = await getActiveTab();
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

  function getActiveTab() {
    return new Promise((resolve, reject) => {
      try {
        chrome.tabs.query({ active: true, currentWindow: true }, function (
          tabs
        ) {
          resolve({
            tabId: tabs[0].id,
            url: tabs[0].url,
            windowId: tabs[0].windowId,
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async function makeTextNodesEditable() {
    let code = function () {
      let n;
      let nodes = [];
      let walk = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      while ((n = walk.nextNode())) nodes.push(n);
      nodes.forEach((el) => {
        // make all text nodes editable
        el.parentNode.setAttribute("contenteditable", true);
      });
    };
    return await exec(code);
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
        let { tabId } = await getActiveTab();
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
