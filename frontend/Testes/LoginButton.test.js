import React from "react";
import { mount,shallow } from 'enzyme';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

Enzyme.configure({ adapter: new Adapter() });
import LoginButton from "../src/TopBar/LoginButton.js";

  const setup = propOverrides => {
  const props = Object.assign({
    enabled : true,
    onClick:jest.fn(),
  }, propOverrides)

  const wrapper = mount(<LoginButton {...props} />)

  return {
    props,
    wrapper,
    button: wrapper.find('Button'),
  }
}



describe("LoginButton", () => {


  it("If Login Button is clicked OnClick props function should be called", () => {
  const { button, props } = setup()
  button.simulate('click')
  expect(props.onClick).toHaveBeenCalled()
  });


 
  
  // All tests will go here
});