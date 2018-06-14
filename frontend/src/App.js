import React from "react";
import Api from "./Api";

import Paper from "@material-ui/core/Paper";

import TopBar from "./TopBar/TopBar";
import SideBar from "./SideBar/SideBar";
import Main from "./Pages/Main";

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null, // { gid, name, photo, email }
    };
  }

  handleUserUpdate = (user) => {
    this.setState({ user });
    if (user != null) {
      Api.put(`/users/${user.gid}`, {
        name: user.name,
        photo: user.photo,
        email: user.email,
      });
    }
  }

  handleOpenSidebar = () => {
    this.sideBar.handleOpen();
  }

  handleHomeClick = () => {
    this.main.showHome();
  }

  render() {
    return (
      <div>
        <TopBar
          title="Athena Judge"
          onHomeClick={this.handleHomeClick}
          user={this.state.user}
          onUserUpdate={this.handleUserUpdate}
        />
        <SideBar
          ref={(ref) => { this.sideBar = ref; } }
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
        <div style={{ height: 120 }}></div>
      </div>
    );
  }
}