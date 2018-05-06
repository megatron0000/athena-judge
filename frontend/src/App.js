import React, { Component } from "react";
import Axios from "axios";

import Paper from "material-ui/Paper";
import Button from "material-ui/Button";
import AddIcon from "@material-ui/icons/Add";

import Config from "./Config";

import TopBar from "./TopBar/TopBar";
import SideBar from "./SideBar/SideBar";
import Welcome from "./Pages/Welcome";
import ClassPage from "./Pages/Class/ClassPage";
import ClassForm from "./Pages/Class/ClassForm";

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      show: "welcome",
      classid: null,
      loading: false
    };
  }

  handleOpenSidebar = () => {
    this.refSideBar.handleOpen();
  }

  showCreateClass = () => {
    this.refSideBar.handleClose();
    this.setState({ show: "createClass" });
  }

  showClass = (id) => {
    this.setState({show: "class", classid: id});
  }

  cancelCreateClass = () => {
    if (this.state.classid != null)
      this.setState(show: "class");
    else
      this.setState(show: "welcome");
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

  render() {
    return (
      <div>
        <TopBar
          title="Athena Judge"
          onMenuClick={() => {
            this.handleOpenSidebar();
            this.setState({show: "sidebar"});
          } }
        />
        <SideBar
          ref={(ref) => { this.refSideBar = ref; } }
          showClass = {this.showClass}
        />
        <Paper
          elevation={4}
          style={{ marginTop: 80, maxWidth: 960, marginLeft: "auto", marginRight: "auto" }}
        >
        { this.state.show == "welcome" && 
          <Welcome /> }
        { this.state.show == "class" && 
          <ClassPage 
            classid = {this.state.classid}
          /> }
        { this.state.show == "createClass" && 
          <ClassForm 
            onBack = {this.cancelCreateClass}
            onSubmit = {this.handleCreateClass}
          /> }
        </Paper>
        <Button
          variant="fab"
          color="secondary"
          style={{ position: "fixed", right: 32, bottom: 32, zIndex: 10000 }}
          onClick={() => {
              { this.state.show == "sidebar" && 
                this.showCreateClass()
              }
            }
          }
        >
          <AddIcon />
        </Button>
        <div style={{ height: 120 }}></div>
      </div>
    );
  }
}