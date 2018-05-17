import React from "react";
import Axios from "axios";

import Typography from "material-ui/Typography";
import { CircularProgress } from "material-ui/Progress";
import Button from "material-ui/Button";
import AddIcon from "@material-ui/icons/Add";

import Config from "../../Config";

import AssignmentForm from "./AssignmentForm";
import AssignmentList from "./AssignmentList";

export default class AssignmentsPage extends React.Component {
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
    this.setState({ show: "list" });
  }

  showCreate = () => {
    this.setState({ show: "create" });
  }

  handleCreate = (form) => {
    this.setState({ loading: true });
    Axios.post(Config.api + "/assignments", {
      title: form.title,
      description: form.description,
      code: form.code,
      files: form.files
    }).then((res) => {
      this.showList();
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
  }

  showUpdate = (id) => {
    this.setState((prev) => ({ show: "update", assignment: prev.list.find((e) => e.id == id) }));
  }

  handleUpdate = (form) => {
    this.setState({ loading: true });
    Axios.put(Config.api + "/assignments/" + this.state.assignment.id, {
      title: form.title,
      description: form.description,
      code: form.code
    }).then((res) => {
      this.showList();
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
    console.log(form);
  }

  handleDelete = (id) => {
    this.setState({ loading: true });
    Axios.delete(Config.api + "/assignments/" + id).then((res) => {
      this.showList();
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
            data={this.state.list}
            onOpen={this.showUpdate}
            onEdit={this.showUpdate}
            onDelete={this.handleDelete}
          /> }
        { this.state.show == "create" &&
          <AssignmentForm
            onBack={this.showListNoUpdate}
            onSubmit={this.handleCreate}
          /> }
        { this.state.show == "update" &&
          <AssignmentForm
            onBack={this.showListNoUpdate}
            title={this.state.assignment.title}
            description={this.state.assignment.description}
            onSubmit={this.handleUpdate}
          /> }
      </div>
    );
  }
}