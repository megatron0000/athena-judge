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
      show: "home",
      loading: false
    };
  }

  showClass = (id) => {
    this.setState({show: "class", classid: id});
  }

  showCreateClass = () => {
    this.setState({ show: "createClass" });
  }

  showHome = () => {
    this.setState({ show: "home", classid: null });
    // this.actualPage.getClassesList();
  }

  cancelCreateClass = () => {
    if (this.state.classid != null)
      this.showClass(this.state.classid);
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
      this.setState({show: "home"});
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
  }

  render() {
    return (
      <div>
        {this.state.show == "home" &&
          <Welcome 
            showClass = { this.showClass }
            showCreateClass={this.showCreateClass}
            user = {this.props.user}
            ref={(ref) => { this.actualPage = ref; }}
          />}
        {this.state.show == "class" &&
          <ClassPage
            ref={(ref) => { this.actualPage = ref; }}
            classid={this.state.classid}
            user = {this.props.user}
          />}
        {this.state.show == "createClass" &&
          <ClassForm
            onBack={this.cancelCreateClass}
            onSubmit={this.handleCreateClass}
          />}
      </div>
    );
  }
}