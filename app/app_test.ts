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
  SiteImportOutputFormat,
  TEST_ONLY,
} from './app';
import {DataHandler} from './data_handler';
import {SpreadsheetHandler} from './spreadsheet_handler';
import {AdManagerDateTime} from './typings/ad_manager_api';
import {UserInterfaceHandler} from './user_interface_handler';
import {UserSettings} from './user_settings';

const {setCallableFunctions} = TEST_ONLY;

describe('app', () => {
  let mockUserInterfaceHandler: jasmine.SpyObj<UserInterfaceHandler>;
  let mockUserSettings: jasmine.SpyObj<UserSettings>;
  let mockDataHandler: jasmine.SpyObj<DataHandler>;
  let mockSpreadsheetHandler: jasmine.SpyObj<SpreadsheetHandler>;

  beforeEach(() => {
    mockUserInterfaceHandler = jasmine.createSpyObj('UserInterfaceHandler', [
      'createMenu',
      'showYesNoDialog',
      'showImportSitesDialog',
      'showInputPrompt',
      'showAlert',
    ]);
    mockUserSettings = jasmine.createSpyObj('UserSettings', [
      'networkCode',
      'adManagerApiVersion',
    ]);
    mockDataHandler = jasmine.createSpyObj('DataHandler', [
      'fetchChildPublishers',
      'getStatementsAndTotalResultsForSitesStatement',
      'getSites',
    ]);
    mockSpreadsheetHandler = jasmine.createSpyObj('SpreadsheetHandler', [
      'createSheet',
      'insertValuesIntoSheet',
      'renameSheet',
      'activateSheet',
      'deleteSheet',
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

  describe('site import workflows', () => {
    beforeEach(() => {
      mockUserSettings.networkCode = '123456789';
      mockDataHandler.getStatementsAndTotalResultsForSitesStatement.and.returnValue(
        {
          statements: [{query: 'query'}],
          totalResults: 100,
        },
      );
      mockUserInterfaceHandler.showYesNoDialog.and.returnValue(true);
      // force valid input
      mockUserInterfaceHandler.showInputPrompt.and.callFake(
        (message, validPattern, onValidInput, onInvalidInput) => {
          if (onValidInput !== undefined) {
            onValidInput('inputDialogResult');
          }
        },
      );
    });

    const showImportSitesDialogTestCases = [
      {
        name: 'onImportAllSitesSelected',
        functionToTest: onImportAllSitesSelected,
        expectedSheetTitleWithoutDate: '[123456789] All Sites (',
        expectedSiteImportOutputFormat: SiteImportOutputFormat.COMBINED,
        expectedDialogTitle: 'Import All Sites',
        expectedStatements: [{query: 'query'}],
        expectedTotalResults: 100,
        expectedDialogDetails: 'Total results: 100',
      },
      {
        name: 'onImportFirstPartySitesSelected',
        functionToTest: onImportFirstPartySitesSelected,
        expectedSheetTitleWithoutDate: '[123456789] First Party Sites (',
        expectedSiteImportOutputFormat: SiteImportOutputFormat.FIRST_PARTY,
        expectedDialogTitle: 'Import First Party Sites',
        expectedStatements: [{query: 'query'}],
        expectedTotalResults: 100,
        expectedDialogDetails: 'Total results: 100',
      },
      {
        name: 'onImportChildSitesSelected',
        functionToTest: onImportChildSitesSelected,
        expectedSheetTitleWithoutDate: '[123456789] Child Sites (',
        expectedSiteImportOutputFormat: SiteImportOutputFormat.CHILD,
        expectedDialogTitle: 'Import Child Sites',
        expectedStatements: [{query: 'query'}],
        expectedTotalResults: 100,
        expectedDialogDetails: 'Total results: 100',
      },
      {
        name: 'onImportSitesByChildNetworkCodeSelected',
        functionToTest: onImportSitesByChildNetworkCodeSelected,
        expectedSheetTitleWithoutDate:
          '[123456789] Child Sites (inputDialogResult) (',
        expectedSiteImportOutputFormat: SiteImportOutputFormat.CHILD,
        expectedDialogTitle: 'Import Sites',
        expectedStatements: [{query: 'query'}],
        expectedTotalResults: 100,
        expectedDialogDetails: 'Total results: 100',
      },
      {
        name: 'onImportSitesByCustomQuerySelected',
        functionToTest: onImportSitesByCustomQuerySelected,
        expectedSheetTitleWithoutDate: '[123456789] inputDialogResult (',
        expectedSiteImportOutputFormat: SiteImportOutputFormat.COMBINED,
        expectedDialogTitle: 'Import Sites by Custom Query',
        expectedStatements: [{query: 'query'}],
        expectedTotalResults: 100,
        expectedDialogDetails: 'Total results: 100',
      },
    ];

    showImportSitesDialogTestCases.forEach((testCase) => {
      it(`${testCase.name} shows the import sites dialog`, () => {
        testCase.functionToTest(
          mockUserSettings,
          mockDataHandler,
          mockSpreadsheetHandler,
          mockUserInterfaceHandler,
        );

        expect(
          mockUserInterfaceHandler.showImportSitesDialog,
        ).toHaveBeenCalledOnceWith(
          testCase.expectedDialogTitle,
          // don't care about the exact date/time string
          jasmine.stringContaining(testCase.expectedSheetTitleWithoutDate),
          testCase.expectedSiteImportOutputFormat,
          testCase.expectedStatements,
          testCase.expectedTotalResults,
          testCase.expectedDialogDetails,
        );
      });
    });

    showImportSitesDialogTestCases.forEach((testCase) => {
      it(`${testCase.name} throws an error when there are no results`, () => {
        mockDataHandler.getStatementsAndTotalResultsForSitesStatement.and.throwError(
          'No sites found.',
        );
        expect(() => {
          testCase.functionToTest(
            mockUserSettings,
            mockDataHandler,
            mockSpreadsheetHandler,
            mockUserInterfaceHandler,
          );
        }).toThrowError('No sites found.');
      });
    });

    showImportSitesDialogTestCases.forEach((testCase) => {
      it(`${testCase.name} creates a sheet with headers`, () => {
        testCase.functionToTest(
          mockUserSettings,
          mockDataHandler,
          mockSpreadsheetHandler,
          mockUserInterfaceHandler,
        );
        expect(mockSpreadsheetHandler.createSheet).toHaveBeenCalledOnceWith(
          jasmine.any(String),
        );
        const expectedHeaders =
          testCase.expectedSiteImportOutputFormat ===
          SiteImportOutputFormat.FIRST_PARTY
            ? ['Site URL', 'Approval Status', 'Status Details']
            : [
                'Site URL',
                'Child Publisher',
                'Approval Status',
                'Status Details',
              ];
        expect(
          mockSpreadsheetHandler.insertValuesIntoSheet,
        ).toHaveBeenCalledOnceWith(jasmine.any(String), [expectedHeaders]);
      });
    });

    showImportSitesDialogTestCases.forEach((testCase) => {
      it(`${testCase.name} doesn't show the import sites dialog if the user cancels`, () => {
        mockUserInterfaceHandler.showYesNoDialog.and.returnValue(false);
        testCase.functionToTest(
          mockUserSettings,
          mockDataHandler,
          mockSpreadsheetHandler,
          mockUserInterfaceHandler,
        );
        expect(
          mockUserInterfaceHandler.showImportSitesDialog,
        ).toHaveBeenCalledTimes(0);
      });
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

  describe('getSites', () => {
    beforeEach(() => {
      mockUserSettings.networkCode = '123456789';
      mockUserSettings.childPublishers = {
        '1234': {
          id: '1',
          name: 'Child Publisher',
          childNetworkCode: '1234',
        },
      };
      mockDataHandler.getSites.and.returnValue({
        results: [
          {
            id: 1,
            url: 'url',
            childNetworkCode: '1234',
            approvalStatus: 'APPROVED',
            code: '',
            approvalStatusDateTime: {} as unknown as AdManagerDateTime,
            disapprovalReasons: [],
          },
          {
            id: 2,
            url: 'url2',
            childNetworkCode: '5678',
            approvalStatus: 'DISAPPROVED',
            code: '',
            approvalStatusDateTime: {} as unknown as AdManagerDateTime,
            disapprovalReasons: [],
          },
        ],
        startIndex: 0,
        totalResultSetSize: 2,
      });
    });

    it('returns the number of sites in the batch', () => {
      expect(
        getSites(
          'sheetTitle',
          {'query': 'q'},
          SiteImportOutputFormat.COMBINED,
          mockUserSettings,
          mockDataHandler,
          mockSpreadsheetHandler,
        ),
      ).toBe(2);
    });

    it('writes the sites to the sheet', () => {
      getSites(
        'sheetTitle',
        {'query': 'q'},
        SiteImportOutputFormat.COMBINED,
        mockUserSettings,
        mockDataHandler,
        mockSpreadsheetHandler,
      );
      expect(
        mockSpreadsheetHandler.insertValuesIntoSheet,
      ).toHaveBeenCalledOnceWith(
        'sheetTitle',
        [
          ['url', 'Child Publisher (1234)', 'Ready', ''],
          [
            'url2',
            '[Child Publisher Name Not Found] (5678)',
            'Needs attention',
            '',
          ],
        ],
        2,
      );
    });
  });

  describe('finishSitesImport', () => {
    it('shows the sheet with the results', () => {
      finishSitesImport('sheetTitle', mockSpreadsheetHandler);
      expect(mockSpreadsheetHandler.activateSheet).toHaveBeenCalledOnceWith(
        'sheetTitle',
      );
    });
  });

  describe('cancelSitesImport', () => {
    it('calls dataHandler.cancelSitesImport', () => {
      cancelSitesImport('sheetTitle', mockSpreadsheetHandler);
      expect(mockSpreadsheetHandler.deleteSheet).toHaveBeenCalledOnceWith(
        'sheetTitle',
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
