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

import {
  createMenu,
  onApiVersionSettingSelected,
  onNetworkCodeSettingSelected,
} from './app';
import {UserSettings} from './user_settings';

describe('input prompt for', () => {
  let mockPrompt: jasmine.Spy<
    (title: string) => GoogleAppsScript.Base.PromptResponse
  >;
  let mockUi: jasmine.SpyObj<GoogleAppsScript.Base.Ui>;
  let mockUserSettings: jasmine.SpyObj<UserSettings>;

  beforeEach(() => {
    mockPrompt = jasmine.createSpy('prompt');
    mockPrompt.and.returnValue({
      getSelectedButton: () => 'OK',
      getResponseText: () => '1234567890',
    } as unknown as GoogleAppsScript.Base.PromptResponse);

    mockUi = {
      ButtonSet: {
        OK_CANCEL: 'OK_CANCEL',
      },
      Button: {
        OK: 'OK',
      },
      prompt: mockPrompt,
      alert: jasmine.createSpy('alert', (message: string) => {}),
      createMenu: () => ({
        addItem: jasmine.createSpy('addItem'),
        addSubMenu: jasmine.createSpy('addSubMenu'),
        createSubMenu: jasmine.createSpy('createSubMenu'),
        addToUi: jasmine.createSpy('addToUi'),
      }),
    } as unknown as jasmine.SpyObj<GoogleAppsScript.Base.Ui>;
    mockUserSettings = jasmine.createSpyObj('UserSettings', [
      'networkCode',
      'adManagerApiVersion',
    ]);
  });

  describe('network code', () => {
    it('sets network code when valid input is provided', () => {
      onNetworkCodeSettingSelected(mockUserSettings, mockUi);
      expect(mockUserSettings.networkCode).toBe('1234567890');
    });

    it('does not save value when prompt is cancelled', () => {
      mockPrompt.and.returnValue({
        getSelectedButton: () => 'CANCEL',
        getResponseText: () => '1234567890',
      } as unknown as GoogleAppsScript.Base.PromptResponse);
      onNetworkCodeSettingSelected(mockUserSettings, mockUi);
      expect(mockUserSettings.networkCode).toHaveBeenCalledTimes(0);
    });

    it('alerts when invalid input is provided', () => {
      mockPrompt.and.returnValues(
        // first call: invalid input
        {
          getSelectedButton: () => 'OK',
          getResponseText: () => 'invalid',
        } as unknown as GoogleAppsScript.Base.PromptResponse,
        // second response: valid input
        {
          getSelectedButton: () => 'OK',
          getResponseText: () => '123456',
        } as unknown as GoogleAppsScript.Base.PromptResponse,
      ),
        onNetworkCodeSettingSelected(mockUserSettings, mockUi);
      // toBeCalledOnceWith doesn't work because Apps Script's Ui.prompt has
      // three overloads and the type checker doesn't know which one is called.
      const lastAlertCall = mockUi.alert.calls.mostRecent();
      expect(lastAlertCall.args).toEqual(['Invalid network code: invalid']);
    });

    it('opens a new prompt when invalid input is provided', () => {
      mockPrompt.and.returnValues(
        // first call: invalid input
        {
          getSelectedButton: () => 'OK',
          getResponseText: () => 'invalid',
        } as unknown as GoogleAppsScript.Base.PromptResponse,
        // second response: valid input
        {
          getSelectedButton: () => 'OK',
          getResponseText: () => '1234567890',
        } as unknown as GoogleAppsScript.Base.PromptResponse,
      );
      onNetworkCodeSettingSelected(mockUserSettings, mockUi);

      expect(mockPrompt).toHaveBeenCalledTimes(2);
    });
  });

  describe('ad manager api version', () => {
    it('sets api version when valid input is provided', () => {
      mockPrompt.and.returnValue({
        getSelectedButton: () => 'OK',
        getResponseText: () => 'v123456',
      } as unknown as GoogleAppsScript.Base.PromptResponse);
      onApiVersionSettingSelected(mockUserSettings, mockUi);
      expect(mockUserSettings.adManagerApiVersion).toBe('v123456');
    });

    it('does not save value when prompt is cancelled', () => {
      mockPrompt.and.returnValue({
        getSelectedButton: () => 'CANCEL',
        getResponseText: () => 'v123456',
      } as unknown as GoogleAppsScript.Base.PromptResponse);
      onNetworkCodeSettingSelected(mockUserSettings, mockUi);
      expect(mockUserSettings.networkCode).toHaveBeenCalledTimes(0);
    });

    it('alerts when invalid input is provided', () => {
      mockPrompt.and.returnValues(
        // first call: invalid input
        {
          getSelectedButton: () => 'OK',
          getResponseText: () => 'invalid',
        } as unknown as GoogleAppsScript.Base.PromptResponse,
        // second response: valid input
        {
          getSelectedButton: () => 'OK',
          getResponseText: () => 'v123456',
        } as unknown as GoogleAppsScript.Base.PromptResponse,
      ),
        onApiVersionSettingSelected(mockUserSettings, mockUi);
      // toBeCalledOnceWith doesn't work because Apps Script's Ui.prompt has
      // three overloads and the type checker doesn't know which one is called.
      const lastAlertCall = mockUi.alert.calls.mostRecent();
      expect(lastAlertCall.args).toEqual(['Invalid API Version: invalid']);
    });

    it('opens a new prompt when invalid input is provided', () => {
      mockPrompt.and.returnValues(
        // first call: invalid input
        {
          getSelectedButton: () => 'OK',
          getResponseText: () => 'invalid',
        } as unknown as GoogleAppsScript.Base.PromptResponse,
        // second response: valid input
        {
          getSelectedButton: () => 'OK',
          getResponseText: () => 'v123456',
        } as unknown as GoogleAppsScript.Base.PromptResponse,
      );
      onApiVersionSettingSelected(mockUserSettings, mockUi);

      expect(mockPrompt).toHaveBeenCalledTimes(2);
    });
  });
});

describe('createMenu', () => {
  let mockMenu: jasmine.SpyObj<GoogleAppsScript.Base.Menu>;
  let mockUi: jasmine.SpyObj<GoogleAppsScript.Base.Ui>;
  let mockUserSettings: jasmine.SpyObj<UserSettings>;

  beforeEach(() => {
    mockMenu = jasmine.createSpyObj('Menu', [
      'addItem',
      'addSubMenu',
      'createSubMenu',
      'addToUi',
    ]);
    mockUi = jasmine.createSpyObj('Ui', ['createMenu']);
    mockUi.createMenu.and.returnValue(mockMenu);
    mockUserSettings = jasmine.createSpyObj('UserSettings', [
      'networkCode',
      'adManagerApiVersion',
    ]);
    mockUserSettings.networkCode = '1234567890';
    mockUserSettings.adManagerApiVersion = 'v123456';
  });

  it('creates a menu called "Child Sites Toolkit"', () => {
    createMenu(mockUserSettings, mockUi);
    expect(mockUi.createMenu).toHaveBeenCalledWith('Child Sites Toolkit');
  });

  it('adds a menu item called "Hello, world!"', () => {
    createMenu(mockUserSettings, mockUi);
    expect(mockMenu.addItem).toHaveBeenCalledWith(
      'Hello, world!',
      'helloWorld',
    );
  });

  it('adds a sub-menu item called "Settings"', () => {
    createMenu(mockUserSettings, mockUi);
    expect(mockUi.createMenu).toHaveBeenCalledWith('Settings');
    expect(mockMenu.addSubMenu).toHaveBeenCalledOnceWith(
      mockUi.createMenu.calls.mostRecent().returnValue,
    );
  });

  it('adds an item to the settings sub-menu called: Network Code (value)', () => {
    createMenu(mockUserSettings, mockUi);
    const subMenu = mockMenu.addSubMenu.calls.mostRecent().args[0];
    expect(subMenu.addItem).toHaveBeenCalledWith(
      'Network Code (1234567890)',
      'onNetworkCodeSettingSelected',
    );
  });

  it('adds an item to the settings sub-menu called: Ad Manager API Version (value)', () => {
    createMenu(mockUserSettings, mockUi);
    const subMenu = mockMenu.addSubMenu.calls.mostRecent().args[0];
    expect(subMenu.addItem).toHaveBeenCalledWith(
      'Ad Manager API Version (v123456)',
      'onApiVersionSettingSelected',
    );
  });

  it('adds the menu to the UI', () => {
    createMenu(mockUserSettings, mockUi);
    expect(mockMenu.addToUi).toHaveBeenCalled();
  });
});
