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
 * A map of child publishers indexed by child network code.
 */
export interface ChildPublisherMap {
  [childNetworkCode: string]: {
    id: string;
    name: string;
    childNetworkCode: string;
  };
}

/**
 * Manages user settings for the Child Sites Toolkit.
 */
export class UserSettings {
  private readonly networkCodeKey = 'networkCode';
  private readonly apiVersionKey = 'apiVersion';
  private readonly childPublishersKey = 'childPublishers';
  private readonly activeImportKey = 'activeImport';

  static readonly DEFAULT_API_VERSION = 'v202411';

  constructor(
    private readonly userProperties = PropertiesService.getUserProperties(),
  ) {}

  /**
   * Retrieves the configured network code for the current user.
   */
  get networkCode(): string | null {
    return this.userProperties.getProperty(this.networkCodeKey);
  }

  /**
   * Configures network code for the current user.
   *
   * @param networkCode The network code to value to set.
   */
  set networkCode(networkCode: string) {
    this.userProperties.setProperty(this.networkCodeKey, networkCode);
  }

  /**
   * Retrieves the configured Ad ManagerAPI version for the current user.
   */
  get adManagerApiVersion(): string {
    return (
      this.userProperties.getProperty(this.apiVersionKey) ??
      UserSettings.DEFAULT_API_VERSION
    );
  }

  /**
   * Configures the Ad Manager API version for the current user.
   *
   * @param apiVersion The API version to value to set.
   */
  set adManagerApiVersion(apiVersion: string) {
    this.userProperties.setProperty(this.apiVersionKey, apiVersion);
  }

  /**
   * Retrieves the cached child publishers for the current user's network.
   */
  get childPublishers(): ChildPublisherMap | null {
    const childPublishers = this.userProperties.getProperty(
      this.childPublishersKey,
    );
    if (!childPublishers) {
      return null;
    }
    return JSON.parse(childPublishers) as ChildPublisherMap;
  }

  /**
   * Configures the cached child publishers for the current user's network.
   *
   * @param childPublishers The child publishers to value to set.
   */
  set childPublishers(childPublishers: ChildPublisherMap) {
    this.userProperties.setProperty(
      this.childPublishersKey,
      JSON.stringify(childPublishers),
    );
  }
}
