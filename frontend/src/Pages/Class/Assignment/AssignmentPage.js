import React from "react";
import Axios from "axios";

import Typography from "material-ui/Typography";
import { CircularProgress } from "material-ui/Progress";
import Button from "material-ui/Button";
import AddIcon from "@material-ui/icons/Add";

import Config from "../../../Config";

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
    Axios.get(Config.api + "/assignments").then((res) => {
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
    this.setState((prev) => ({ show: "update", assignment: prev.list.find((e) => e.id == id) }));
  }

  getAssignmentById = (assignmentid, callback) => {
    this.setState({ loading: true });
    Axios.get(Config.api + "/assignments/" + assignmentid).then((res) => {
      this.setState({ assignment: res.data.data, loading: false });
      if (callback) {
        callback();
      }
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
  }

  showEditById = assignmentid => {
    this.getAssignmentById(assignmentid, this.showUpdateAssignment);
    // @italotabatinga: A way to make change on show was sending this function below as callback of getassignmentbyID
    // this.showUpdateAssignment();
  }

  handleCreateAssignment = (form) => {
    let formData = new FormData();
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('classId', this.props.classId);
    formData.append('dueDate', form.dueDate);
    for (let i = 0; i < form.attachments.length; i++) {
      formData.append('attachments', form.attachments[i]);
    }
    // formData.append('attachments', Array.from(form.attachments));
    
    for (let i = 0; i < form.tests.length; i++) {
      formData.append('tests', form.tests[i]);
    }
    // formData.append('tests', form.tests);

    this.setState({ loading: true });
    Axios.post(Config.api + "/assignments/upload", formData, {
      headers: {'Content-Type': 'multipart/form-data'} 
    }).then((res) => {
      console.log(res);
      this.showListUpdateAssign();
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });    
  }

  handleUpdateAssignment = (form) => {
    this.setState({ loading: true });
    Axios.put(Config.api + "/assignments/" + form.id, {
      title: form.title,
      description: form.description,
      classId: this.props.classId,
      dueDate: form.dueDate,
      code: form.code
    }).then((res) => {
      this.showHomeUpdateAssign();
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
        
        { this.state.show == "list" &&
          <AssignmentList
            classId={this.props.classId}
            onEdit={this.showEditById}
            onOpen={this.showView}
            showCreateAssignment = {this.showCreateAssignment}
            ref={(ref) => { this.refAssignList = ref; }}            
            selfType={this.props.selfType}
          /> }
        { this.state.show == "create" &&
          <AssignmentForm
            onBack={this.showListNoUpdate}
            onSubmit={this.handleCreateAssignment}
          /> }
        { this.state.show == "update" &&
          <AssignmentForm
            onBack={this.showListNoUpdate}
            assignmentid={this.state.assignment.id}
            title={this.state.assignment.title}
            description={this.state.assignment.description}
            dueDate={this.state.assignment.dueDate}
            onSubmit={this.handleUpdateAssignment}
          /> }
        { (this.state.show == "view" && this.props.selfType != "Creator") &&
          <AssignmentView
            onBack={this.showListNoUpdate}
            classId={this.props.classId}
            assignmentid={this.state.assignment.id}
            selfType={this.props.selfType}
            user={this.props.user}
          /> }

        { (this.state.show == "view" && this.props.selfType == "Creator") &&
          <SubmissionList
            onBack={this.showListNoUpdate}
            classId={this.props.classId}
            assignmentid={this.state.assignment.id}
            selfType={this.props.selfType}
          /> }  
      </div>
    );
  }
}