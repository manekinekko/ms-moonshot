// Utils

export const $ = (s) => document.querySelector(s);

export function learnify() {
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

export async function DOMsave() {
  console.log("save DOM");

  let code = function () {
    if (document.querySelector("#MS_MOONSHOT_CONTAINER")) return;

    let parent = document.body;
    let azureScrollTopContainer = document.querySelector(".fxs-blade-content-wrapper:not(.fxs-menu-show-search)");
    let azureScrollLeftContainer = document.querySelector(
      ".fxs-journey-layout.fxs-stacklayout.fxs-stacklayout-horizontal"
    );
    let scrollY = azureScrollTopContainer ? azureScrollTopContainer.scrollTop : 0;
    let scrollX = azureScrollLeftContainer ? azureScrollLeftContainer.scrollLeft : 0;
    let div = document.createElement("div");
    div.id = "MS_MOONSHOT_CONTAINER";
    div.style.cssText = `
      display: block;
      position: absolute;
      left: 0;
      top: 0;
      right: 0;
      height: 100%;
      width: 100%;
      z-index: 9999999;`;
    div.appendChild(parent.cloneNode(true));
    parent.appendChild(div);
    if (azureScrollTopContainer) {
      document
        .querySelector("#MS_MOONSHOT_CONTAINER")
        .querySelector(".fxs-blade-content-wrapper:not(.fxs-menu-show-search)").scrollTop = scrollY;
    }

    if (azureScrollLeftContainer) {
      document
        .querySelector("#MS_MOONSHOT_CONTAINER")
        .querySelector(".fxs-journey-layout.fxs-stacklayout.fxs-stacklayout-horizontal").scrollLeft = scrollX;
    }
  };
  return await exec(code);
}

export function delay(ms) {
  console.log("wait", ms, "ms");
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function DOMrestore() {
  console.log("restore DOM");

  let code = function () {
    let bodyElement = document.body;
    bodyElement.removeChild(document.querySelector("#MS_MOONSHOT_CONTAINER"));
  };
  return await exec(code);
}

export async function hideAzureInfo() {
  console.log("hideAzureInfo");

  let code = function () {
    let cssFilter = "blur(2.5px)";
    let $ = (s) => document.querySelector("#MS_MOONSHOT_CONTAINER").querySelector(s);
    let $$ = (s) => [...document.querySelector("#MS_MOONSHOT_CONTAINER").querySelectorAll(s)];

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
        $('label[title="Subscription"]').parentElement.parentElement.querySelector("a.msportalfx-text-primary"),
        ...$$(".fxc-pill-content-value"),
      ].map((el) => (el.style.filter = cssFilter));
    } catch (error) {}

    // subscription ID
    [...$$(".fxc-essentials-value, .fxc-summary-item-value")]
      .filter((el) => /\w{8}\-\w{4}\-\w{4}\-\w{4}\-\w{12}/.test(el.textContent))
      .map((el) => (el.style.filter = cssFilter));
  };

  return await exec(code);
}

export async function hideGitHubInfo() {
  console.log("hideGitHubInfo");

  let code = function () {
    let avatarSrc =
      "https://avatars3.githubusercontent.com/u/62345156?s=460&u=885c79b21d3f01e7d2caff6d721aff9c304257c4&v=4";
    let ghUsername = "staticwebdev";
    let $ = (s) => document.querySelector("#MS_MOONSHOT_CONTAINER").querySelector(s);
    let $$ = (s) => [...document.querySelector("#MS_MOONSHOT_CONTAINER").querySelectorAll(s)];

    [...$$(".avatar.avatar-user.width-full, a.u-photo img, a.avatar-user > img, .Header-link img")].map((el) => {
      el.src = avatarSrc;
    });
    [...$$("a.author, a.commit-author, a[rel='author']")].map((el) => {
      el.innerText = ghUsername;
    });
    [
      ...$$(
        [
          // user's bio
          ".user-profile-bio",

          // user's readme
          ".Box-body.p-4:nth-child(1)",

          // the Sponsors dashboard button on the profile page
          "#sponsorships-profile-button",

          // the Edit profile button on the profile page
          ".js-profile-editable-area button.js-profile-editable-edit-button",
          ".js-profile-editable-area .user-profile-bio",
          ".js-profile-editable-area li[itemprop]:not([itemprop='homeLocation'])",

          // The Organizations section on the profile page
          // sponsors caontainer on the profile page
          "div.border-top.pt-3.mt-3.clearfix.hide-sm.hide-md",

          // User's status on the profile page under the avatar
          ".user-status-container",
        ].join(",")
      ),
    ].map((el) => {
      el.style.cssText = `display: none !important;`;
    });

    $(".js-profile-editable-area li[itemprop='homeLocation'] .p-label").innerHTML = "The Internet";

    [...$$("h1.vcard-names")].map((el) => {
      el.innerHTML =
        `
        <span class="p-nickname vcard-username d-block" itemprop="additionalName">` +
        ghUsername +
        `</span>`;
    });
  };
  return await exec(code);
}

export async function captureScreenshot(canDownload = false) {
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

export function getActiveTab() {
  return new Promise((resolve, reject) => {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
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

export async function makeTextNodesEditable() {
  let code = function () {
    let n;
    let nodes = [];
    let walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    while ((n = walk.nextNode())) nodes.push(n);
    nodes.forEach((el) => {
      // make all text nodes editable
      if (el.parentNode.nodeName !== "BODY") {
        el.parentNode.setAttribute("contenteditable", true);
      }
    });
  };
  return await exec(code);
}

export function xpath(xpathToExecute) {
  let result = [];
  let nodesSnapshot = document.evaluate(xpathToExecute, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
  for (let i = 0; i < nodesSnapshot.snapshotLength; i++) {
    result.push(nodesSnapshot.snapshotItem(i));
  }
  return result;
}

export function exec(code) {
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

export async function setSetting(obj) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(obj, function () {
      resolve();
    });
  });
}

export async function getSetting(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get([key], function (result) {
      resolve(result[key] || false);
    });
  });
}
