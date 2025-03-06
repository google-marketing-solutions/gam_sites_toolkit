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

import {UserInterfaceHandler} from './user_interface_handler';
import {UserSettings} from './user_settings';

describe('UserInterfaceHandler', () => {
  let mockMenu: jasmine.SpyObj<GoogleAppsScript.Base.Menu>;
  let mockUi: jasmine.SpyObj<GoogleAppsScript.Base.Ui>;
  let mockUserSettings: jasmine.SpyObj<UserSettings>;
  let mockCreateHtmlTemplateFn: jasmine.Spy<
    (filename: string) => GoogleAppsScript.HTML.HtmlTemplate
  >;

  beforeEach(() => {
    mockMenu = jasmine.createSpyObj('Menu', [
      'addItem',
      'addSubMenu',
      'createSubMenu',
      'addToUi',
    ]);
    mockUi = {
      ButtonSet: {
        YES_NO: 'YES_NO',
      },
      Button: {
        YES: 'YES',
      },
      createMenu: jasmine.createSpy('createMenu'),
      alert: jasmine.createSpy('alert'),
      prompt: jasmine.createSpy('prompt'),
      showModalDialog: jasmine.createSpy('showModalDialog'),
    } as unknown as jasmine.SpyObj<GoogleAppsScript.Base.Ui>;
    mockUserSettings = jasmine.createSpyObj('UserSettings', [
      'networkCode',
      'adManagerApiVersion',
    ]);
    mockUi.createMenu.and.returnValue(mockMenu);
    mockUserSettings.networkCode = '1234567890';
    mockUserSettings.adManagerApiVersion = 'v123456';
    mockCreateHtmlTemplateFn = jasmine.createSpy('createHtmlTemplate');
  });

  describe('createMenu', () => {
    it('creates a menu called "Child Sites Toolkit"', () => {
      const handler = new UserInterfaceHandler(
        mockUi,
        mockUserSettings,
        mockCreateHtmlTemplateFn,
      );

      handler.createMenu();

      expect(mockUi.createMenu).toHaveBeenCalledWith('Child Sites Toolkit');
    });

    it('adds a menu item called "Import Child Sites"', () => {
      const handler = new UserInterfaceHandler(
        mockUi,
        mockUserSettings,
        mockCreateHtmlTemplateFn,
      );

      handler.createMenu();

      expect(mockMenu.addItem).toHaveBeenCalledWith(
        'Import Child Sites',
        UserInterfaceHandler.MENU_ITEM_IMPORT_CHILD_SITES,
      );
    });

    it('adds a sub-menu item called "Settings"', () => {
      const handler = new UserInterfaceHandler(
        mockUi,
        mockUserSettings,
        mockCreateHtmlTemplateFn,
      );

      handler.createMenu();

      expect(mockUi.createMenu).toHaveBeenCalledWith('Settings');
      expect(mockMenu.addSubMenu).toHaveBeenCalledOnceWith(
        mockUi.createMenu.calls.mostRecent().returnValue,
      );
    });

    it('adds an item to the settings sub-menu called: Network Code (value)', () => {
      const handler = new UserInterfaceHandler(
        mockUi,
        mockUserSettings,
        mockCreateHtmlTemplateFn,
      );

      handler.createMenu();

      const subMenu = mockMenu.addSubMenu.calls.mostRecent().args[0];
      expect(subMenu.addItem).toHaveBeenCalledWith(
        'Network Code (1234567890)',
        'showNetworkCodePrompt',
      );
    });

    it('adds an item to the settings sub-menu called: Ad Manager API Version (value)', () => {
      const handler = new UserInterfaceHandler(
        mockUi,
        mockUserSettings,
        mockCreateHtmlTemplateFn,
      );

      handler.createMenu();

      const subMenu = mockMenu.addSubMenu.calls.mostRecent().args[0];
      expect(subMenu.addItem).toHaveBeenCalledWith(
        'Ad Manager API Version (v123456)',
        'showApiVersionPrompt',
      );
    });

    it('adds the menu to the UI', () => {
      const handler = new UserInterfaceHandler(
        mockUi,
        mockUserSettings,
        mockCreateHtmlTemplateFn,
      );

      handler.createMenu();

      const mockMenu = mockUi.createMenu.calls.mostRecent().returnValue;
      expect(mockMenu.addToUi).toHaveBeenCalled();
    });
  });

  describe('showImportChildSitesDialog', () => {
    it('shows a confirmation alert with YES_NO buttons', () => {
      const handler = new UserInterfaceHandler(
        mockUi,
        mockUserSettings,
        mockCreateHtmlTemplateFn,
      );

      handler.showImportChildSitesDialog();

      expect(mockUi.alert).toHaveBeenCalledOnceWith(
        'Import Child Sites',
        'Please be aware that imported data will be visible to anyone with ' +
          'access to this Google Sheets file regardless of whether or not they ' +
          'have access to the data within Google Ad Manager. Do you wish to ' +
          'continue?',
        mockUi.ButtonSet.YES_NO,
      );
    });

    it('shows the import dialog when the user confirms', () => {
      mockUi.alert.and.returnValue(mockUi.Button.YES);
      const mockHtmlOutput = jasmine.createSpyObj('HtmlOutput', ['setHeight']);
      // mockHtmlOutput.getContent.and.returnValue('html');
      mockCreateHtmlTemplateFn.and.returnValue({
        evaluate: () => mockHtmlOutput,
      } as unknown as GoogleAppsScript.HTML.HtmlTemplate);
      const handler = new UserInterfaceHandler(
        mockUi,
        mockUserSettings,
        mockCreateHtmlTemplateFn,
      );

      handler.showImportChildSitesDialog();

      expect(mockUi.showModalDialog).toHaveBeenCalledOnceWith(
        mockCreateHtmlTemplateFn.calls
          .mostRecent()
          .returnValue.evaluate()
          .setHeight(200),
        'Import Sites',
      );
    });
  });

  describe('showNetworkCodePrompt', () => {
    it('sets the network code when a valid value is provided', () => {
      mockUi.prompt.and.returnValue({
        getSelectedButton: () => mockUi.Button.OK,
        getResponseText: () => '1234567890',
      } as unknown as GoogleAppsScript.Base.PromptResponse);
      const handler = new UserInterfaceHandler(
        mockUi,
        mockUserSettings,
        mockCreateHtmlTemplateFn,
      );

      handler.showNetworkCodePrompt();

      expect(mockUserSettings.networkCode).toBe('1234567890');
    });

    it('alerts when an invalid value is provided', () => {
      mockUi.prompt.and.returnValues(
        // first call: invalid input
        {
          getSelectedButton: () => mockUi.Button.OK,
          getResponseText: () => 'invalid',
        } as unknown as GoogleAppsScript.Base.PromptResponse,
        // second response: valid input
        {
          getSelectedButton: () => mockUi.Button.OK,
          getResponseText: () => '123456',
        } as unknown as GoogleAppsScript.Base.PromptResponse,
      );
      const handler = new UserInterfaceHandler(
        mockUi,
        mockUserSettings,
        mockCreateHtmlTemplateFn,
      );

      handler.showNetworkCodePrompt();

      // toBeCalledOnceWith doesn't work because Apps Script's Ui.prompt has
      // three overloads and the type checker doesn't know which one is called.
      const lastAlertCall = mockUi.alert.calls.mostRecent();
      expect(lastAlertCall.args).toEqual(['Invalid network code: invalid']);
    });

    it('opens a new prompt when invalid input is provided', () => {
      mockUi.prompt.and.returnValues(
        // first call: invalid input
        {
          getSelectedButton: () => mockUi.Button.OK,
          getResponseText: () => 'invalid',
        } as unknown as GoogleAppsScript.Base.PromptResponse,
        // second response: valid input
        {
          getSelectedButton: () => mockUi.Button.OK,
          getResponseText: () => '123456',
        } as unknown as GoogleAppsScript.Base.PromptResponse,
      );
      const handler = new UserInterfaceHandler(
        mockUi,
        mockUserSettings,
        mockCreateHtmlTemplateFn,
      );

      handler.showNetworkCodePrompt();

      expect(mockUi.prompt).toHaveBeenCalledTimes(2);
    });
  });

  describe('showApiVersionPrompt', () => {
    it('sets the api version when a valid value is provided', () => {
      mockUi.prompt.and.returnValue({
        getSelectedButton: () => mockUi.Button.OK,
        getResponseText: () => 'v123456',
      } as unknown as GoogleAppsScript.Base.PromptResponse);
      const handler = new UserInterfaceHandler(
        mockUi,
        mockUserSettings,
        mockCreateHtmlTemplateFn,
      );

      handler.showApiVersionPrompt();

      expect(mockUserSettings.adManagerApiVersion).toBe('v123456');
    });

    it('alerts when an invalid value is provided', () => {
      mockUi.prompt.and.returnValues(
        // first call: invalid input
        {
          getSelectedButton: () => mockUi.Button.OK,
          getResponseText: () => 'invalid',
        } as unknown as GoogleAppsScript.Base.PromptResponse,
        // second response: valid input
        {
          getSelectedButton: () => mockUi.Button.OK,
          getResponseText: () => 'v123456',
        } as unknown as GoogleAppsScript.Base.PromptResponse,
      );
      const handler = new UserInterfaceHandler(
        mockUi,
        mockUserSettings,
        mockCreateHtmlTemplateFn,
      );

      handler.showApiVersionPrompt();

      // toBeCalledOnceWith doesn't work because Apps Script's Ui.prompt has
      // three overloads and the type checker doesn't know which one is called.
      const lastAlertCall = mockUi.alert.calls.mostRecent();
      expect(lastAlertCall.args).toEqual(['Invalid API version: invalid']);
    });

    it('opens a new prompt when invalid input is provided', () => {
      mockUi.prompt.and.returnValues(
        // first call: invalid input
        {
          getSelectedButton: () => mockUi.Button.OK,
          getResponseText: () => 'invalid',
        } as unknown as GoogleAppsScript.Base.PromptResponse,
        // second response: valid input
        {
          getSelectedButton: () => mockUi.Button.OK,
          getResponseText: () => 'v123456',
        } as unknown as GoogleAppsScript.Base.PromptResponse,
      );
      const handler = new UserInterfaceHandler(
        mockUi,
        mockUserSettings,
        mockCreateHtmlTemplateFn,
      );

      handler.showApiVersionPrompt();

      expect(mockUi.prompt).toHaveBeenCalledTimes(2);
    });
  });
});
