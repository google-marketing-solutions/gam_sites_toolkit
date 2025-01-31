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
 * Hello, world!
 */
function helloWorld(): void {
  SpreadsheetApp.getActiveSpreadsheet().toast('Hello, world!');
}

/**
 * Creates a menu to serve as the entry point for the application.
 */
function createMenu() {
  SpreadsheetApp.getUi()
    .createMenu('Child Sites Toolkit')
    .addItem('Hello, world!', 'helloWorld')
    .addToUi();
}



