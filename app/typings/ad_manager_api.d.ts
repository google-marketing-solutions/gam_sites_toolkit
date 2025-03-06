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
 * @fileoverview Type definitions for the Ad Manager API.
 */

export declare interface AdManagerDate {
  year: number;
  month: number;
  day: number;
}

export declare interface AdManagerDateTime {
  date: AdManagerDate;
  hour: number;
  minute: number;
  second: number;
  timeZoneId: string;
}

export declare interface DisapprovalReason {
  type: 'CONTENT' | 'OWNERSHIP' | 'OTHER' | 'UNKNOWN';
  details: string;
}

export declare interface Site {
  id: number;
  url: string;
  childNetworkCode: string;
  approvalStatus:
    | 'DRAFT'
    | 'UNCHECKED'
    | 'APPROVED'
    | 'DISAPPROVED'
    | 'REQUIRES_REVIEW'
    | 'UNKNOWN';
  code: string;
  approvalStatusDateTime: AdManagerDateTime;
  disapprovalReasons: DisapprovalReason[];
}

export declare interface SitesPage {
  totalResultSetSize: number;
  startIndex: number;
  results: Site[];
}
