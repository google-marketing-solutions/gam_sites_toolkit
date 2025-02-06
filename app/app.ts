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

import {UserSettings} from './user_settings';

let userSettings: UserSettings;

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
 * Hello, world!
 */
function helloWorld(): void {
  SpreadsheetApp.getActiveSpreadsheet().toast('Hello, world!');
}

/**
 * Shows a prompt to the user to input a property value.
 *
 * @param message The message to display in the prompt.
 * @param ui The Ui instance to use for displaying the prompt.
 * @param validPattern A regular expression to validate the input.
 * @param onValidInput A callback function to execute when the input is valid.
 * @param onInvalidInput A callback function to execute when the input is
 * invalid.
 */
export function showInputPrompt(
  message: string,
  ui: GoogleAppsScript.Base.Ui,
  validPattern: RegExp = /.*/,
  onValidInput: (validValue: string) => void = (validValue: string) => {},
  onInvalidInput: (invalidValue: string) => void = (invalidValue: string) => {},
) {
  const prompt = ui.prompt(message, ui.ButtonSet.OK_CANCEL);
  if (prompt.getSelectedButton() === ui.Button.OK) {
    const responseText = prompt.getResponseText().trim();
    if (validPattern.test(responseText)) {
      onValidInput(responseText);
    } else {
      onInvalidInput(responseText);
    }
  }
}

/**
 * Prompts the user to input a new network code.
 *
 * @param userSettings The user settings to update.
 * @param ui The Ui instance to use for displaying the prompt.
 */
export function onNetworkCodeSettingSelected(
  userSettings = getUserSettings(),
  ui = SpreadsheetApp.getUi(),
): void {
  showInputPrompt(
    'Network Code',
    ui,
    /^[0-9]+$/,
    (newValue: string) => {
      userSettings.networkCode = newValue;
      createMenu(userSettings, ui);
    },
    (invalidValue: string) => {
      ui.alert(`Invalid network code: ${invalidValue}`);
      onNetworkCodeSettingSelected(userSettings, ui);
    },
  );
}

/**
 * Prompts the user to input a new API version.
 *
 * @param userSettings The user settings to update.
 * @param ui The Ui instance to use for displaying the prompt.
 */
export function onApiVersionSettingSelected(
  userSettings = getUserSettings(),
  ui = SpreadsheetApp.getUi(),
): void {
  showInputPrompt(
    'API Version',
    ui,
    /^v\d{6}$/,
    (newValue: string) => {
      userSettings.adManagerApiVersion = newValue;
      createMenu(userSettings, ui);
    },
    (invalidValue: string) => {
      ui.alert(`Invalid API Version: ${invalidValue}`);
      onApiVersionSettingSelected(userSettings, ui);
    },
  );
}

/**
 * Creates the menu for the application.
 *
 * @param userSettings The user settings to use for the menu items.
 * @param ui The Ui instance to use for creating the menu.
 */
export function createMenu(
  userSettings = getUserSettings(),
  ui = SpreadsheetApp.getUi(),
) {
  const menu = ui.createMenu('Child Sites Toolkit');
  menu.addItem('Hello, world!', 'helloWorld');

  const subMenu = ui.createMenu('Settings');
  const networkCode = userSettings.networkCode ?? 'Not set';
  const apiVersion = userSettings.adManagerApiVersion;
  subMenu.addItem(
    `Network Code (${networkCode})`,
    'onNetworkCodeSettingSelected',
  );
  subMenu.addItem(
    `Ad Manager API Version (${apiVersion})`,
    'onApiVersionSettingSelected',
  );
  menu.addSubMenu(subMenu);

  menu.addToUi();
}

/**
 * The entry point for the application.
 */
function init(userSettings = getUserSettings(), ui = SpreadsheetApp.getUi()) {
  createMenu(userSettings, ui);
}





