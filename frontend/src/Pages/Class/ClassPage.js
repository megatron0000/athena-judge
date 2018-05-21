import React from "react";
import Axios from "axios";

import Config from "../../Config";
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
      students: [],
      loading: false
    };
  }

  showCreateAssignment = () => {
    this.setState({ show: "createAssign" });
  }

  showUpdateAssignment = () => {
    this.setState({ show: "updateAssign" });
  }

  showHomeNoUpdate = () => {
    this.setState({ show: "home", loading: false });
  }

  showHomeUpdateAssign = () => {
    this.setState({ show: "home", loading: false });
    this.refAssignList.getAssignmentsList();
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

  getStudents = () => {
    this.setState({loading: true});
    Axios.get(Config.api + "/registrations/registrationsstudents/" + this.props.classid).then((res) => {
      this.setState({students: res.data.data.map( o => o.email), loading: false});
    }).catch((err) => {
      console.log(err);
      this.setState({loading: false});
    });
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
    console.log("CRIANDO", form);
    let formData = new FormData();
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('classid', this.props.classid);
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
      this.showHomeUpdateAssign();
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
      classid: this.props.classid,
      dueDate: form.dueDate,
      code: form.code
    }).then((res) => {
      this.showHomeUpdateAssign();
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
  }

  handleDelete = (id) => {
    this.setState({ loading: true });
    Axios.delete(Config.api + "/assignments/" + id).then((res) => {
      this.showHomeUpdateAssign();
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
  }

  componentWillMount() {
    this.getClassData();
    this.getStudents();
  }

  render() {
    console.log("debug");
    console.log(this.state.students);
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
        <Typography
          variant="title"
          style={{ paddingLeft: 20, paddingTop: 22, paddingRight: 20, paddingBottom: 4 }}
        >
          Atividades
              </Typography>
        {this.state.show == "home" &&
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
          />}
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