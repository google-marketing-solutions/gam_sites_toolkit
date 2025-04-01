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

import {Statement} from 'google3/third_party/professional_services/solutions/gam_apps_script/typings/statement';
import {sanitizeHtml} from 'safevalues';
import {setElementInnerHtml} from 'safevalues/dom';

let importId: string;

let statementQueue: Statement[] = [];

let elapsedTime = 0;

let importActive = true;

let activeRequests = 0;

let sitesLoaded = 0;

let totalResults: number;

/**
 * Initializes the import sites dialog.
 * @param id The id of the import process.
 * @param statements The statements to use for importing sites.
 * @param numResults The total number of results to import.
 * @param details The details of the import.
 */
function init(
  id: string,
  statements: Statement[],
  numResults: number,
  details: string,
) {
  if (numResults === 0) {
    onErrorLoadingSites(new Error('No sites found.'));
    return;
  }
  totalResults = numResults;
  setElementInnerHtml(
    window.document.getElementById('total_results')!,
    sanitizeHtml(`Total Results: ${totalResults}`),
  );
  if (details) {
    const detailsElement = window.document.getElementById('details')!;
    setElementInnerHtml(detailsElement, sanitizeHtml(details));
    detailsElement.style.display = 'block';
  }
  importActive = true;
  importId = id;
  statementQueue.push(...statements);
  processStatementQueue();
  setInterval(updateProgress, 1000);
}

/**
 * Updates the progress bar and other UI elements.
 */
function updateProgress() {
  if (!importActive || !totalResults) {
    return;
  }
  elapsedTime++;
  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;
  const elapsedTimeString = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  setElementInnerHtml(
    window.document.getElementById('elapsed_time')!,
    sanitizeHtml(`Elapsed Time: ${elapsedTimeString}`),
  );
  const progress = (sitesLoaded / totalResults) * 100;
  window.document.getElementById('progress-bar')!.style.width = `${progress}%`;
  setElementInnerHtml(
    window.document.getElementById('sites_loaded')!,
    sanitizeHtml(`Sites Loaded: ${sitesLoaded}`),
  );
}

/**
 * Handles an error that occurs during the import process.
 * @param error The error that occurred.
 */
function onErrorLoadingSites(error: unknown) {
  console.error(error);
  importActive = false;
  // clear the queue
  statementQueue = [];
  setElementInnerHtml(
    window.document.getElementById('total_results')!,
    sanitizeHtml(`Total Results:`),
  );
  const errorElement = window.document.getElementById('error-message')!;
  setElementInnerHtml(
    errorElement,
    sanitizeHtml(`Error loading sites: ${error}`),
  );
  errorElement.style.display = 'block';
  google.script.run['callFunction']('cancelSitesImport', importId);
}

/**
 * Processes the statement queue by calling getSites for each statement.
 */
function processStatementQueue() {
  while (activeRequests < 30 && statementQueue.length > 0) {
    const statement = statementQueue.shift() ?? {};
    activeRequests++;
    google.script.run
      .withSuccessHandler(onSitesLoadedSuccess)
      .withFailureHandler(onErrorLoadingSites)
      ['callFunction']('getSites', importId, statement);
  }
}

/**
 * Triggers when a batch of sites has been loaded. Checks if all sites have been
 * loaded.
 * @param sitesLoadedInBatch The number of sites loaded in the batch.
 */
function onSitesLoadedSuccess(sitesLoadedInBatch: number) {
  activeRequests--;
  sitesLoaded += sitesLoadedInBatch;
  if (sitesLoaded === totalResults) {
    onAllSitesLoaded();
  } else {
    processStatementQueue();
  }
}

/**
 * Handles the success of the finishSitesImport call.
 */
function onImportFinishedSuccess() {
  google.script.host.close();
}

/**
 * Handles the event when all sites have been loaded.
 */
function onAllSitesLoaded() {
  google.script.run
    .withSuccessHandler(onImportFinishedSuccess)
    .withFailureHandler(onErrorLoadingSites)
    ['callFunction']('finishSitesImport', importId);
}


