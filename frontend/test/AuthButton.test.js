import React from "react";
import { mount } from 'enzyme';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

Enzyme.configure({ adapter: new Adapter() });
import AuthButton from "../src/TopBar/AuthButton.js";

describe("AuthButton", () => {
  let mountedAuthButton;
  const mountAuthButton = () => {
    if (!mountedAuthButton) {
      mountedAuthButton = mount(
        <AuthButton/>
      );
    }
    return mountedAuthButton ;
  }

  beforeEach(() => {
    mountedAuthButton  = undefined;//mountAuthButton();
  });

  it("Render one  Login Button if user IS NOT yet logged", () => {
  const lbs = mountAuthButton().find("LoginButton");
  expect(lbs.length).toBeGreaterThan(0);
  });


 
  
  // All tests will go here
});