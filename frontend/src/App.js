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

  showCreateClass = () => {
    this.refSideBar.handleClose();
    this.setState({ show: "createClass" });
  }

  showClass = (id) => {
    this.refSideBar.handleClose();
    this.setState({show: "class", classid: id});
  }

  cancelCreateClass = () => {
    if (this.state.classid != null)
      this.setState({show: "class"});
    else
      this.setState({show: "welcome"});
  }

  handleCreateClass = (form) => {
    this.setState({ loading: true });
    Axios.post(Config.api + "/classes", {
      name: form.name,
      description: form.description,
      // HARD CODED @italotabatinga
      professorID: "1234"
    }).then((res) => {
      this.setState({show: "welcome"});
      this.refSideBar.showList();
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
  }

  showHome = () => {
    this.main.showHome();
  }

  render() {
    return (
      <div>
        <TopBar
          title="Athena Judge"
          onHomeClick={this.showHome}
          user={this.state.user}
          onUserUpdate={this.handleUserUpdate}
        />
        <SideBar
          ref={(ref) => { this.refSideBar = ref; } }
          showClass = {this.showClass}
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