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
 * @fileoverview A handler for interacting with Google Sheets.
 * */

/**
 * A handler for interacting with Google Sheets.
 */
export class SpreadsheetHandler {
  constructor(private readonly spreadsheet = SpreadsheetApp.getActive()) {}

  private getSheet(sheetName: string): GoogleAppsScript.Spreadsheet.Sheet {
    const sheet = this.spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error(`Sheet ${sheetName} not found.`);
    }
    return sheet;
  }

  /**
   * Creates a new sheet with the given name.
   *
   * @param name The name of the sheet to create.
   * @param hidden Whether to hide the sheet. Defaults to true.
   */
  createSheet(name: string, hidden: boolean = true) {
    const sheet = this.spreadsheet.insertSheet(name);
    if (hidden) {
      sheet.hideSheet();
    }
  }

  /**
   * Inserts values into a sheet.
   *
   * @param sheetName The name of the sheet to insert into.
   * @param values The values to insert.
   * @param The row to start inserting at. If undefined, the next available row
   * is used.
   */
  insertValuesIntoSheet(
    sheetName: string,
    values: string[][],
    row: number | undefined = undefined,
  ) {
    const sheet = this.getSheet(sheetName);
    if (row === undefined) {
      row = sheet.getLastRow() + 1;
    }
    const rows = values.length;
    if (!values[0] || !values[0].length) {
      throw new Error('No values provided');
    }
    const columns = values[0].length;
    const range = sheet.getRange(row, 1, rows, columns);
    range.setValues(values);
  }

  /**
   * Renames a sheet.
   *
   * @param sheetName The name of the sheet to rename.
   * @param newName The new name for the sheet.
   */
  renameSheet(sheetName: string, newName: string) {
    const sheet = this.getSheet(sheetName);
    sheet.setName(newName);
  }

  /**
   * Activates a sheet.
   *
   * @param sheetName The name of the sheet to activate.
   */
  activateSheet(sheetName: string) {
    const sheet = this.getSheet(sheetName);
    sheet.showSheet();
    sheet.activate();
  }

  /**
   * Deletes a sheet.
   *
   * @param sheetName The name of the sheet to delete.
   */
  deleteSheet(sheetName: string) {
    const sheet = this.getSheet(sheetName);
    this.spreadsheet.deleteSheet(sheet);
  }
}
