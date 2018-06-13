import React, { Component } from "react";
import Axios from "axios";

import Paper from "material-ui/Paper";
import Button from "material-ui/Button";

import Config from "./Config";

import TopBar from "./TopBar/TopBar";
import SideBar from "./SideBar/SideBar";
import Main from "./Pages/Main";
import Welcome from "./Pages/Welcome";
import ClassPage from "./Pages/Class/ClassPage";
import ClassForm from "./Pages/Class/ClassForm";
import AssignStudentBox from "./DialogBox/AssignStudentBox";

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      show: "welcome",
      classid: null,
      dialogopen: false,
      loading: false,
      user: null,
    };
  }

  handleUserUpdate = (user) => {
    this.setState({ user: user });
  }

  handleOpenSidebar = () => {
    this.refSideBar.handleOpen();
  }

  handleOpenDialog = () => {
    this.setState({
      dialogopen: true
    });
  }

  handleCloseDialog = value => {
    this.setState({ dialogopen: false });
    if (value == "atividade") {
      this.refClassPage.showCreateAssignment();
    } else if (value == "aluno") {

    }
  }

  handleHomeClick = () => {
    this.main.showHome();
  }

  render() {
    return (
      <div>
        <TopBar
          title="Athena Judge"
          onMenuClick={this.handleOpenSidebar}
          user={this.state.user}
          onUserUpdate={this.handleUserUpdate}
        />
        <SideBar
          ref={(ref) => { this.refSideBar = ref; } }
          onHomeClick={this.handleHomeClick}
        />
        <Paper
          elevation={4}
          style={{ marginTop: 80, maxWidth: 960, marginLeft: "auto", marginRight: "auto" }}
        >
        <Main 
          ref={(ref) => { this.main = ref; } }
          user={this.state.user}
        />
        
        </Paper>
        <AssignStudentBox
          open={this.state.dialogopen}
          onClose={this.handleCloseDialog}
        />
        <div style={{ height: 120 }}></div>
      </div>
    );
  }
}