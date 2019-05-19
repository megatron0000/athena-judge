import React from "react";
import Api from "./Api";

import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";

import TopBar from "./TopBar/TopBar";
import SideBar from "./SideBar/SideBar";
import Main from "./Main";

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

  // handleArrowBackClick = () => {
  //   let currentState = this.main.state;
  //   console.log(this.main.state);
  //   // this.main.setState({ show: "CourseList", courseId: null });
  //   if (currentState.show == "CourseView") {
  //     this.main.setState({ show: "CourseList", courseId: null });
  //   } else if (currentState.show == "CourseCreate") {
  //     this.main.showHome();
  //   } else if(currentState.show == "CourseList") {
  //     this.main.setState({ show: "CourseList", courseId: null });
  //   }
  // }

  handleHomeClick = () => {
    this.main.showHome();
  }

  render() {
    return (
      <div>
        <TopBar
          title="Athena Judge"
          // onArrowBackClick={this.handleArrowBackClick}
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
          {
            (this.state.user != null) ?
            <Main 
              ref={(ref) => { this.main = ref; } }
              user={this.state.user}
            />
            :
            <Typography
              variant="title"
              style={{ paddingLeft: 20, paddingRight: 20, paddingTop: 100, paddingBottom: 200,
                textAlign: "center", color: "#666" }}
            >
              Por favor, realize login para acessar o sistema.
            </Typography>
          }
        </Paper>
        <div style={{ height: 120 }}></div>
      </div>
    );
  }
}