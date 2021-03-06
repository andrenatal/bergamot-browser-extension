/* eslint-env node */

const fs = require("fs");
const path = require("path");
const packageJson = require("./package.json");
const targetBrowser = process.env.TARGET_BROWSER || "firefox";
const destPath = path.join(__dirname, "build", targetBrowser);

async function generateManifest({ dotEnvPath }) {
  require("dotenv").config({ path: dotEnvPath });
  const manifest = {
    manifest_version: 2,
    name: `Bergamot Translate${
      process.env.NODE_ENV !== "production" ? " (DEV)" : ""
    }`,
    description: "__MSG_extensionDescription__",
    version: `${packageJson.version}`,
    incognito: "spanning", // Share context between private and non-private windows
    default_locale: "en_US",
    background: {
      scripts: ["background.js"],
    },
    content_scripts: [
      {
        js: ["dom-translation-content-script.js"],
        matches: ["<all_urls>"],
        all_frames: false,
        run_at: "document_idle",
        match_about_blank: false,
      },
    ],
    permissions: [
      "<all_urls>",
      `${process.env.BERGAMOT_REST_API_INBOUND_URL}/*`,
      "storage",
      "alarms",
    ],
    icons: {
      48: "icons/extension-icon.48x48.png",
      96: "icons/extension-icon.96x96.png",
      128: "icons/extension-icon.128x128.png",
    },
    browser_action: {
      default_icon: "icons/extension-icon.inactive.38x38.png",
      default_title: "__MSG_browserActionButtonTitle__",
      default_popup: "main-interface/popup.html",
    },
    options_ui: {
      page: "options-ui/options-ui.html",
    },
  };
  if (targetBrowser === "firefox") {
    manifest.applications = {
      gecko: {
        id: "bergamot-browser-extension@browser.mt",
        strict_min_version: "77.0a1",
      },
    };
    manifest.browser_action.browser_style = false;
    manifest.options_ui.browser_style = false;
  }
  if (targetBrowser === "chrome") {
    manifest.browser_action.chrome_style = false;
    manifest.options_ui.chrome_style = false;
    // https://github.com/WebAssembly/content-security-policy/issues/7
    manifest.content_security_policy =
      "script-src 'self' 'unsafe-eval'; object-src 'self';";
  }
  const targetPath = path.join(destPath, "manifest.json");
  await fs.promises.mkdir(destPath, { recursive: true });
  await fs.promises.writeFile(targetPath, JSON.stringify(manifest, null, 2));
}

module.exports = { generateManifest };

if (require.main === module) {
  const dotEnvPath =
    process.env.NODE_ENV === "production"
      ? "./.env.production"
      : "./.env.development";
  generateManifest({ dotEnvPath });
}
