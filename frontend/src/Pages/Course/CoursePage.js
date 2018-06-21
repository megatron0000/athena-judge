import React from "react";

import Api from "../../Api";

import AssignmentPage from "./Assignment/AssignmentPage";

import Typography from "@material-ui/core/Typography";
import CircularProgress from "@material-ui/core/CircularProgress";
import Divider from '@material-ui/core/Divider';
import Button from "@material-ui/core/Button";
import AddIcon from "@material-ui/icons/Add";
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Avatar from "@material-ui/core/Avatar";
import Dialog from '@material-ui/core/Dialog/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';

export default class CoursePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: "home",
      assignmentId: null,
      students: [],
      professors: [],
      isCreator: false,
      isProfessor: false,
      loading: false,
      dialogOpenPromote: false,
      dialogOpenDemote: false,
    };
  }

  getCourseData = () => {
    this.setState({ loading: true });
    Api.get("/courses/" + this.props.courseId).then((res) => {
      this.setState({
        isCreator: res.data.data.creatorUserGid === this.props.user.gid,
        data: res.data.data,
        loading: false
      });
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
  }

  getStudents = () => {
    this.setState({loading: true});
    Api.get(`/courses/${this.props.courseId}/students`).then((res) => {
      this.setState({
        students: res.data.data, 
        loading: false
      });
    }).catch((err) => {
      console.log(err);
      this.setState({loading: false});
    });
  }

  getProfessors = () => {
    this.setState({loading: true});
    Api.get(`/courses/${this.props.courseId}/professors`).then((res) => {
      this.setState({
        isProfessor: res.data.data.find((e) => e.gid === this.props.user.gid) != null,
        professors: res.data.data, 
        loading: false
      });
    }).catch((err) => {
      console.log(err);
      this.setState({loading: false});
    });
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
    Api.post(`/courses/${courseId}/professors`, { userGid: gid }).then((res) => {
      this.getStudents();
      this.getProfessors();
      this.setState({ loading: false });
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
  }

  handleDemote = (courseId, gid) => {
    this.setState({ loading: true });
    Api.delete(`/courses/${courseId}/professors/${gid}`).then((res) => {
      this.getStudents();
      this.getProfessors();
      this.setState({ loading: false });
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
  }

  componentDidMount() {
    this.getCourseData();
    this.getStudents();
    this.getProfessors();
  }

  handleOpenDialogPromote = () => {
    this.setState({ dialogOpenPromote: true });
  };

  handleCloseDialogPromote = () => {
    this.setState({ dialogOpenPromote: false });
  };

  handleOpenDialogDemote = () => {
    this.setState({ dialogOpenDemote: true });
  };

  handleCloseDialogDemote = () => {
    this.setState({ dialogOpenDemote: false });
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
          isProfessor={this.state.isProfessor}
          user={this.props.user}
        />
      }

      <Divider />
        <Typography
          variant="title"
          style={{ paddingLeft: 20, paddingTop: 22, paddingRight: 20, paddingBottom: 4 }}
        >
          Professores
        </Typography>

        <List >
          {this.state.professors.map((professor) => (
            <ListItem key={professor.gid}>

              <Avatar
                style={{marginLeft: 5, marginRight: 20}}
                alt={professor.email}
                src={professor.photo}
              />

              <ListItemText primary={professor.name} />

              {this.state.isCreator && professor.gid !== this.props.user.gid && 
                <Button
                  variant="raised"
                  color="secondary"
                  style={{ marginLeft: 20, marginBottom: 20 }}
                  onClick={this.handleOpenDialogDemote} 
                >
                  Remover
                  <AddIcon style ={{ marginLeft: 10 }} />
                </Button>
              }

              <Dialog
                  open={this.state.dialogOpenDemote}
                  onClose={this.handleCloseDialogDemote}
                  aria-labelledby="alert-dialog-title"
                  aria-describedby="alert-dialog-description"
                >
                  <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                      Tem certeza que deseja remover este professor?
                    </DialogContentText>
                  </DialogContent>
                
                  <DialogActions>
                    <Button onClick={this.handleCloseDialogDemote} color="primary">
                      Não
                    </Button>
                  
                    <Button 
                      onClick={() => { this.handleDemote(this.props.courseId, professor.gid), this.handleCloseDialogDemote() }}
                      color="primary" autoFocus>
                      Sim
                    </Button>
                  </DialogActions>
              
                </Dialog>

            </ListItem>
          ))}
        </List>

        <Divider />
        <Typography
          variant="title"
          style={{ paddingLeft: 20, paddingTop: 22, paddingRight: 20, paddingBottom: 4 }}
        >
          Alunos Inscritos
        </Typography>

        <List >
          {this.state.students.map((student) => (
            <ListItem key={student.gid}>

              <Avatar
                style={{marginLeft: 5, marginRight: 20}}
                alt={student.email}
                src={student.photo}
              />

              <ListItemText primary={student.name} />

              { this.state.isCreator && this.state.professors.find((e) => e.gid == student.gid) == null && 
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