import React from "react";

import Api from "../../Api";

import AssignmentPage from "./Assignment/AssignmentPage";
import AssignmentList from "./Assignment/AssignmentList";
import AssignmentForm from "./Assignment/AssignmentForm";

import Typography from "material-ui/Typography";
import { CircularProgress } from "material-ui/Progress";
import Divider from 'material-ui/Divider';
import Button from "material-ui/Button";
import AddIcon from "@material-ui/icons/Add";
import List, { ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction } from "material-ui/List";
import Avatar from "material-ui/Avatar";
import Dialog from 'material-ui/Dialog/Dialog';
import DialogActions from 'material-ui/Dialog/DialogActions';
import DialogContent from 'material-ui/Dialog/DialogContent';
import DialogContentText from 'material-ui/Dialog/DialogContentText';
import DialogTitle from 'material-ui/Dialog/DialogTitle';

export default class CoursePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: "home",
      assignmentid: null,
      students: [],
      selfType: '',
      loading: false,
      dialogOpenPromote: false
    };
  }

  getCourseData = () => {
    this.setState({ loading: true });
    Api.get("/courses/" + this.props.courseId).then((res) => {
      this.setState({ data: res.data.data, loading: false });
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
  }

  getStudents = () => {
    this.setState({loading: true});
    Api.get("/registrations/registrationsstudents/" + this.props.courseId).then((res) => {
      this.setState({
                      students: res.data.data, 
                      selfType: res.data.data.find(o => o.gid == this.props.user.gid).type,
                      loading: false});
    }).catch((err) => {
      console.log(err);
      this.setState({loading: false});
    });
  }

  getAssignmentById = (assignmentid, callback) => {
    this.setState({ loading: true });
    Api.get("/assignments/" + assignmentid).then((res) => {
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
    formData.append('courseId', this.props.courseId);
    formData.append('dueDate', form.dueDate);
    for (let i = 0; i < form.attachments.length; i++) {
      formData.append('attachments', form.attachments[i]);
    }
    
    for (let i = 0; i < form.tests.length; i++) {
      formData.append('tests', form.tests[i]);
    }

    this.setState({ loading: true });
    Api.post("/assignments/upload", formData, {
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
    Api.put("/assignments/" + form.id, {
      title: form.title,
      description: form.description,
      courseId: this.props.courseId,
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
    Api.delete("/assignments/" + id).then((res) => {
      this.showHomeUpdateAssign();
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
  }

  handlePromote = (courseId, gid) => {
    this.setState({ loading: true });
    Api.put("/registrations/regpromote/" + courseId + "/"+ gid).then((res) => {
      console.log(res);
      this.getStudents();
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
  }

  componentWillMount() {
    this.getCourseData();
    this.getStudents();
  }

  handleOpenDialogPromote = () => {
    this.setState({ dialogOpenPromote: true });
  };

  handleCloseDialogPromote = () => {
    this.setState({ dialogOpenPromote: false });
  };

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
        
      {
        <AssignmentPage 
          courseId={this.props.courseId}
          selfType={this.state.selfType}
          user={this.props.user}
        />
      }
        <Divider />
        <Typography
          variant="title"
          style={{ paddingLeft: 20, paddingTop: 22, paddingRight: 20, paddingBottom: 4 }}
        >
          Alunos
        </Typography>

        <List >
          {this.state.students.map((student) => (
            <ListItem key={student.email}>              

              <Avatar
                style={{marginLeft: 5, marginRight: 20}}
                alt={student.email}
                src={student.photo}
              />

              {student.username}

              {(this.state.selfType == "Creator" && student.type != "Creator") && 
                <Button
                  variant="raised"
                  color="secondary"
                  style={{ marginLeft: 20, marginBottom: 20 }}
                  onClick={this.handleOpenDialogPromote} 
                >
                  Promover
                  <AddIcon style ={{ marginLeft: 10 }} />
                </Button>
              }

              <Dialog
                  open={this.state.dialogOpenPromote}
                  onClose={this.handleCloseDialogPromote}
                  aria-labelledby="alert-dialog-title"
                  aria-describedby="alert-dialog-description"
                >
                  <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                      Tem certeza que deseja promover esse aluno à condição de Professor?
                    </DialogContentText>
                  </DialogContent>
                
                  <DialogActions>
                    <Button onClick={this.handleCloseDialogPromote} color="primary">
                      Não
                    </Button>
                  
                    <Button 
                      onClick={() => { this.handlePromote(this.props.courseId, student.gid), this.handleCloseDialogPromote() }}
                      color="primary" autoFocus>
                      Sim
                    </Button>
                  </DialogActions>
              
                </Dialog>

            </ListItem>
          ))}
        </List>

        <Divider />

      </div>
    );
  }
}