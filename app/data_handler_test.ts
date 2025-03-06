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

import {AdManagerServerFault} from 'google3/third_party/professional_services/solutions/gam_apps_script/ad_manager_error';
import {AdManagerService} from 'google3/third_party/professional_services/solutions/gam_apps_script/ad_manager_service';
import {DataHandler} from './data_handler';

describe('DataHandler', () => {
  let mockSpreadsheet: jasmine.SpyObj<GoogleAppsScript.Spreadsheet.Spreadsheet>;
  let mockService: jasmine.SpyObj<AdManagerService>;

  beforeEach(() => {
    mockSpreadsheet = jasmine.createSpyObj('Spreadsheet', [
      'getSheetByName',
      'insertSheet',
      'hideSheet',
    ]);
    mockService = jasmine.createSpyObj('AdManagerService', [
      'performOperation',
    ]);
    const mockRange = jasmine.createSpyObj('Range', ['setValues']);
    const mockSheet = jasmine.createSpyObj('Sheet', [
      'getRange',
      'hideSheet',
      'setName',
      'showSheet',
      'activate',
    ]);
    mockSheet.getRange.and.returnValue(mockRange);
    mockSpreadsheet.getSheetByName.and.returnValue(mockSheet);
    mockSpreadsheet.insertSheet.and.returnValue(mockSheet);

    mockService.performOperation.and.returnValue({
      results: [],
      startIndex: 0,
      totalResultSetSize: 250,
    });
  });

  describe('startSitesImport', () => {
    it('throws an error if the query contains limit', () => {
      const statement = {
        query: 'SELECT * FROM sites LIMIT 100',
      };
      const dataHandler = new DataHandler(mockService, mockSpreadsheet);
      expect(() => {
        dataHandler.startSitesImport('importId', statement);
      }).toThrowError('Limit and offset are not supported');
    });

    it('throws an error if the query contains offset', () => {
      const statement = {
        query: 'SELECT * FROM sites OFFSET 100',
      };
      const dataHandler = new DataHandler(mockService, mockSpreadsheet);
      expect(() => {
        dataHandler.startSitesImport('importId', statement);
      }).toThrowError('Limit and offset are not supported');
    });

    it('creates a hidden sheet with headers for the import', () => {
      const dataHandler = new DataHandler(mockService, mockSpreadsheet);
      dataHandler.startSitesImport('importId', {query: ''});
      expect(mockSpreadsheet.insertSheet).toHaveBeenCalledTimes(1);
      const sheet = mockSpreadsheet.insertSheet();
      expect(sheet.hideSheet).toHaveBeenCalledTimes(1);
      expect(sheet.getRange(1, 1, 1, 7).setValues).toHaveBeenCalledTimes(1);
    });

    it('returns a list of paginated statements and total results', () => {
      const dataHandler = new DataHandler(mockService, mockSpreadsheet);
      const result = dataHandler.startSitesImport('importId', {query: 'query'});
      expect(result.statements).toEqual([
        {
          query: 'query LIMIT 100 OFFSET 0',
          values: undefined,
        },
        {
          query: 'query LIMIT 100 OFFSET 100',
          values: undefined,
        },
        {
          query: 'query LIMIT 100 OFFSET 200',
          values: undefined,
        },
      ]);
      expect(result.totalResults).toBe(250);
    });

    describe('getSites', () => {
      it('calls getSitesByStatement with the provided statement', () => {
        const dataHandler = new DataHandler(mockService, mockSpreadsheet);
        const statement = {
          query: 'query',
        };
        dataHandler.getSites('importId', statement);
        expect(mockService.performOperation).toHaveBeenCalledWith(
          'getSitesByStatement',
          statement,
        );
      });

      it('adds the sites to the sheet', () => {
        const dataHandler = new DataHandler(mockService, mockSpreadsheet);
        dataHandler.getSites('importId', {query: 'query'});
        const sheet = mockSpreadsheet.getSheetByName('importId');
        expect(sheet?.getRange(2, 1, 0, 7).setValues).toHaveBeenCalled();
      });

      it('retries the request if it fails', () => {
        let errorThrown = false;
        mockService.performOperation.and.callFake(() => {
          if (!errorThrown) {
            errorThrown = true;
            throw new AdManagerServerFault({message: 'error', errors: []});
          } else {
            return {
              results: [],
              startIndex: 0,
              totalResultSetSize: 250,
            };
          }
        });
        const dataHandler = new DataHandler(mockService, mockSpreadsheet);
        dataHandler.getSites('importId', {query: 'query'}, 1);
        expect(mockService.performOperation).toHaveBeenCalledTimes(2);
      });
    });

    describe('finishSitesImport', () => {
      it('changes the sheet name', () => {
        const dataHandler = new DataHandler(mockService, mockSpreadsheet);
        dataHandler.finishSitesImport('importId');
        const sheet = mockSpreadsheet.getSheetByName('importId');
        expect(sheet?.setName).toHaveBeenCalled();
      });

      it('shows the sheet', () => {
        const dataHandler = new DataHandler(mockService, mockSpreadsheet);
        dataHandler.finishSitesImport('importId');
        const sheet = mockSpreadsheet.getSheetByName('importId');
        expect(sheet?.showSheet).toHaveBeenCalled();
        expect(sheet?.activate).toHaveBeenCalled();
      });
    });
  });
});
