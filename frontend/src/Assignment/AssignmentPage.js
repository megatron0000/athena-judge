import React from "react";
import Api from "../Api";

import Typography from "@material-ui/core/Typography";
import CircularProgress from "@material-ui/core/CircularProgress";

import AssignmentForm from "./AssignmentForm";
import AssignmentList from "./AssignmentList";
import AssignmentView from "./AssignmentView";

import SubmissionList from "../Submission/SubmissionList";

export default class AssignmentPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: "list",
      list: [],
      assignment: null,
      loading: false
    };
  }

  componentDidMount() {
    this.showList();
  }

  showList = () => {
    this.setState({ show: "list", loading: true });
    Api.get("/assignments").then((res) => {
      this.setState({ list: res.data.data, loading: false });
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
  }

  showListNoUpdate = () => {
    this.setState({ show: "list", loading: false });
  }

  showCreateAssignment = () => {
    this.setState({ show: "create" });
  }

  showUpdateAssignment = () => {
    this.setState({ show: "update" });
  }

  showListUpdateAssign = () => {
    this.setState({ show: "list", loading: false });
    this.refAssignList.getAssignmentsList();
  }

  showView = (assignment) => {
    this.setState({ show: "view", assignment: assignment });
  }

  showUpdate = (id) => {
    this.setState((prev) => ({ show: "update", assignment: prev.list.find((e) => e.id === id) }));
  }

  getAssignmentById = (assignmentId, callback) => {
    this.setState({ loading: true });
    Api.get("/assignments/" + assignmentId).then((res) => {
      this.setState({ assignment: res.data.data, loading: false });
      if (callback) {
        callback();
      }
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
  }

  showEditById = (assignmentId) => {
    this.getAssignmentById(assignmentId, this.showUpdateAssignment);
    // @italotabatinga: A way to make change on show was sending this function below as callback of getassignmentbyID
    // this.showUpdateAssignment();
  }

  handleCreateAssignment = (form) => {
    this.setState({ loading: true });
    Api.post("/assignments", {
      title: form.title,
      description: form.description,
      courseId: this.props.courseId,
      dueDate: form.dueDate,
    }).then((res) => {
      let assignmentId = res.data.data.id;

      let testCount = Math.min(form.publicTestsInput.length, form.publicTestsOutput.length);
      let current = -1;
      const sendNext = () => {
        current++;
        if (current < testCount) {
          Api.post(`/assignments/${assignmentId}/tests`, {
            type: "public",
            input: form.publicTestsInput[current].data,
            output: form.publicTestsOutput[current].data,
          }).then((res) => {
            sendNext();
          }).catch((err) => {
            console.log(err);
          });
        } else {
          this.setState({ loading: false });
          this.showListUpdateAssign();
        }
      }
      sendNext();
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
  }

  handleUpdateAssignment = (form) => {
    this.setState({ loading: true });
    Api.put("/assignments/" + form.id, {
      title: form.title,
      description: form.description,
      courseId: this.props.courseId,
      dueDate: form.dueDate,
      code: form.code
    }).then((res) => {
      this.showListUpdateAssign();
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
  }

  render() {  
    return (
      <div>
        { this.state.loading &&
          <CircularProgress style={{ float: "right", marginRight: 18, marginTop: 18 }} /> }
        <Typography
          variant="title"
          style={{ paddingLeft: 20, paddingTop: 22, paddingRight: 20, paddingBottom: 4 }}
        >
          Atividades
        </Typography>
        
        { this.state.show === "list" &&
          <AssignmentList
            courseId={this.props.courseId}
            onEdit={this.showEditById}
            onOpen={this.showView}
            showCreateAssignment = {this.showCreateAssignment}
            ref={(ref) => { this.refAssignList = ref; }}            
            isProfessor={this.props.isProfessor}
          /> }
        { this.state.show === "create" &&
          <AssignmentForm
            onBack={this.showListNoUpdate}
            onSubmit={this.handleCreateAssignment}
          /> }
        { this.state.show === "update" &&
          <AssignmentForm
            onBack={this.showListNoUpdate}
            assignmentId={this.state.assignment.id}
            title={this.state.assignment.title}
            description={this.state.assignment.description}
            dueDate={this.state.assignment.dueDate}
            onSubmit={this.handleUpdateAssignment}
          /> }
        { (this.state.show === "view" && !this.props.isProfessor) &&
          <AssignmentView
            onBack={this.showListNoUpdate}
            courseId={this.props.courseId}
            assignmentId={this.state.assignment.id}
            isProfessor={this.props.isProfessor}
            user={this.props.user}
          /> }
        { (this.state.show === "view" && this.props.isProfessor) &&
          <SubmissionList
            onBack={this.showListNoUpdate}
            courseId={this.props.courseId}
            assignmentId={this.state.assignment.id}
            isProfessor={this.props.isProfessor}
          /> }  
      </div>
    );
  }
}