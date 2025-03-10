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
  Site,
  SitesPage,
} from 'google3/third_party/professional_services/solutions/child_sites_toolkit/app/typings/ad_manager_api';
import {AdManagerServerFault} from 'google3/third_party/professional_services/solutions/gam_apps_script/ad_manager_error';
import {AdManagerService} from 'google3/third_party/professional_services/solutions/gam_apps_script/ad_manager_service';
import {Statement} from 'google3/third_party/professional_services/solutions/gam_apps_script/typings/statement';

/**
 * Handles data retrieval and caching for the application.
 */
export class DataHandler {
  constructor(
    private readonly siteService: AdManagerService,
    private readonly activeSpreadsheet = SpreadsheetApp.getActive(),
  ) {}

  /**
   * Creates a new sheet for the given import ID.
   * @param importId The ID of the import process.
   * @return The newly created sheet.
   */
  private createSheet(importId: string) {
    const sheet = this.activeSpreadsheet.insertSheet(importId);
    sheet.hideSheet();
    const headers = [
      'Site ID',
      'URL',
      'Child Network Code',
      'Approval Status',
      'Code',
      'Last Approval Status Change',
      'Disapproval Reasons',
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return sheet;
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
    ) as SitesPage;
    return totalResultSetSize;
  }

  /**
   * Starts the sites import process.
   * @param importId The ID of the import process.
   * @param statement The PQL Statement to use to filter sites.
   * @param batchSize The number of sites to retrieve per batch.
   * @param maxResults The maximum number of sites to retrieve.
   * @return An object containing the statements and total results.
   */
  public startSitesImport(
    importId: string,
    statement: Statement,
    batchSize: number = 100,
    maxResults: number = 100_000,
  ): {statements: Statement[]; totalResults: number} {
    const query = statement.query.toLowerCase();
    if (query.includes('limit') || query.includes('offset')) {
      throw new Error('Limit and offset are not supported');
    }
    const totalResultSetSize = this.getResultSetSize(statement);
    this.createSheet(importId);
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
   * Adds sites to the sheet for the given import ID.
   * @param importId The ID of the import process.
   * @param sites The sites to add to the sheet.
   * @param row The starting row for the sites.
   */
  private addSitesToSheet(importId: string, sites: Site[], row: number) {
    const sheet = this.activeSpreadsheet.getSheetByName(importId);
    if (!sheet) {
      throw new Error(`Sheet ${importId} not found.`);
    }
    const rows = sites.map((site) => {
      return [
        site.id,
        site.url,
        site.childNetworkCode ?? '',
        site.approvalStatus,
        site.code,
        site.approvalStatusDateTime,
        site.disapprovalReasons ?? '',
      ];
    });
    sheet.getRange(row, 1, sites.length, rows[0]?.length).setValues(rows);
  }

  /**
   * Gets sites for a given import ID and statement.
   * @param importId The ID of the import process.
   * @param statement The statement to use to filter sites.
   * @param retries The number of times to retry the request.
   * @return The number of sites returned.
   */
  getSites(
    importId: string,
    statement: Statement,
    retries: number = 3,
  ): number {
    let sitesPage: SitesPage;
    try {
      sitesPage = this.siteService.performOperation(
        'getSitesByStatement',
        statement,
      ) as SitesPage;
    } catch (e) {
      console.log('getSites catch', e);
      if (e instanceof AdManagerServerFault && retries > 0) {
        return this.getSites(importId, statement, retries - 1);
      }
      throw e;
    }
    this.addSitesToSheet(importId, sitesPage.results, sitesPage.startIndex + 2);
    return sitesPage.results.length;
  }

  /**
   * Finishes the sites import process.
   * @param importId The ID of the import process.
   */
  finishSitesImport(importId: string) {
    const sheet = this.activeSpreadsheet.getSheetByName(importId);
    if (!sheet) {
      throw new Error(`Sheet ${importId} not found.`);
    }
    const date = new Date();
    sheet.setName(`Sites - ${date.toLocaleString()}`);
    sheet.showSheet();
    sheet.activate();
  }
}
