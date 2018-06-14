import React from "react";
import Axios from "axios";
import Config from "../Config";

import List, { ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction } from "material-ui/List";
import IconButton from "material-ui/IconButton";
import ClassIcon from "@material-ui/icons/Class";

import Welcome from "./Welcome";
import ClassPage from "./Class/ClassPage";
import ClassForm from "./Class/ClassForm";

export default class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: "Home",
      loading: false,
      classId: null
    };
  }

  showClass = (id) => {
    this.setState({ show: "ClassView", classId: id });
  }

  showCreateClass = () => {
    this.setState({ show: "ClassCreate" });
  }

  showHome = () => {
    this.setState({ show: "Home", classId: null });
  }

  cancelCreateClass = () => {
    if (this.state.classId != null)
      this.showClass(this.state.classId);
    else
      this.showHome();
  }

  handleCreateClass = (form) => {
    this.setState({ loading: true });
    Axios.post(Config.api + "/classes", {
      name: form.name,
      description: form.description,
      username: this.props.user.name,
      creatorGID: this.props.user.gid,
      photo: this.props.user.photo,
      email: this.props.user.email,
      type: "Creator"
    }).then((res) => {
      var resData = res;
      this.setState({ show: "Home", loading: false });
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
  }

  render() {
    return (
      <div>
        {this.state.show == "Home" &&
          <Welcome 
            onClassClick={this.showClass}
            onCreateClick={this.showCreateClass}
            user={this.props.user}
          />}
        {this.state.show == "ClassView" &&
          <ClassPage
            classId={this.state.classId}
            user={this.props.user}
          />}
        {this.state.show == "ClassCreate" &&
          <ClassForm
            onBack={this.cancelCreateClass}
            onSubmit={this.handleCreateClass}
          />}
      </div>
    );
  }
}