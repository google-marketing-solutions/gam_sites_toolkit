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
import {Statement} from 'gam_apps_script/typings/statement';
import {UserSettings} from './user_settings';

/**
 * Represents a menu item, which can be a string (representing a function) or a
 * nested menu.
 */
export interface Menu {
  [name: string]: string | Menu;
}

/**
 * Handles user interface interactions.
 */
export class UserInterfaceHandler {
  /**
   * @param ui The Apps Script UI service.
   * @param createHtmlTemplateFn A function to create HTML templates.
   */
  constructor(
    private readonly ui: GoogleAppsScript.Base.Ui,
    private readonly createHtmlTemplateFn: (
      filename: string,
    ) => GoogleAppsScript.HTML.HtmlTemplate,
  ) {}

  /**
   * Recursive implementation of `createMenu`.
   *
   * @param name The name of the submenu.
   * @param menu The menu items.
   */
  private createMenuImpl(name: string, menu: Menu) {
    const newMenu = this.ui.createMenu(name);
    for (const [name, menuItem] of Object.entries(menu)) {
      if (typeof menuItem === 'string') {
        newMenu.addItem(name, menuItem);
      } else {
        const subMenu = this.createMenuImpl(name, menuItem);
        newMenu.addSubMenu(subMenu);
      }
    }
    return newMenu;
  }

  /**
   * Adds a menu to the UI.
   *
   * @param name The name of the menu.
   * @param menu The menu items.
   */
  createMenu(name: string, menu: Menu) {
    const sheetsMenu = this.createMenuImpl(name, menu);
    sheetsMenu.addToUi();
  }

  /**
   * Shows a yes/no dialog to the user.
   *
   * @param title The title of the dialog.
   * @param message The message to display in the dialog.
   * @return True if the user clicked "Yes", false otherwise.
   */
  showYesNoDialog(title: string, message: string): boolean {
    const selectedButton = this.ui.alert(
      title,
      message,
      this.ui.ButtonSet.YES_NO,
    );
    return selectedButton === this.ui.Button.YES;
  }

  /**
   * Shows the import sites dialog.
   * @param importId The ID of the import.
   * @param title The title of the dialog
   * @param statements The statements to import
   * @param totalResults The total number of results
   * @param details Additional details that should be displayed in the dialog.
   */
  showImportSitesDialog(
    importId: string,
    title: string,
    statements: Statement[],
    totalResults: number,
    details: string = '',
  ): void {
    var htmlTemplate = this.createHtmlTemplateFn('import_dialog');
    htmlTemplate['importId'] = importId;
    htmlTemplate['statements'] = JSON.stringify(statements);
    htmlTemplate['totalResults'] = totalResults;
    htmlTemplate['details'] = details;
    this.ui.showModalDialog(htmlTemplate.evaluate().setHeight(210), title);
  }

  /**
   * Shows a prompt to the user to input a value.
   *
   * @param message The message to display in the prompt.
   * @param validPattern A regular expression to validate the input.
   * @param onValidInput A callback function to execute when the input is valid.
   * @param onInvalidInput A callback function to execute when the input is
   * invalid.
   */
  showInputPrompt(
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
   * Shows an alert message.
   *
   * @param message The message to display.
   */
  showAlert(message: string): void {
    this.ui.alert(message);
  }
}
