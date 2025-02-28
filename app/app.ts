/**
 * @license
 * Copyright 2024 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview The main entry point for the application. Handles top-level
 * functions for menus, dialogs, and interaction with the client.
 */

import {UserInterfaceHandler} from './user_interface_handler';
import {UserSettings} from './user_settings';

let userSettings: UserSettings;

let userInterfaceHandler: UserInterfaceHandler;

/**
 * Returns the user settings, creating them if they don't exist.
 */
function getUserSettings() {
  if (!userSettings) {
    userSettings = new UserSettings();
  }
  return userSettings;
}

/**
 * Returns the user interface handler, creating it if it doesn't exist.
 */
function getUserInterfaceHandler(
  ui = SpreadsheetApp.getUi(),
  userSettings = getUserSettings(),
  createHtmlTemplateFn = HtmlService.createTemplateFromFile,
) {
  if (!userInterfaceHandler) {
    userInterfaceHandler = new UserInterfaceHandler(
      ui,
      userSettings,
      createHtmlTemplateFn,
    );
  }
  return userInterfaceHandler;
}

/**
 * Creates the menu for the application.
 * @param userInterfaceHandler The user interface handler to use.
 */
export function createMenu(userInterfaceHandler = getUserInterfaceHandler()) {
  userInterfaceHandler.createMenu();
}

/**
 * Shows the import child sites dialog.
 * @param userInterfaceHandler The user interface handler to use.
 */
export function showImportChildSitesDialog(
  userInterfaceHandler = getUserInterfaceHandler(),
): void {
  userInterfaceHandler.showImportChildSitesDialog();
}

/**
 * Shows the network code prompt.
 * @param userInterfaceHandler The user interface handler to use.
 */
export function showNetworkCodePrompt(
  userInterfaceHandler = getUserInterfaceHandler(),
) {
  userInterfaceHandler.showNetworkCodePrompt();
}

/**
 * Shows the API version prompt.
 * @param userInterfaceHandler The user interface handler to use.
 */
export function showApiVersionPrompt(
  userInterfaceHandler = getUserInterfaceHandler(),
) {
  userInterfaceHandler.showApiVersionPrompt();
}

/**
 * Starts process to import child sites.
 */
export function startChildSitesImport() {
  return 'hello, importer';
}

/**
 * A map of functions that can be called from the client.
 */
const callableFunctions: {[functionName: string]: Function} = {
  'startChildSitesImport': startChildSitesImport,
};

/**
 * Calls the specified function with the given arguments. This is used to
 * allow functions to be called from the client.
 * @param functionName The name of the function to call.
 * @param args The arguments to pass to the function.
 * @param functions A map of functions available to be called.
 * @return The return value of the function.
 */
export function callFunction(
  functionName: string,
  args: object[] = [],
  functions: {[functionName: string]: Function} = callableFunctions,
) {
  if (functionName in functions) {
    return functions[functionName](...args);
  } else {
    throw new Error(`${functionName} is not recognized.`);
  }
}

/**
 * The entry point for the application.
 */
function onOpen() {
  const handler = getUserInterfaceHandler();
  handler.createMenu();
}



goog.exportSymbol(
  UserInterfaceHandler.MENU_ITEM_IMPORT_CHILD_SITES,
  showImportChildSitesDialog,
);
goog.exportSymbol(
  UserInterfaceHandler.MENU_ITEM_SHOW_NETWORK_CODE_PROMPT,
  showNetworkCodePrompt,
);
goog.exportSymbol(
  UserInterfaceHandler.MENU_ITEM_SHOW_API_VERSION_PROMPT,
  showApiVersionPrompt,
);
