import React, { Component } from "react";

import Paper from "material-ui/Paper";

import TopBar from "./TopBar/TopBar";
import SideBar from "./SideBar";
import AssignmentPage from "./Assignment/AssignmentPage";

export default class App extends Component {
  constructor(props) {
    super(props);
  }

  handleOpenSidebar = () => {
    this.refSideBar.handleOpen();
  }

  render() {
    return (
      <div>
        <TopBar
          title="Athena Judge"
          onMenuClick={this.handleOpenSidebar}
        />
        <SideBar
          ref={(ref) => { this.refSideBar = ref; } }
        />
        <Paper
          elevation={4}
          style={{ marginTop: 80, maxWidth: 960, marginLeft: "auto", marginRight: "auto" }}
        >
          <AssignmentPage />
        </Paper>
        <div style={{ height: 120 }}></div>
      </div>
    );
  }
}