import React from "react";
import Axios from "axios";

import Config from "../../Config";

import AssignmentPage from "./Assignment/AssignmentPage";
import AssignmentList from "./Assignment/AssignmentList";
import AssignmentForm from "./Assignment/AssignmentForm";

import Typography from "material-ui/Typography";
import { CircularProgress } from "material-ui/Progress";
import Divider from 'material-ui/Divider';
import Button from "material-ui/Button";
import AddIcon from "@material-ui/icons/Add";

export default class ClassPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: "home",
      // list: [],
      assignmentid: null,
      // data: this.props.data,
      loading: false
    };
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

  

  componentWillMount() {
    this.getClassData();
  }

  render() {
    return (
      <div>
        {this.state.loading &&
          <CircularProgress style={{ float: "right", marginRight: 18, marginTop: 18 }} />}
        <Typography
          variant="title"
          style={{ paddingLeft: 20, paddingTop: 22, paddingRight: 20, paddingBottom: 4 }}
        >
          {this.state.data && this.state.data.name}
        </Typography>
        <Typography
          variant="subheading"
          style={{ paddingLeft: 20, paddingTop: 22, paddingRight: 20, paddingBottom: 4 }}
        >
          {this.state.data && this.state.data.description}
        </Typography>
        <Divider />
        {/* <Typography
          variant="title"
          style={{ paddingLeft: 20, paddingTop: 22, paddingRight: 20, paddingBottom: 4 }}
        >
          Atividades
              </Typography> */}
        {/*this.state.show == "home" &&
          <AssignmentList
            classid={this.props.classid}
            onEdit={this.showEditById}
            onDelete={this.handleDelete}
            showCreateAssignment = {this.showCreateAssignment}
            ref={(ref) => { this.refAssignList = ref; }}
          />
        }
        {this.state.show == "createAssign" &&
          <AssignmentForm
            onBack={this.showHomeNoUpdate}
            onSubmit={this.handleCreateAssignment}
          />}
        {(this.state.show == "updateAssign") &&
          <AssignmentForm
            onBack={this.showHomeNoUpdate}
            assignmentid={this.state.assignment.id}
            title={this.state.assignment.title}
            description={this.state.assignment.description}
            dueDate={this.state.assignment.dueDate}
            onSubmit={this.handleUpdateAssignment}
      />*/}
      {
        <AssignmentPage 
          classid={this.props.classid}
        />
      }
        <Divider />
        <Typography
          variant="title"
          style={{ paddingLeft: 20, paddingTop: 22, paddingRight: 20, paddingBottom: 4 }}
        >
          Alunos
              </Typography>
        <Divider />
      </div>
    );
  }
}