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

import {AdManagerClient} from 'google3/third_party/professional_services/solutions/gam_apps_script/ad_manager_client';
import {Statement} from 'google3/third_party/professional_services/solutions/gam_apps_script/typings/statement';
import {DataHandler} from './data_handler';
import {Site} from './typings/ad_manager_api';
import {UserInterfaceHandler} from './user_interface_handler';
import {UserSettings} from './user_settings';

let userSettings: UserSettings;

let userInterfaceHandler: UserInterfaceHandler;

let dataHandler: DataHandler;

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
 * Returns the data handler, creating it if it doesn't exist.
 */
function getDataHandler(userSettings = getUserSettings()) {
  if (!userSettings.networkCode) {
    throw new Error('Network code is not set.');
  }
  if (!dataHandler) {
    const client = new AdManagerClient(
      ScriptApp.getOAuthToken(),
      'Child Sites Toolkit',
      userSettings.networkCode,
      userSettings.adManagerApiVersion,
      {'Is-Internal-User': 'true'},
    );
    const siteService = client.getService('SiteService');
    dataHandler = new DataHandler(siteService);
  }
  return dataHandler;
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
 * @param importId The ID of the import process.
 * @param query The PQL query to use to filter sites.
 * @param dataHandler The data handler to use.
 * @return An object containing the statements and total results.
 */
export function startSitesImport(
  importId: string,
  query: string = '',
  dataHandler = getDataHandler(),
): {
  statements: Statement[];
  totalResults: number;
} {
  return dataHandler.startSitesImport(importId, {query});
}

/**
 * Gets sites for a given import ID and statement.
 * @param importId The ID of the import process.
 * @param statement The PQL Statement to use to filter sites.
 * @param dataHandler The data handler to use.
 * @return The number of sites returned.
 */
function getSites(
  importId: string,
  statement: Statement,
  dataHandler = getDataHandler(),
): number {
  return dataHandler.getSites(importId, statement);
}

/**
 * Finishes the sites import process.
 * @param importId The ID of the import process.
 * @param dataHandler The data handler to use.
 */
function finishSitesImport(
  importId: string,
  dataHandler = getDataHandler(),
): void {
  dataHandler.finishSitesImport(importId);
}

/**
 * A map of functions that can be called from the client.
 */
let callableFunctions: {[functionName: string]: (...args: any[]) => any} = {
  'startSitesImport': startSitesImport,
  'getSites': getSites,
  'finishSitesImport': finishSitesImport,
};

/**
 * Sets the callable functions. For testing only.
 * @param functions The functions to set.
 */
function setCallableFunctions(functions: {
  [functionName: string]: (...args: any[]) => any;
}) {
  callableFunctions = functions;
}

/**
 * Calls the specified function with the given arguments. This is used to
 * allow functions to be called from the client.
 * @param functionName The name of the function to call.
 * @param args The arguments to pass to the function.
 * @param functions A map of functions available to be called.
 * @return The return value of the function.
 */
export function callFunction(functionName: string, ...args: object[]) {
  console.log('callFunction:', functionName, args);
  if (functionName in callableFunctions) {
    return callableFunctions[functionName](...args);
  } else {
    throw new Error(`${functionName} is not recognized.`);
  }
}

/**
 * Returns the content of an HTML component file (i.e. CSS or JavaScript) to be
 * used in conjunction with `HtmlTemplate.evaluate`. A client-side HTML file can
 * call this function with a scriptlet (i.e. `<?!= include('common.html') ?>`).
 */
export function include(filename: string): string {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
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

/**
 * Exposes functions for testing.
 */
export const TEST_ONLY = {
  setCallableFunctions,
};
