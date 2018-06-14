import React from "react";

import Button from "material-ui/Button";

export default class TextFileUploadButton extends React.Component {
  handleClick = () => {
    let input = document.createElement("input");
    input.type = "file";
    input.accept = this.props.accept;
    input.multiple = this.props.multiple ? true : false;
    input.onchange = () => {
      let reader = new FileReader();
      reader.onload = () => {
        this.props.onUpload({
          name: input.files[0].name,
          data: reader.result,
        });
      }
      reader.readAsText(input.files[0]);
    }
    input.click();
  }

  render() {
    return (
      <Button
        variant="raised"
        size="small"
        style={this.props.style}
        onClick={this.handleClick}
      >
        {this.props.children}
      </Button>
    );
  }
}