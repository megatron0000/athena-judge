import React from "react";
import Api from "./Api";

import CourseList from "./Course/CourseList";
import CoursePage from "./Course/CoursePage";
import CourseForm from "./Course/CourseForm";

export default class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: "CourseList",
      loading: false,
      courseId: null,
    };
  }

  showCourse = (id) => {
    this.setState({ show: "CourseView", courseId: id });
  }

  showCreateCourse = () => {
    this.setState({ show: "CourseCreate" });
  }

  showHome = () => {
    this.setState({ show: "CourseList", courseId: null });
  }

  cancelCreateCourse = () => {
    if (this.state.courseId != null) {
      this.showCourse(this.state.courseId);
    } else {
      this.showHome();
    }
  }

  handleCreateCourse = (form) => {
    this.setState({ loading: true });
    Api.post("/courses", {
      name: form.name,
      description: form.description,
      creatorUserGid: this.props.user.gid,
    }).then((res) => {
      this.setState({ show: "CourseList", loading: false });
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
  }

  render() {
    return (
      <div>
        {this.state.show == "CourseList" &&
          <CourseList 
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