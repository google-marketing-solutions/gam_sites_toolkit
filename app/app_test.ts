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
  cancelSitesImport,
  createMenu,
  finishSitesImport,
  getSites,
  onImportAllSitesSelected,
  onImportChildSitesSelected,
  onImportFirstPartySitesSelected,
  onImportSitesByChildNetworkCodeSelected,
  onImportSitesByCustomQuerySelected,
  showApiVersionPrompt,
  showNetworkCodePrompt,
  startSitesImport,
  TEST_ONLY,
} from './app';
import {UserInterfaceHandler} from './user_interface_handler';
import {UserSettings} from './user_settings';
const {setCallableFunctions} = TEST_ONLY;

describe('app', () => {
  let mockUserInterfaceHandler: jasmine.SpyObj<UserInterfaceHandler>;
  let mockUserSettings: jasmine.SpyObj<UserSettings>;

  beforeEach(() => {
    mockUserInterfaceHandler = jasmine.createSpyObj('UserInterfaceHandler', [
      'createMenu',
      'showImportSitesDialog',
      'showInputPrompt',
      'showAlert',
    ]);
    mockUserSettings = jasmine.createSpyObj('UserSettings', [
      'networkCode',
      'adManagerApiVersion',
    ]);
  });

  describe('createMenu', () => {
    it('calls UserInterfaceHandler.createMenu', () => {
      mockUserSettings.networkCode = '123456789';
      mockUserSettings.adManagerApiVersion = 'v202405';
      const expectedMenu = {
        'Import Sites': {
          'All': 'onImportAllSitesSelected',
          'First Party': 'onImportFirstPartySitesSelected',
          'Children': 'onImportChildSitesSelected',
          'By Child Network Code': 'onImportSitesByChildNetworkCodeSelected',
          'By Custom Query': 'onImportSitesByCustomQuerySelected',
        },
        'Settings': {
          'Network Code (123456789)': 'showNetworkCodePrompt',
          'Ad Manager API Version (v202405)': 'showApiVersionPrompt',
        },
      };

      createMenu(mockUserInterfaceHandler, mockUserSettings);

      expect(mockUserInterfaceHandler.createMenu).toHaveBeenCalledOnceWith(
        'GAM Sites Toolkit',
        expectedMenu,
      );
    });
  });

  describe('onImportAllSitesSelected', () => {
    it('correctly calls UserInterfaceHandler.showImportSitesDialog', () => {
      onImportAllSitesSelected(mockUserInterfaceHandler);
      expect(
        mockUserInterfaceHandler.showImportSitesDialog,
      ).toHaveBeenCalledOnceWith('Import All Sites', '', false);
    });
  });

  describe('onImportFirstPartySitesSelected', () => {
    it('correctly calls UserInterfaceHandler.showImportSitesDialog', () => {
      onImportFirstPartySitesSelected(mockUserInterfaceHandler);
      expect(
        mockUserInterfaceHandler.showImportSitesDialog,
      ).toHaveBeenCalledOnceWith(
        'Import First Party Sites',
        "WHERE childNetworkCode = ''",
        false,
      );
    });
  });

  describe('onImportChildSitesSelected', () => {
    it('correctly calls UserInterfaceHandler.showImportSitesDialog', () => {
      onImportChildSitesSelected(mockUserInterfaceHandler);
      expect(
        mockUserInterfaceHandler.showImportSitesDialog,
      ).toHaveBeenCalledOnceWith(
        'Import Child Sites',
        "WHERE childNetworkCode != ''",
        false,
      );
    });
  });

  describe('onImportSitesByChildNetworkCodeSelected', () => {
    it('correctly calls UserInterfaceHandler.showInputPrompt', () => {
      onImportSitesByChildNetworkCodeSelected(mockUserInterfaceHandler);
      expect(mockUserInterfaceHandler.showInputPrompt).toHaveBeenCalledOnceWith(
        'Child Network Code',
        /^[0-9]+$/,
        jasmine.any(Function),
        jasmine.any(Function),
      );
    });

    it('for valid input, calls UserInterfaceHandler.showImportSitesDialog', () => {
      onImportSitesByChildNetworkCodeSelected(mockUserInterfaceHandler);
      const successCallback =
        mockUserInterfaceHandler.showInputPrompt.calls.mostRecent().args[2];

      if (successCallback !== undefined) {
        successCallback('123456789');
      } else {
        fail('successCallback is undefined');
      }

      expect(
        mockUserInterfaceHandler.showImportSitesDialog,
      ).toHaveBeenCalledOnceWith(
        'Import Sites by Child Network Code',
        "WHERE childNetworkCode = '123456789'",
        true,
      );
    });

    it('for invalid input, calls UserInterfaceHandler.showAlert', () => {
      onImportSitesByChildNetworkCodeSelected(mockUserInterfaceHandler);
      const failureCallback =
        mockUserInterfaceHandler.showInputPrompt.calls.mostRecent().args[3];

      if (failureCallback !== undefined) {
        failureCallback('abcdefg');
      } else {
        fail('failureCallback is undefined');
      }

      expect(mockUserInterfaceHandler.showAlert).toHaveBeenCalledOnceWith(
        'Invalid child network code: abcdefg',
      );
    });
  });

  describe('onImportSitesByCustomQuerySelected', () => {
    it('correctly calls UserInterfaceHandler.showInputPrompt', () => {
      onImportSitesByCustomQuerySelected(mockUserInterfaceHandler);
      expect(mockUserInterfaceHandler.showInputPrompt).toHaveBeenCalledOnceWith(
        'PQL Query',
        /.*/,
        jasmine.any(Function),
      );
    });

    it('for valid input, calls UserInterfaceHandler.showImportSitesDialog', () => {
      onImportSitesByCustomQuerySelected(mockUserInterfaceHandler);
      const successCallback =
        mockUserInterfaceHandler.showInputPrompt.calls.mostRecent().args[2];

      if (successCallback !== undefined) {
        successCallback('pql');
      } else {
        fail('successCallback is undefined');
      }

      expect(
        mockUserInterfaceHandler.showImportSitesDialog,
      ).toHaveBeenCalledOnceWith('Import Sites by PQL Query', 'pql', true);
    });
  });

  describe('showNetworkCodePrompt', () => {
    it('shows an input prompt for the network code', () => {
      showNetworkCodePrompt(mockUserInterfaceHandler, mockUserSettings);
      expect(mockUserInterfaceHandler.showInputPrompt).toHaveBeenCalledOnceWith(
        'Network Code',
        /^[0-9]+$/,
        jasmine.any(Function),
        jasmine.any(Function),
      );
    });

    it('updates the user settings when a valid network code is entered', () => {
      showNetworkCodePrompt(mockUserInterfaceHandler, mockUserSettings);
      const successCallback =
        mockUserInterfaceHandler.showInputPrompt.calls.mostRecent().args[2];

      if (successCallback !== undefined) {
        successCallback('123456789');
      } else {
        fail('successCallback is undefined');
      }

      expect(mockUserSettings.networkCode).toBe('123456789');
      expect(mockUserInterfaceHandler.createMenu).toHaveBeenCalledTimes(1);
    });

    it('prompts again when an invalid network code is entered', () => {
      showNetworkCodePrompt(mockUserInterfaceHandler, mockUserSettings);
      const failureCallback =
        mockUserInterfaceHandler.showInputPrompt.calls.mostRecent().args[3];

      if (failureCallback !== undefined) {
        failureCallback('abcdefg');
      } else {
        fail('failureCallback is undefined');
      }

      expect(mockUserInterfaceHandler.showAlert).toHaveBeenCalledOnceWith(
        'Invalid network code: abcdefg',
      );
      expect(mockUserInterfaceHandler.showInputPrompt).toHaveBeenCalledTimes(2);
    });
  });

  describe('showApiVersionPrompt', () => {
    it('shows an input prompt for the API version', () => {
      showApiVersionPrompt(mockUserInterfaceHandler, mockUserSettings);
      expect(mockUserInterfaceHandler.showInputPrompt).toHaveBeenCalledOnceWith(
        'Ad Manager API Version',
        /^v\d{6}$/,
        jasmine.any(Function),
        jasmine.any(Function),
      );
    });

    it('updates the user settings when a valid API version is entered', () => {
      showApiVersionPrompt(mockUserInterfaceHandler, mockUserSettings);
      const successCallback =
        mockUserInterfaceHandler.showInputPrompt.calls.mostRecent().args[2];

      if (successCallback !== undefined) {
        successCallback('v202405');
      } else {
        fail('successCallback is undefined');
      }

      expect(mockUserSettings.adManagerApiVersion).toBe('v202405');
      expect(mockUserInterfaceHandler.createMenu).toHaveBeenCalledTimes(1);
    });

    it('prompts again when an invalid API version is entered', () => {
      showApiVersionPrompt(mockUserInterfaceHandler, mockUserSettings);
      const failureCallback =
        mockUserInterfaceHandler.showInputPrompt.calls.mostRecent().args[3];

      if (failureCallback !== undefined) {
        failureCallback('1234');
      } else {
        fail('failureCallback is undefined');
      }

      expect(mockUserInterfaceHandler.showAlert).toHaveBeenCalledOnceWith(
        'Invalid API version: 1234',
      );
      expect(mockUserInterfaceHandler.showInputPrompt).toHaveBeenCalledTimes(2);
    });
  });

  describe('startChildSitesImport', () => {
    it('returns a string', () => {
      const mockDataHandler = jasmine.createSpyObj('DataHandler', [
        'startSitesImport',
      ]);
      expect(startSitesImport('importId', 'query', mockDataHandler)).toBe(
        mockDataHandler.startSitesImport('importId', {query: 'query'}),
      );
    });
  });

  describe('getSites', () => {
    it('returns dataHandler.getSites', () => {
      const mockDataHandler = jasmine.createSpyObj('DataHandler', ['getSites']);
      expect(getSites('importId', {'query': 'q'}, mockDataHandler)).toBe(
        mockDataHandler.getSites('importId', {'query': 'q'}),
      );
    });
  });

  describe('finishSitesImport', () => {
    it('calls dataHandler.finishSitesImport', () => {
      const mockDataHandler = jasmine.createSpyObj('DataHandler', [
        'finishSitesImport',
      ]);
      finishSitesImport('importId', mockDataHandler);
      expect(mockDataHandler.finishSitesImport).toHaveBeenCalledOnceWith(
        'importId',
      );
    });
  });

  describe('cancelSitesImport', () => {
    it('calls dataHandler.cancelSitesImport', () => {
      const mockDataHandler = jasmine.createSpyObj('DataHandler', [
        'cancelSitesImport',
      ]);
      cancelSitesImport('importId', mockDataHandler);
      expect(mockDataHandler.cancelSitesImport).toHaveBeenCalledOnceWith(
        'importId',
      );
    });
  });

  describe('callFunction', () => {
    it('calls the provided function with the provided arguments', () => {
      const mockFunctions = {
        'myCallableFunction': () => 'hello, world!',
      };
      setCallableFunctions(mockFunctions);
      const returnValue = callFunction('myCallableFunction', []);
      expect(returnValue).toBe('hello, world!');
    });

    it('throws an error when the function is not recognized', () => {
      expect(() => callFunction('invalidFunction')).toThrowError(
        'invalidFunction is not recognized.',
      );
    });
  });
});
