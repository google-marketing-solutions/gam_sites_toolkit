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

import {AdManagerClient} from 'gam_apps_script/ad_manager_client';
import {Statement} from 'gam_apps_script/typings/statement';
import {DataHandler} from './data_handler';
import {SpreadsheetHandler} from './spreadsheet_handler';
import {Site} from './typings/ad_manager_api';
import {Menu, UserInterfaceHandler} from './user_interface_handler';
import {ChildPublisherMap, UserSettings} from './user_settings';

const MENU_ITEM_IMPORT_ALL_SITES = 'onImportAllSitesSelected';
const MENU_ITEM_IMPORT_FIRST_PARTY_SITES = 'onImportFirstPartySitesSelected';
const MENU_ITEM_IMPORT_CHILD_SITES = 'onImportChildSitesSelected';
const MENU_ITEM_IMPORT_SITES_BY_CHILD_NETWORK_CODE =
  'onImportSitesByChildNetworkCodeSelected';
const MENU_ITEM_IMPORT_SITES_BY_CUSTOM_QUERY =
  'onImportSitesByCustomQuerySelected';
const MENU_ITEM_SHOW_API_VERSION_PROMPT = 'showApiVersionPrompt';
const MENU_ITEM_SHOW_NETWORK_CODE_PROMPT = 'showNetworkCodePrompt';

const CONFIRM_IMPORT_DIALOG_MESSAGE =
  'Imported data will be visible to anyone with access to this Google Sheets ' +
  'file regardless of whether or not they have access to the data within ' +
  'Google Ad Manager. Do you wish to continue?';

let userSettings: UserSettings;

let userInterfaceHandler: UserInterfaceHandler;

let dataHandler: DataHandler;

let spreadsheetHandler: SpreadsheetHandler;

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
    userInterfaceHandler = new UserInterfaceHandler(ui, createHtmlTemplateFn);
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
      'gam_sites_toolkit',
      userSettings.networkCode,
      userSettings.adManagerApiVersion,
    );
    const siteService = client.getService('SiteService');
    const companyService = client.getService('CompanyService');
    dataHandler = new DataHandler(siteService, companyService);
  }
  return dataHandler;
}

/**
 * Returns the spreadsheet handler, creating it if it doesn't exist.
 */
function getSpreadsheetHandler(activeSpreadsheet = SpreadsheetApp.getActive()) {
  if (!spreadsheetHandler) {
    spreadsheetHandler = new SpreadsheetHandler(activeSpreadsheet);
  }
  return spreadsheetHandler;
}

/**
 * Creates the menu for the application.
 * @param userInterfaceHandler The user interface handler to use.
 */
export function createMenu(
  userInterfaceHandler = getUserInterfaceHandler(),
  userSettings = getUserSettings(),
) {
  const networkCode = userSettings.networkCode ?? 'Not set';
  const apiVersion = userSettings.adManagerApiVersion;
  const menu = {
    'Import Sites': {
      'All': MENU_ITEM_IMPORT_ALL_SITES,
      'First Party': MENU_ITEM_IMPORT_FIRST_PARTY_SITES,
      'Children': MENU_ITEM_IMPORT_CHILD_SITES,
      'By Child Network Code': MENU_ITEM_IMPORT_SITES_BY_CHILD_NETWORK_CODE,
      'By Custom Query': MENU_ITEM_IMPORT_SITES_BY_CUSTOM_QUERY,
    },
    'Settings': {
      [`Network Code (${networkCode})`]: MENU_ITEM_SHOW_NETWORK_CODE_PROMPT,
      [`Ad Manager API Version (${apiVersion})`]:
        MENU_ITEM_SHOW_API_VERSION_PROMPT,
    },
  };
  userInterfaceHandler.createMenu('GAM Sites Toolkit', menu);
}

/**
 * Registers menu functions onto the provided object.
 * @param scope The object to register functions onto.
 */
export function registerMenuFunctions(scope: Record<string, Function>): void {
  scope[MENU_ITEM_IMPORT_ALL_SITES] = onImportAllSitesSelected;
  scope[MENU_ITEM_IMPORT_FIRST_PARTY_SITES] = onImportFirstPartySitesSelected;
  scope[MENU_ITEM_IMPORT_CHILD_SITES] = onImportChildSitesSelected;
  scope[MENU_ITEM_IMPORT_SITES_BY_CHILD_NETWORK_CODE] =
    onImportSitesByChildNetworkCodeSelected;
  scope[MENU_ITEM_IMPORT_SITES_BY_CUSTOM_QUERY] =
    onImportSitesByCustomQuerySelected;
  scope[MENU_ITEM_SHOW_API_VERSION_PROMPT] = showApiVersionPrompt;
  scope[MENU_ITEM_SHOW_NETWORK_CODE_PROMPT] = showNetworkCodePrompt;
}

/**
 * Format options for the output sheet.
 */
export enum SiteImportOutputFormat {
  FIRST_PARTY = 'first_party',
  CHILD = 'child',
  COMBINED = 'combined',
}

/**
 * Starts the process of importing sites.
 * @param query The PQL query to use to filter sites.
 * @param dialogTitle The title of the dialog to show.
 * @param dialogMessage The message to show in the dialog.
 * @param sheetTitle The title of the sheet to create.
 * @param outputFormat The format of the output sheet.
 * @param userSettings The user settings to use.
 * @param dataHandler The data handler to use.
 * @param userInterfaceHandler The user interface handler to use.
 * @param spreadsheetHandler The spreadsheet handler to use.
 */
function startSitesImport(
  query: string,
  dialogTitle: string,
  dialogMessage: string | null,
  sheetTitle: string,
  outputFormat: SiteImportOutputFormat,
  userSettings = getUserSettings(),
  dataHandler = getDataHandler(),
  userInterfaceHandler = getUserInterfaceHandler(),
  spreadsheetHandler = getSpreadsheetHandler(),
) {
  const {statements, totalResults} =
    dataHandler.getStatementsAndTotalResultsForSitesStatement({
      query,
    });
  let message = dialogMessage
    ? `${dialogMessage} (${totalResults} results)\n\n`
    : `Total results: ${totalResults}\n\n`;
  message += CONFIRM_IMPORT_DIALOG_MESSAGE;
  const userConfirmed = userInterfaceHandler.showYesNoDialog(
    dialogTitle,
    message,
  );
  if (!userConfirmed) {
    return;
  }
  const timeString = new Date().toLocaleString();
  spreadsheetHandler.createSheet(sheetTitle);
  let headers;
  if (outputFormat === SiteImportOutputFormat.FIRST_PARTY) {
    headers = ['Site URL', 'Approval Status', 'Status Details'];
  } else {
    headers = [
      'Site URL',
      'Child Publisher',
      'Approval Status',
      'Status Details',
    ];
  }
  spreadsheetHandler.insertValuesIntoSheet(sheetTitle, [headers]);
  userInterfaceHandler.showImportSitesDialog(
    dialogTitle,
    sheetTitle,
    outputFormat,
    statements,
    totalResults,
    `Total results: ${totalResults}`,
  );
}

/**
 * Starts an import of all sites.
 * @param userSettings The user settings to use.
 * @param dataHandler The data handler to use.
 * @param spreadsheetHandler The spreadsheet handler to use.
 * @param userInterfaceHandler The user interface handler to use.
 */
export function onImportAllSitesSelected(
  userSettings = getUserSettings(),
  dataHandler = getDataHandler(),
  spreadsheetHandler = getSpreadsheetHandler(),
  userInterfaceHandler = getUserInterfaceHandler(),
): void {
  const timeString = new Date().toLocaleString();
  startSitesImport(
    '',
    'Import All Sites',
    null,
    `[${userSettings.networkCode}] All Sites (${timeString})`,
    SiteImportOutputFormat.COMBINED,
    userSettings,
    dataHandler,
    userInterfaceHandler,
    spreadsheetHandler,
  );
}

/**
 * Starts an import of first party sites.
 * @param userSettings The user settings to use.
 * @param dataHandler The data handler to use.
 * @param spreadsheetHandler The spreadsheet handler to use.
 * @param userInterfaceHandler The user interface handler to use.
 */
export function onImportFirstPartySitesSelected(
  userSettings = getUserSettings(),
  dataHandler = getDataHandler(),
  spreadsheetHandler = getSpreadsheetHandler(),
  userInterfaceHandler = getUserInterfaceHandler(),
): void {
  const timeString = new Date().toLocaleString();
  startSitesImport(
    "WHERE childNetworkCode = ''",
    'Import First Party Sites',
    null,
    `[${userSettings.networkCode}] First Party Sites (${timeString})`,
    SiteImportOutputFormat.FIRST_PARTY,
    userSettings,
    dataHandler,
    userInterfaceHandler,
    spreadsheetHandler,
  );
}

/**
 * Starts an import of child sites.
 * @param userSettings The user settings to use.
 * @param dataHandler The data handler to use.
 * @param spreadsheetHandler The spreadsheet handler to use.
 * @param userInterfaceHandler The user interface handler to use.
 */
export function onImportChildSitesSelected(
  userSettings = getUserSettings(),
  dataHandler = getDataHandler(),
  spreadsheetHandler = getSpreadsheetHandler(),
  userInterfaceHandler = getUserInterfaceHandler(),
): void {
  const timeString = new Date().toLocaleString();
  startSitesImport(
    "WHERE childNetworkCode != ''",
    'Import Child Sites',
    null,
    `[${userSettings.networkCode}] Child Sites (${timeString})`,
    SiteImportOutputFormat.CHILD,
    userSettings,
    dataHandler,
    userInterfaceHandler,
    spreadsheetHandler,
  );
}

/**
 * Starts an import of sites by child network code.
 * @param userSettings The user settings to use.
 * @param dataHandler The data handler to use.
 * @param spreadsheetHandler The spreadsheet handler to use.
 * @param userInterfaceHandler The user interface handler to use.
 */
export function onImportSitesByChildNetworkCodeSelected(
  userSettings = getUserSettings(),
  dataHandler = getDataHandler(),
  spreadsheetHandler = getSpreadsheetHandler(),
  userInterfaceHandler = getUserInterfaceHandler(),
): void {
  userInterfaceHandler.showInputPrompt(
    'Child Network Code',
    /^[0-9]+$/,
    (childNetworkCode: string) => {
      const timeString = new Date().toLocaleString();
      startSitesImport(
        `WHERE childNetworkCode = '${childNetworkCode}'`,
        'Import Sites',
        `Child Network Code: ${childNetworkCode}`,
        `[${userSettings.networkCode}] Child Sites (${childNetworkCode}) (${timeString})`,
        SiteImportOutputFormat.CHILD,
        userSettings,
        dataHandler,
        userInterfaceHandler,
        spreadsheetHandler,
      );
    },
    (invalidChildNetworkCode: string) => {
      userInterfaceHandler.showAlert(
        `Invalid child network code: ${invalidChildNetworkCode}`,
      );
    },
  );
}

/**
 * Starts an import of sites by custom PQL query.
 * @param userSettings The user settings to use.
 * @param dataHandler The data handler to use.
 * @param spreadsheetHandler The spreadsheet handler to use.
 * @param userInterfaceHandler The user interface handler to use.
 */
export function onImportSitesByCustomQuerySelected(
  userSettings = getUserSettings(),
  dataHandler = getDataHandler(),
  spreadsheetHandler = getSpreadsheetHandler(),
  userInterfaceHandler = getUserInterfaceHandler(),
): void {
  userInterfaceHandler.showInputPrompt('PQL Query', /.*/, (query: string) => {
    const timeString = new Date().toLocaleString();
    startSitesImport(
      query,
      'Import Sites by Custom Query',
      `Query: ${query}`,
      `[${userSettings.networkCode}] ${query} (${timeString})`,
      SiteImportOutputFormat.COMBINED,
      userSettings,
      dataHandler,
      userInterfaceHandler,
      spreadsheetHandler,
    );
  });
}

/**
 * Shows the network code prompt.
 * @param userInterfaceHandler The user interface handler to use.
 * @param userSettings The user settings to use.
 * @param userInterfaceHandler The user interface handler to use.
 */
export function showNetworkCodePrompt(
  userInterfaceHandler = getUserInterfaceHandler(),
  userSettings = getUserSettings(),
) {
  userInterfaceHandler.showInputPrompt(
    'Network Code',
    /^[0-9]+$/,
    (newValue: string) => {
      userSettings.networkCode = newValue;
      createMenu(userInterfaceHandler, userSettings);
    },
    (invalidValue: string) => {
      userInterfaceHandler.showAlert(`Invalid network code: ${invalidValue}`);
      showNetworkCodePrompt(userInterfaceHandler, userSettings);
    },
  );
}

/**
 * Shows the API version prompt.
 * @param userInterfaceHandler The user interface handler to use.
 * @param userSettings The user settings to use.
 * @param userInterfaceHandler The user interface handler to use.
 */
export function showApiVersionPrompt(
  userInterfaceHandler = getUserInterfaceHandler(),
  userSettings = getUserSettings(),
) {
  userInterfaceHandler.showInputPrompt(
    'Ad Manager API Version',
    /^v\d{6}$/,
    (newValue: string) => {
      userSettings.adManagerApiVersion = newValue;
      createMenu(userInterfaceHandler, userSettings);
    },
    (invalidValue: string) => {
      userInterfaceHandler.showAlert(`Invalid API version: ${invalidValue}`);
      showApiVersionPrompt(userInterfaceHandler, userSettings);
    },
  );
}

/**
 * Creates a row for a site.
 * @param site The site to create a row for.
 * @param childPublishers A map of child publishers.
 * @param outputFormat The format of the output sheet.
 * @return An array of strings representing the row.
 */
function createRowForSite(
  site: Site,
  childPublishers: ChildPublisherMap,
  outputFormat: SiteImportOutputFormat,
): string[] {
  const isChildSite = Boolean(site.childNetworkCode);
  let childPublisherEntry;
  if (isChildSite) {
    const childPublisher = childPublishers[site.childNetworkCode];
    const childPublisherName =
      childPublisher?.name ?? '[Child Publisher Name Not Found]';
    childPublisherEntry = `${childPublisherName} (${site.childNetworkCode})`;
  } else {
    childPublisherEntry = '[First Party]';
  }

  let approvalStatusEntry;
  switch (site.approvalStatus) {
    case 'DRAFT':
      approvalStatusEntry = isChildSite
        ? 'Requires review'
        : 'Not sent for review';
      break;
    case 'APPROVED':
      approvalStatusEntry = 'Ready';
      break;
    case 'DISAPPROVED':
      approvalStatusEntry = 'Needs attention';
      break;
    case 'UNCHECKED':
    case 'REQUIRES_REVIEW':
      approvalStatusEntry = 'Getting ready';
      break;
    default:
      approvalStatusEntry = 'Unknown';
      break;
  }
  const disapprovalReasonsEntry = (site.disapprovalReasons ?? [])
    // only keep non-empty strings
    .filter((r) => r.details && r.details.trim())
    .map((r) => r.details.trim())
    .join(', ');

  if (outputFormat === SiteImportOutputFormat.FIRST_PARTY) {
    return [site.url, approvalStatusEntry, disapprovalReasonsEntry];
  } else {
    return [
      site.url,
      childPublisherEntry,
      approvalStatusEntry,
      disapprovalReasonsEntry,
    ];
  }
}

/**
 * Gets sites for a given import ID and statement.
 * @param sheetTitle The title of the sheet for the import process.
 * @param statement The PQL Statement to use to filter sites.
 * @param outputFormat The format of the output sheet.
 * @param userSettings The user settings to use.
 * @param dataHandler The data handler to use.
 * @return The number of sites returned.
 */
export function getSites(
  sheetTitle: string,
  statement: Statement,
  outputFormat: SiteImportOutputFormat,
  userSettings = getUserSettings(),
  dataHandler = getDataHandler(),
  spreadsheetHandler = getSpreadsheetHandler(),
): number {
  const sitesPage = dataHandler.getSites(statement);
  const childPublishers =
    userSettings.childPublishers ?? dataHandler.fetchChildPublishers();

  const rows = sitesPage.results.map((site) =>
    createRowForSite(site, childPublishers, outputFormat),
  );
  spreadsheetHandler.insertValuesIntoSheet(
    sheetTitle,
    rows,
    sitesPage.startIndex + 2,
  );
  return sitesPage.results.length;
}

/**
 * Finishes the sites import process.
 * @param sheetTitle The title of the sheet for the import process.
 * @param spreadsheetHandler The spreadsheet handler to use.
 */
export function finishSitesImport(
  sheetTitle: string,
  spreadsheetHandler = getSpreadsheetHandler(),
): void {
  spreadsheetHandler.activateSheet(sheetTitle);
}

/**
 * Cancels the sites import process.
 * @param sheetTitle The title of the sheet for the import process.
 * @param spreadsheetHandler The spreadsheet handler to use.
 */
export function cancelSitesImport(
  sheetTitle: string,
  spreadsheetHandler = getSpreadsheetHandler(),
): void {
  spreadsheetHandler.deleteSheet(sheetTitle);
}

/**
 * A map of functions that can be called from the client.
 */
let callableFunctions: {[functionName: string]: (...args: any[]) => any} = {
  'getSites': getSites,
  'finishSitesImport': finishSitesImport,
  'cancelSitesImport': cancelSitesImport,
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
export function onOpen() {
  const handler = getUserInterfaceHandler();
  const settings = getUserSettings();
  createMenu(handler, settings);
}













/**
 * Exposes functions for testing.
 */
export const TEST_ONLY = {
  setCallableFunctions,
};
