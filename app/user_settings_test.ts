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

import {UserSettings} from './user_settings';

describe('UserSettings', () => {
  let mockUserProperties: jasmine.SpyObj<GoogleAppsScript.Properties.Properties>;

  beforeEach(() => {
    mockUserProperties = jasmine.createSpyObj('UserProperties', [
      'getProperty',
      'setProperty',
    ]);
    
  });

  describe('networkCode', () => {
    it('returns null when no property is set', () => {
      mockUserProperties.getProperty.and.returnValue(null);
      const settings = new UserSettings(mockUserProperties);
      expect(settings.networkCode).toBeNull();
    });

    it('saves property when set', () => {
      const settings = new UserSettings(mockUserProperties);
      settings.networkCode = '1234567890';
      expect(mockUserProperties.setProperty).toHaveBeenCalledOnceWith(
        'networkCode',
        '1234567890',
      );
    });
  });

  describe('adManagerApiVersion', () => {
    it('returns default API version when no property is set', () => {
      mockUserProperties.getProperty.and.returnValue(null);
      const settings = new UserSettings(mockUserProperties);
      expect(settings.adManagerApiVersion).toEqual(
        UserSettings.DEFAULT_API_VERSION,
      );
    });

    it('saves property when set', () => {
      const settings = new UserSettings(mockUserProperties);
      settings.adManagerApiVersion = 'v202411';
      expect(mockUserProperties.setProperty).toHaveBeenCalledOnceWith(
        'apiVersion',
        'v202411',
      );
    });
  });
});
