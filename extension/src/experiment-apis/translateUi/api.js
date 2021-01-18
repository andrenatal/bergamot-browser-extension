/* eslint-env commonjs */
/* eslint no-unused-vars: off */
/* eslint no-console: ["warn", { allow: ["info", "warn", "error"] }] */
/* global ExtensionAPI */

"use strict";

this.translateUi = class extends ExtensionAPI {
  getAPI(context) {
    const { Services } = ChromeUtils.import(
      "resource://gre/modules/Services.jsm",
      {},
    );

    const now = Date.now();

    /* global TranslationBrowserChromeUiManager */
    Services.scriptloader.loadSubScript(
      context.extension.getURL(
        "experiment-apis/translateUi/TranslationBrowserChromeUiManager.js",
      ) +
        "?cachebuster=" +
        now,
    );
    /* global TranslationBrowserChromeUi */
    Services.scriptloader.loadSubScript(
      context.extension.getURL(
        "experiment-apis/translateUi/TranslationBrowserChromeUi.js",
      ) +
        "?cachebuster=" +
        now,
    );
    /* global EveryWindow */
    Services.scriptloader.loadSubScript(
      context.extension.getURL("experiment-apis/translateUi/EveryWindow.js") +
        "?cachebuster=" +
        now,
    );

    const { ExtensionCommon } = ChromeUtils.import(
      "resource://gre/modules/ExtensionCommon.jsm",
      {},
    );

    const { EventManager, EventEmitter } = ExtensionCommon;

    const apiEventEmitter = new EventEmitter();

    const { ExtensionUtils } = ChromeUtils.import(
      "resource://gre/modules/ExtensionUtils.jsm",
      {},
    );
    const { ExtensionError } = ExtensionUtils;

    const { BrowserWindowTracker } = ChromeUtils.import(
      "resource:///modules/BrowserWindowTracker.jsm",
      {},
    );

    /**
     * Boilerplate-reducing factory method translating between
     * apiEventEmitter.emit("translateUi.onFoo", ...args)
     * and the actual web extension event being emitted
     * @param {string} eventRef the event reference, eg "onFoo"
     * @returns {void}
     */
    const eventManagerFactory = eventRef => {
      const eventId = `translateUi.${eventRef}`;
      return new EventManager(context, eventId, fire => {
        const listener = (event, ...args) => fire.async(...args);
        apiEventEmitter.on(eventId, listener);
        return () => {
          apiEventEmitter.off(eventId, listener);
        };
      });
    };

    return {
      experiments: {
        translateUi: {
          /* Start reacting to translation state updates */
          start: async function start() {
            try {
              console.log("Called start()");

              function getMostRecentBrowserWindow() {
                return BrowserWindowTracker.getTopWindow({
                  private: false,
                  allowPopups: false,
                });
              }

              const recentWindow = getMostRecentBrowserWindow();
              if (recentWindow && recentWindow.gBrowser) {
                const translationBrowserChromeUi = new TranslationBrowserChromeUi(
                  recentWindow.gBrowser,
                  context,
                );
                translationBrowserChromeUi.showURLBarIcon();
                translationBrowserChromeUi.showTranslationInfoBar();
              }

              return undefined;
            } catch (error) {
              // Surface otherwise silent or obscurely reported errors
              console.error(error.message, error.stack);
              throw new ExtensionError(error.message);
            }
          },

          /* Set current ui state */
          setUiState: async function setUiState(tabId, uiState) {
            try {
              console.log("Called setUiState(tabId, uiState)", {
                tabId,
                uiState,
              });
              return undefined;
            } catch (error) {
              // Surface otherwise silent or obscurely reported errors
              console.error(error.message, error.stack);
              throw new ExtensionError(error.message);
            }
          },

          /* Stop reacting to translation state updates */
          stop: async function stop() {
            try {
              console.log("Called stop()");
              return undefined;
            } catch (error) {
              // Surface otherwise silent or obscurely reported errors
              console.error(error.message, error.stack);
              throw new ExtensionError(error.message);
            }
          },

          /* Event boilerplate with listeners that forwards all but the first argument to the web extension event */
          onSelectTranslateTo: eventManagerFactory("onSelectTranslateTo").api(),
          onSelectTranslateFrom: eventManagerFactory(
            "onSelectTranslateFrom",
          ).api(),
          onInfoBarClosed: eventManagerFactory("onInfoBarClosed").api(),
          onNeverTranslateThisSite: eventManagerFactory(
            "onNeverTranslateThisSite",
          ).api(),
          onNotNowButtonPressed: eventManagerFactory(
            "onNotNowButtonPressed",
          ).api(),
          onShowOriginalButtonPressed: eventManagerFactory(
            "onShowOriginalButtonPressed",
          ).api(),
          onTranslateButtonPressed: eventManagerFactory(
            "onTranslateButtonPressed",
          ).api(),
        },
      },
    };
  }
};