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
 * @fileoverview Handles data retrieval and caching for the application.
 */

import {
  Company,
  Site,
  StatementResult,
} from './typings/ad_manager_api';
import {AdManagerServerFault} from 'gam_apps_script/ad_manager_error';
import {AdManagerService} from 'gam_apps_script/ad_manager_service';
import {Statement} from 'gam_apps_script/typings/statement';
import {ChildPublisherMap} from './user_settings';

/**
 * Handles data retrieval and caching for the application.
 */
export class DataHandler {
  constructor(
    private readonly siteService: AdManagerService,
    private readonly companyService: AdManagerService,
  ) {}

  /**
   * Fetches child publishers from the Ad Manager API.
   * @return A map of child publishers, keyed by child network code.
   */
  fetchChildPublishers(): ChildPublisherMap {
    const {results} = this.companyService.performOperation(
      'getCompaniesByStatement',
      {
        query: "WHERE type = 'CHILD_PUBLISHER'",
      },
    ) as StatementResult<Company>;
    if (!results) {
      return {};
    }
    const childPublisherList = results.map((company) => {
      return {
        id: company.id,
        name: company.name,
        childNetworkCode: company.childPublisher.childNetworkCode,
      };
    });
    const childPublishers: ChildPublisherMap = {};
    for (const childPublisher of childPublisherList) {
      childPublishers[childPublisher.childNetworkCode] = childPublisher;
    }
    return childPublishers;
  }

  /**
   * Gets the total result set size for a given statement.
   * @param statement The PQL Statement to use to filter sites.
   * @return The total result set size.
   */
  private getResultSetSize(statement: Statement): number {
    const query = statement.query + ' LIMIT 1';
    const {totalResultSetSize} = this.siteService.performOperation(
      'getSitesByStatement',
      {query, values: statement.values},
    ) as StatementResult<Site>;
    return totalResultSetSize;
  }

  /**
   * Starts the sites import process.
   * @param statement The PQL Statement to use to filter sites.
   * @param batchSize The number of sites to retrieve per batch.
   * @param maxResults The maximum number of sites to retrieve.
   * @return An object containing the statements and total results.
   */
  public getStatementsAndTotalResultsForSitesStatement(
    statement: Statement,
    batchSize: number = 100,
    maxResults: number = 100_000,
  ): {statements: Statement[]; totalResults: number} {
    const query = statement.query.toLowerCase();
    if (query.includes('limit') || query.includes('offset')) {
      throw new Error('Limit and offset are not supported');
    }
    const totalResultSetSize = this.getResultSetSize(statement);
    if (totalResultSetSize === 0) {
      throw new Error('No sites found');
    }
    const statements: Statement[] = [];
    const totalResults = Math.min(totalResultSetSize, maxResults);
    for (let i = 0; i < totalResults; i += batchSize) {
      statements.push({
        query: `${statement.query} LIMIT ${batchSize} OFFSET ${i}`,
        values: statement.values,
      });
    }
    return {'statements': statements, 'totalResults': totalResults};
  }

  /**
   * Gets sites for a given import ID and statement.
   * @param statement The statement to use to filter sites.
   * @param retries The number of times to retry the request.
   * @return The number of sites returned.
   */
  getSites(statement: Statement, retries: number = 3): StatementResult<Site> {
    let sitesPage: StatementResult<Site>;
    try {
      sitesPage = this.siteService.performOperation(
        'getSitesByStatement',
        statement,
      ) as StatementResult<Site>;
    } catch (e) {
      if (e instanceof AdManagerServerFault && retries > 0) {
        return this.getSites(statement, retries - 1);
      }
      throw e;
    }
    return sitesPage;
  }
}
