import React from "react";
import Api from "../Api";

import List, { ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction } from "material-ui/List";
import IconButton from "material-ui/IconButton";

import Welcome from "./Welcome";
import CoursePage from "./Course/CoursePage";
import CourseForm from "./Course/CourseForm";

export default class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: "Home",
      loading: false,
      courseId: null
    };
  }

  showCourse = (id) => {
    this.setState({ show: "CourseView", courseId: id });
  }

  showCreateCourse = () => {
    this.setState({ show: "CourseCreate" });
  }

  showHome = () => {
    this.setState({ show: "Home", courseId: null });
  }

  cancelCreateCourse = () => {
    if (this.state.courseId != null)
      this.showCourse(this.state.courseId);
    else
      this.showHome();
  }

  handleCreateCourse = (form) => {
    this.setState({ loading: true });
    Api.post("/courses", {
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
            onCourseClick={this.showCourse}
            onCreateClick={this.showCreateCourse}
            user={this.props.user}
          />}
        {this.state.show == "CourseView" &&
          <CoursePage
            courseId={this.state.courseId}
            user={this.props.user}
          />}
        {this.state.show == "CourseCreate" &&
          <CourseForm
            onBack={this.cancelCreateCourse}
            onSubmit={this.handleCreateCourse}
          />}
      </div>
    );
  }
}