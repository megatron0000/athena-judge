import React from "react";
import { mount } from 'enzyme';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

Enzyme.configure({ adapter: new Adapter() });
import App from "../src/App.js";

describe("App", () => {
  let props;
  let mountedApp;
  const mountApp = () => {
    if (!mountedApp) {
      mountedApp = mount(
        <App/>
      );
    }
    return mountedApp;
  }

  beforeEach(() => {
    props = {
      wallpaperPath: undefined,
      userInfoMessage: undefined,
      onUnlocked: undefined,
    };
    mountedApp = undefined;
  });

  it("Always renders a div", () => {
  const divs = mountApp().find("div");
  expect(divs.length).toBeGreaterThan(0);
  });

  it("Always renders a 'Side Bar'", () => {
  expect(mountApp().find('SideBar').length).toBe(1);
});

  it("Always renders a 'Top Bar'", () => {
  expect(mountApp().find('TopBar').length).toBe(1);
});

  it("Always renders a 'Main'", () => {
  expect(mountApp().find('Main').length).toBe(1);
});
  
  // All tests will go here
});