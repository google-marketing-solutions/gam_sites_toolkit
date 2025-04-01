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
import {Site, StatementResult} from './typings/ad_manager_api';

describe('DataHandler', () => {
  let mockSiteService: jasmine.SpyObj<AdManagerService>;
  let mockCompanyService: jasmine.SpyObj<AdManagerService>;

  beforeEach(() => {
    mockSiteService = jasmine.createSpyObj('AdManagerService', [
      'performOperation',
    ]);
    mockSiteService.performOperation.and.returnValue({
      results: [],
      startIndex: 0,
      totalResultSetSize: 250,
    });
    mockCompanyService = jasmine.createSpyObj('AdManagerService', [
      'performOperation',
    ]);
    mockCompanyService.performOperation.and.returnValue({
      results: [],
      startIndex: 0,
      totalResultSetSize: 250,
    });
  });

  describe('fetchChildPublishers', () => {
    it('returns a map of child publishers', () => {
      mockCompanyService.performOperation.and.returnValue({
        results: [
          {
            id: '1',
            name: 'Child Publisher 1',
            childPublisher: {childNetworkCode: '123'},
          },
          {
            id: '2',
            name: 'Child Publisher 2',
            childPublisher: {childNetworkCode: '456'},
          },
          {
            id: '3',
            name: 'Child Publisher 3',
            childPublisher: {childNetworkCode: '789'},
          },
        ],
        startIndex: 0,
        totalResultSetSize: 3,
      });
      const dataHandler = new DataHandler(mockSiteService, mockCompanyService);
      dataHandler.fetchChildPublishers();
      expect(dataHandler.fetchChildPublishers()).toEqual({
        '123': {id: '1', name: 'Child Publisher 1', childNetworkCode: '123'},
        '456': {id: '2', name: 'Child Publisher 2', childNetworkCode: '456'},
        '789': {id: '3', name: 'Child Publisher 3', childNetworkCode: '789'},
      });
    });

    it('uses getCompaniesByStatement to fetch child publishers', () => {
      const dataHandler = new DataHandler(mockSiteService, mockCompanyService);
      dataHandler.fetchChildPublishers();
      expect(mockCompanyService.performOperation).toHaveBeenCalledOnceWith(
        'getCompaniesByStatement',
        {
          query: "WHERE type = 'CHILD_PUBLISHER'",
        },
      );
    });
  });

  describe('getStatementsAndTotalResultsForSitesStatement', () => {
    it('throws an error if the query contains limit', () => {
      const statement = {
        query: 'SELECT * FROM sites LIMIT 100',
      };
      const dataHandler = new DataHandler(mockSiteService, mockCompanyService);
      expect(() => {
        dataHandler.getStatementsAndTotalResultsForSitesStatement(statement);
      }).toThrowError('Limit and offset are not supported');
    });

    it('throws an error if the query contains offset', () => {
      const statement = {
        query: 'SELECT * FROM sites OFFSET 100',
      };
      const dataHandler = new DataHandler(mockSiteService, mockCompanyService);
      expect(() => {
        dataHandler.getStatementsAndTotalResultsForSitesStatement(statement);
      }).toThrowError('Limit and offset are not supported');
    });

    it('returns a list of paginated statements and total results', () => {
      const dataHandler = new DataHandler(mockSiteService, mockCompanyService);
      const result = dataHandler.getStatementsAndTotalResultsForSitesStatement({
        query: 'query',
      });
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
  });

  describe('getSites', () => {
    it('calls getSitesByStatement with the provided statement', () => {
      const dataHandler = new DataHandler(mockSiteService, mockCompanyService);
      const statement = {
        query: 'query',
      };
      dataHandler.getSites(statement);
      expect(dataHandler.getSites(statement)).toEqual(
        mockSiteService.performOperation(
          'getSitesByStatement',
          statement,
        ) as StatementResult<Site>,
      );
    });

    it('retries the request if it fails', () => {
      let errorThrown = false;
      mockSiteService.performOperation.and.callFake(() => {
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
      const dataHandler = new DataHandler(mockSiteService, mockCompanyService);
      dataHandler.getSites({query: 'query'}, 1);
      expect(mockSiteService.performOperation).toHaveBeenCalledTimes(2);
    });
  });
});
