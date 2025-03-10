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
    mockUi.createMenu.and.returnValue(mockMenu);
    mockCreateHtmlTemplateFn = jasmine.createSpy('createHtmlTemplate');
  });

  describe('createMenu', () => {
    it('creates a menu with th given name', () => {
      const handler = new UserInterfaceHandler(
        mockUi,
        mockCreateHtmlTemplateFn,
      );

      handler.createMenu('Child Sites Toolkit', {});

      expect(mockUi.createMenu).toHaveBeenCalledWith('Child Sites Toolkit');
    });

    it('adds menu items', () => {
      const handler = new UserInterfaceHandler(
        mockUi,
        mockCreateHtmlTemplateFn,
      );

      handler.createMenu('Child Sites Toolkit', {
        'Menu Item #1': 'menu_item_1',
        'Menu Item #2': 'menu_item_2',
      });

      expect(mockMenu.addItem).toHaveBeenCalledWith(
        'Menu Item #1',
        'menu_item_1',
      );
      expect(mockMenu.addItem).toHaveBeenCalledWith(
        'Menu Item #2',
        'menu_item_2',
      );
    });

    it('add sub menus', () => {
      const handler = new UserInterfaceHandler(
        mockUi,
        mockCreateHtmlTemplateFn,
      );

      handler.createMenu('Child Sites Toolkit', {
        'Menu Item #1': 'menu_item_1',
        'Sub Menu': {
          'Sub Menu Item #1': 'sub_menu_item_1',
          'Sub Menu Item #2': 'sub_menu_item_2',
        },
      });

      expect(mockMenu.addItem).toHaveBeenCalledWith(
        'Menu Item #1',
        'menu_item_1',
      );
      expect(mockUi.createMenu).toHaveBeenCalledTimes(2);
      expect(mockUi.createMenu).toHaveBeenCalledWith('Sub Menu');
      expect(mockMenu.addSubMenu).toHaveBeenCalledOnceWith(
        mockUi.createMenu.calls.mostRecent().returnValue,
      );
    });

    it('adds the menu to the UI', () => {
      const handler = new UserInterfaceHandler(
        mockUi,
        mockCreateHtmlTemplateFn,
      );

      handler.createMenu('Child Sites Toolkit', {});

      const mockMenu = mockUi.createMenu.calls.mostRecent().returnValue;
      expect(mockMenu.addToUi).toHaveBeenCalled();
    });
  });
});
