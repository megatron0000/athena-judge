import React from "react";

import Typography from "@material-ui/core/Typography";

import CodeView from "../Components/CodeView";

export default class SubmissionResult extends React.Component{
  render() {
    return (
      <div style={{ display: "flex", marginBottom: 22 }}>
        <div style={{ flex: 1, marginRight: 11 }}>
          <Typography variant="caption">Entrada:</Typography>
          <CodeView>{ this.props.result.input }</CodeView>
        </div>
        <div style={{ flex: 1, marginLeft: 11,  marginRight: 11 }}>
          <Typography variant="caption">Saída esperada:</Typography>
          <CodeView>{ this.props.result.expectedOutput }</CodeView>
        </div>
        <div style={{ flex: 1, marginLeft: 11 }}>
          <Typography variant="caption">Saída obtida:</Typography>
          <CodeView>{ this.props.result.actualOutput }</CodeView>
        </div>
      </div>
    );
  }
}