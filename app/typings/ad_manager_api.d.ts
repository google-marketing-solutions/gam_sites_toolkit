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

export declare interface ChildPublisher {
  approvedDelegationType: 'UNKNOWN' | 'MANAGE_ACCOUNT' | 'MANAGE_INVENTORY';
  proposedDelegationType: 'UNKNOWN' | 'MANAGE_ACCOUNT' | 'MANAGE_INVENTORY';
  status: 'UNKNOWN' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
  accountStatus:
    | 'UNKNOWN'
    | 'INVITED'
    | 'DECLINED'
    | 'PENDING_GOOGLE_APPROVAL'
    | 'APPROVED'
    | 'CLOSED_POLICY_VIOLATION'
    | 'CLOSED_INVALID_ACTIVITY'
    | 'CLOSED_BY_PUBLISHER'
    | 'DISAPPROVED_INELIGIBLE'
    | 'DISAPPROVED_DUPLICATE_ACCOUNT'
    | 'EXPIRED'
    | 'INACTIVE'
    | 'DEACTIVATED_BY_AD_MANAGER';
  childNetworkCode: string;
  sellerId: string;
  proposedRevenueShareMillipercent: number;
  onboardingTasks: (
    | 'UNKNOWN'
    | 'BILLING_PROFILE_CREATION'
    | 'PHONE_PIN_VERIFICATION'
    | 'AD_MANAGER_ACCOUNT_SETUP'
  )[];
}

export declare interface Company {
  id: string;
  name: string;
  type:
    | 'HOUSE_ADVERTISER'
    | 'HOUSE_AGENCY'
    | 'ADVERTISER'
    | 'AGENCY'
    | 'AD_NETWORK'
    | 'PARTNER'
    | 'CHILD_PUBLISHER'
    | 'VIEWABILITY_PROVIDER'
    | 'UNKNOWN';
  address: string;
  email: string;
  faxPhone: string;
  primaryPhone: string;
  externalId: string;
  comment: string;
  creditStatus: 'ACTIVE' | 'ON_HOLD' | 'CREDIT_STOP' | 'INACTIVE' | 'BLOCKED';
  appliedLabels: {labelId: string; isNegated: boolean};
  primaryContactId: number;
  appliedTeamIds: number[];
  thirdPartyCompanyId: number;
  lastModifiedDateTime: AdManagerDateTime;
  childPublisher: ChildPublisher;
  // Not defining types for ViewabilityProvider as its not used by the toolkit.
  // viewabilityProvider: ViewabilityProvider;
}

export declare interface StatementResult<T> {
  totalResultSetSize: number;
  startIndex: number;
  results: T[];
}
