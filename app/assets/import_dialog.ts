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

let importId = crypto.randomUUID();

const statementQueue: Statement[] = [];

let elapsedTime = 0;

let activeRequests = 0;

let sitesLoaded = 0;

let totalResults: number;

function init(query: string) {
  setInterval(() => {
    elapsedTime++;
    updateProgress();
  }, 1000);
  console.log('init', query);
  google.script.run
    .withSuccessHandler(onImportStartedSuccess)
    ['callFunction']('startSitesImport', importId, query);
}

/**
 * Updates the progress bar and other UI elements.
 */
function updateProgress() {
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
  setElementInnerHtml(
    window.document.getElementById('total_results')!,
    sanitizeHtml(`Total Results: ${totalResults ?? 'Loading...'}`),
  );
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
      ['callFunction']('getSites', importId, statement);
  }
}

/**
 * Triggers when the startSitesImport call has completed. Queues the statements
 * for the import action.
 * @param result The result of the startSitesImport call.
 */
function onImportStartedSuccess(result: {
  totalResults: number;
  statements: Statement[];
}) {
  totalResults = result.totalResults;
  statementQueue.push(...result['statements']);
  processStatementQueue();
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
    ['callFunction']('finishSitesImport', importId);
}


