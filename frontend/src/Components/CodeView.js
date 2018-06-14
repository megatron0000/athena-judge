import React from "react";

export default class CodeView extends React.Component {
  render() {
    return (<div style={{
      fontFamily: "monospace",
      whiteSpace: "pre",
      border: "1px solid #CCC",
      backgroundColor: "#EEE",
      padding: 6,
    }}>
      {this.props.children}
    </div>);
  }
}