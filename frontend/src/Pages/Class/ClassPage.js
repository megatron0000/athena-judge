import React from "react";
import Axios from "axios";

import Config from "../../Config";
import AssignmentList from "./Assignment/AssignmentList";
import AssignmentForm from "./Assignment/AssignmentForm";

import Typography from "material-ui/Typography";
import { CircularProgress } from "material-ui/Progress";
import Divider from 'material-ui/Divider';
import Button from "material-ui/Button";

export default class ClassPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: "home",
      // list: [],
      // assignment: null,
      // data: this.props.data,
      loading: false
    };
  }

  showCreateAssignment = () => {
    this.setState({ show: "createAssign" });
  }

  showHome = () => {
    this.setState({ show: "home", loading: false });
  }

  getClassData = () => {
    this.setState({ loading: true });
    Axios.get(Config.api + "/classes/" + this.props.classid).then((res) => {
      this.setState({ data: res.data.data, loading: false });
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
  }

  handleCreateAssignment = (form) => {
    this.setState({ loading: true });
    Axios.post(Config.api + "/assignments", {
      title: form.title,
      description: form.description,
      classid: this.props.classid,
      code: form.code
    }).then((res) => {
      this.showHome();
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
  }

  // @italotabatinga It cant be edit by now
  // handleUpdateAssignment = (form) => {
  //   this.setState({ loading: true });
  //   Axios.put(Config.api + "/assignments/" + this.state.assignment.id, {
  //     title: form.title,
  //     description: form.description,
  //     code: form.code
  //   }).then((res) => {
  //     this.showList();
  //   }).catch((err) => {
  //     console.log(err);
  //     this.setState({ loading: false });
  //   });
  //   console.log(form);
  // }

  componentWillMount() {
    this.getClassData();
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
                { this.state.data && this.state.data.name }
              </Typography>
              <Typography
                variant="subheading"
                style={{ paddingLeft: 20, paddingTop: 22, paddingRight: 20, paddingBottom: 4 }}
              >
                { this.state.data && this.state.data.description }
              </Typography>
              <Divider />
              <Typography
                variant="title"
                style={{ paddingLeft: 20, paddingTop: 22, paddingRight: 20, paddingBottom: 4 }}
              >
                Atividades
              </Typography>
              {this.state.show == "home" && 
              <AssignmentList 
                classid = {this.props.classid}
              />}
              {this.state.show == "createAssign" && 
              <AssignmentForm 
                classid = {this.props.classid}
                onBack={this.showHome}
                onSubmit={this.handleCreateAssignment}
              />}
              <Divider />
              <Typography
                variant="title"
                style={{ paddingLeft: 20, paddingTop: 22, paddingRight: 20, paddingBottom: 4 }}
              >
                Aluno
              </Typography>
              <Divider />
            </div>
        );
    }
}