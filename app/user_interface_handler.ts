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
 * @fileoverview Handles user interface interactions.
 */
import {UserSettings} from './user_settings';

export class UserInterfaceHandler {
  public static readonly MENU_ITEM_IMPORT_CHILD_SITES = 'startChildSitesImport';
  public static readonly MENU_ITEM_SHOW_API_VERSION_PROMPT =
    'showApiVersionPrompt';
  public static readonly MENU_ITEM_SHOW_NETWORK_CODE_PROMPT =
    'showNetworkCodePrompt';

  constructor(
    private readonly ui: GoogleAppsScript.Base.Ui,
    private readonly userSettings: UserSettings,
    private readonly createHtmlTemplateFn: (
      filename: string,
    ) => GoogleAppsScript.HTML.HtmlTemplate,
  ) {}

  /**
   * Creates the menu for the application.
   */
  createMenu() {
    const menu = this.ui.createMenu('Child Sites Toolkit');
    menu.addItem(
      'Import Child Sites',
      UserInterfaceHandler.MENU_ITEM_IMPORT_CHILD_SITES,
    );

    const subMenu = this.ui.createMenu('Settings');
    const networkCode = this.userSettings.networkCode ?? 'Not set';
    const apiVersion = this.userSettings.adManagerApiVersion;
    subMenu.addItem(
      `Network Code (${networkCode})`,
      UserInterfaceHandler.MENU_ITEM_SHOW_NETWORK_CODE_PROMPT,
    );
    subMenu.addItem(
      `Ad Manager API Version (${apiVersion})`,
      UserInterfaceHandler.MENU_ITEM_SHOW_API_VERSION_PROMPT,
    );
    menu.addSubMenu(subMenu);

    menu.addToUi();
  }

  showImportChildSitesDialog(): void {
    const selectedButton = this.ui.alert(
      'Import Child Sites',
      'Please be aware that imported data will be visible to anyone with ' +
        'access to this Google Sheets file regardless of whether or not they ' +
        'have access to the data within Google Ad Manager. Do you wish to ' +
        'continue?',
      this.ui.ButtonSet.YES_NO,
    );
    if (selectedButton === this.ui.Button.YES) {
      var htmlTemplate = this.createHtmlTemplateFn('import_dialog');
      this.ui.showModalDialog(
        htmlTemplate.evaluate().setHeight(200),
        'Import Sites',
      );
    }
  }

  /**
   * Shows a prompt to the user to input a property value.
   *
   * @param message The message to display in the prompt.
   * @param validPattern A regular expression to validate the input.
   * @param onValidInput A callback function to execute when the input is valid.
   * @param onInvalidInput A callback function to execute when the input is
   * invalid.
   */
  private showInputPrompt(
    message: string,
    validPattern: RegExp = /.*/,
    onValidInput: (validValue: string) => void = (validValue: string) => {},
    onInvalidInput: (invalidValue: string) => void = (
      invalidValue: string,
    ) => {},
  ) {
    const prompt = this.ui.prompt(message, this.ui.ButtonSet.OK_CANCEL);
    if (prompt.getSelectedButton() === this.ui.Button.OK) {
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
   */
  showNetworkCodePrompt(): void {
    this.showInputPrompt(
      'Network Code',
      /^[0-9]+$/,
      (newValue: string) => {
        this.userSettings.networkCode = newValue;
        this.createMenu();
      },
      (invalidValue: string) => {
        this.ui.alert(`Invalid network code: ${invalidValue}`);
        this.showNetworkCodePrompt();
      },
    );
  }

  /**
   * Prompts the user to input a new API version.
   */
  showApiVersionPrompt(): void {
    this.showInputPrompt(
      'API Version',
      /^v\d{6}$/,
      (newValue: string) => {
        this.userSettings.adManagerApiVersion = newValue;
        this.createMenu();
      },
      (invalidValue: string) => {
        this.ui.alert(`Invalid API version: ${invalidValue}`);
        this.showApiVersionPrompt();
      },
    );
  }
}
