import React from "react";

import Button from "@material-ui/core/Button";

export default class TextFileUploadButton extends React.Component {
  handleClick = () => {
    let input = document.createElement("input");
    input.type = "file";
    input.accept = this.props.accept;
    input.multiple = this.props.multiple ? true : false;
    input.onchange = () => {
      let reader = new FileReader();
      let current = -1;
      function readNext() {
        current++;
        if (current < input.files.length) {
          reader.readAsText(input.files[current]);
        }
      }
      reader.onload = () => {
        this.props.onUpload({
          name: input.files[current].name,
          data: reader.result,
        });
        readNext();
      }
      readNext();
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