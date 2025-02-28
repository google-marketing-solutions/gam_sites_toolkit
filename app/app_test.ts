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

import {
  callFunction,
  createMenu,
  showApiVersionPrompt,
  showImportChildSitesDialog,
  showNetworkCodePrompt,
  startChildSitesImport,
} from './app';
import {UserInterfaceHandler} from './user_interface_handler';
import {UserSettings} from './user_settings';

describe('app', () => {
  let mockUserInterfaceHandler: jasmine.SpyObj<UserInterfaceHandler>;
  let mockUserSettings: jasmine.SpyObj<UserSettings>;

  beforeEach(() => {
    mockUserInterfaceHandler = jasmine.createSpyObj('UserInterfaceHandler', [
      'createMenu',
      'showImportChildSitesDialog',
      'showNetworkCodePrompt',
      'showApiVersionPrompt',
    ]);
    mockUserSettings = jasmine.createSpyObj('UserSettings', [
      'networkCode',
      'adManagerApiVersion',
    ]);
  });

  describe('createMenu', () => {
    it('calls UserInterfaceHandler.createMenu', () => {
      createMenu(mockUserInterfaceHandler);
      expect(mockUserInterfaceHandler.createMenu).toHaveBeenCalledTimes(1);
    });
  });

  describe('showImportChildSitesDialog', () => {
    it('calls UserInterfaceHandler.showImportChildSitesDialog', () => {
      showImportChildSitesDialog(mockUserInterfaceHandler);
      expect(
        mockUserInterfaceHandler.showImportChildSitesDialog,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe('showNetworkCodePrompt', () => {
    it('calls UserInterfaceHandler.showNetworkCodePrompt', () => {
      showNetworkCodePrompt(mockUserInterfaceHandler);
      expect(
        mockUserInterfaceHandler.showNetworkCodePrompt,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe('showApiVersionPrompt', () => {
    it('calls UserInterfaceHandler.showApiVersionPrompt', () => {
      showApiVersionPrompt(mockUserInterfaceHandler);
      expect(
        mockUserInterfaceHandler.showApiVersionPrompt,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe('startChildSitesImport', () => {
    it('returns a string', () => {
      expect(startChildSitesImport()).toBe('hello, importer');
    });
  });

  describe('callFunction', () => {
    it('calls the provided function with the provided arguments', () => {
      const mockFunctions = {
        'myCallableFunction': () => 'hello, world!',
      };
      const returnValue = callFunction('myCallableFunction', [], mockFunctions);
      expect(returnValue).toBe('hello, world!');
    });

    it('throws an error when the function is not recognized', () => {
      expect(() => callFunction('invalidFunction')).toThrowError(
        'invalidFunction is not recognized.',
      );
    });
  });
});
