import React from "react";

import Api from "../Api";

import AssignmentPage from "../Assignment/AssignmentPage";

import Typography from "@material-ui/core/Typography";
import CircularProgress from "@material-ui/core/CircularProgress";
import Divider from "@material-ui/core/Divider";
import Button from "@material-ui/core/Button";
import AddIcon from "@material-ui/icons/Add";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import ErrorIcon from "@material-ui/icons/Error";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Avatar from "@material-ui/core/Avatar";

import ConfirmDialog from "../Components/ConfirmDialog";
import GoogleApi from "../GoogleApi";

export default class CoursePage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      course: null,
      isCreator: false,
      isProfessor: true,
      students: [],
      professors: [],
      dialogOpenPromote: false,
      dialogOpenDemote: false,
      loading: 0,
      studentToPromote: null,
      professorToDemote: null,
      systemHasCredentials: true
    };
  }

  getCourseData = () => {
    this.setState(prev => ({ loading: prev.loading + 1 }))

    gapi.client.classroom.courses.get({ id: this.props.courseId })
      .then(res => res.body)
      .then(JSON.parse)
      .then(googleCourse => this.setState((prev) => ({
        isCreator: googleCourse === this.props.user.gid,
        course: { name: googleCourse.name, description: googleCourse.description },
        loading: prev.loading - 1,
      })))
      .catch(err => {
        console.log(err)
        this.setState(prev => ({ loading: prev.loading - 1 }))
      })
  }

  getStudents = () => {
    this.setState((prev) => ({ loading: prev.loading + 1 }));
    Api.get(`/courses/${this.props.courseId}/students`).then((res) => {
      this.setState((prev) => ({
        students: res.data.data,
        loading: prev.loading - 1,
      }));
    }).catch((err) => {
      console.log(err);
      this.setState((prev) => ({ loading: prev.loading - 1 }));
    });
  }

  getProfessors = () => {
    this.setState((prev) => ({ loading: prev.loading + 1 }));
    Api.get(`/courses/${this.props.courseId}/professors`).then((res) => {
      this.setState((prev) => ({
        isProfessor: res.data.data.find((e) => e.gid === this.props.user.gid) != null,
        professors: res.data.data,
        loading: prev.loading - 1,
      }));
    }).catch((err) => {
      console.log(err);
      this.setState((prev) => ({ loading: prev.loading - 1 }));
    });
  }

  getCredentialStatus = () => {
    Api.get('/courses/credentials/' + this.props.courseId)
      .then(res => res.data)
      .then(status => this.setState({ systemHasCredentials: status.hasCredentials }))
  }

  handlePromote = (courseId, gid) => {
    this.setState((prev) => ({ loading: prev.loading + 1 }));
    Api.post(`/courses/${courseId}/professors`, { userGid: gid }).then((res) => {
      this.getStudents();
      this.getProfessors();
      this.setState((prev) => ({ loading: prev.loading - 1 }));
    }).catch((err) => {
      console.log(err);
      this.setState((prev) => ({ loading: prev.loading - 1 }));
    });
  }

  handleDemote = (courseId, gid) => {
    this.setState((prev) => ({ loading: prev.loading + 1 }));
    Api.delete(`/courses/${courseId}/professors/${gid}`).then((res) => {
      this.getStudents();
      this.getProfessors();
      this.setState((prev) => ({ loading: prev.loading - 1 }));
    }).catch((err) => {
      console.log(err);
      this.setState((prev) => ({ loading: prev.loading - 1 }));
    });
  }

  componentDidMount() {
    this.getCourseData();
    this.getStudents();
    this.getProfessors();
    this.getCredentialStatus()
  }

  handleOpenDialogPromote = (student) => {
    this.setState({
      dialogOpenPromote: true,
      studentToPromote: student
    });
  };

  handleCloseDialogPromote = () => {
    this.setState({ dialogOpenPromote: false });
  };

  handleOpenDialogDemote = (professor) => {
    this.setState({
      dialogOpenDemote: true,
      professorToDemote: professor
    });
  };

  handleCloseDialogDemote = () => {
    this.setState({ dialogOpenDemote: false });
  };

  handleUploadCredentials = () => {
    this.setState(prev => ({ loading: prev.loading + 1 }))
    GoogleApi.giveOfflinePermissions()
      .then(codeObj => Api.put('/courses/credentials', { ...codeObj, courseId: this.props.courseId }))
      .then(() => this.setState(prev => ({ loading: prev.loading - 1, systemHasCredentials: true })))
  }

  render() {
    return (
      <div>
        {this.state.loading > 0 &&
          <CircularProgress style={{ float: "right", marginRight: 18, marginTop: 18 }} />}

        <Typography
          variant="headline"
          style={{ paddingLeft: 20, paddingTop: 22, paddingRight: 20, paddingBottom: 4 }}
        >
          {this.state.course && this.state.course.name}
        </Typography>

        <Typography
          variant="subheading"
          style={{ paddingLeft: 20, paddingTop: 4, paddingRight: 20, paddingBottom: 20 }}
        >
          {this.state.course && this.state.course.description}
        </Typography>

        <Divider />

        <Typography
          variant="title"
          style={{ paddingLeft: 20, paddingTop: 22, paddingRight: 20, paddingBottom: 4 }}
        >
          Credenciais
        </Typography>

        <Button
          variant="raised"
          disabled={this.state.loading > 0}
          color={this.state.systemHasCredentials ? "primary" : "secondary"}
          onClick={() => { this.handleUploadCredentials() }}
          style={{ marginLeft: 20, marginBottom: 20, marginTop: 20 }}
        >
          {this.state.systemHasCredentials
            ? <CheckCircleIcon style={{ marginRight: 14 }} />
            : <ErrorIcon style={{ marginRight: 14 }} />
          }
          {this.state.systemHasCredentials
            ? "Re-enviar"
            : "Conceder"
          }
        </Button>


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
                style={{ marginLeft: 5, marginRight: 20 }}
                alt={professor.email}
                src={professor.photo}
              />

              <ListItemText primary={professor.name} />

              {this.state.isCreator && professor.gid !== this.props.user.gid &&
                <Button
                  variant="raised"
                  color="secondary"
                  style={{ marginLeft: 20, marginBottom: 20 }}
                  onClick={() => this.handleOpenDialogDemote(professor)}
                >
                  Remover
                  <AddIcon style={{ marginLeft: 10 }} />
                </Button>
              }

            </ListItem>
          ))}
        </List>

        <ConfirmDialog
          open={this.state.dialogOpenDemote}
          text="Tem certeza que deseja remover este professor?"
          onConfirm={() => this.handleDemote(this.props.courseId, this.state.professorToDemote.gid)}
          onClose={this.handleCloseDialogDemote}
        />

        <Divider />

        <Typography
          variant="title"
          style={{ paddingLeft: 20, paddingTop: 22, paddingRight: 20, paddingBottom: 4 }}
        >
          Alunos Inscritos
        </Typography>

        <List>
          {this.state.students.map((student) => (
            <ListItem key={student.gid}>

              <Avatar
                style={{ marginLeft: 5, marginRight: 20 }}
                alt={student.email}
                src={student.photo}
              />

              <ListItemText primary={student.name} />

              {this.state.isCreator && this.state.professors.find((e) => e.gid === student.gid) == null &&
                <Button
                  variant="raised"
                  color="secondary"
                  style={{ marginLeft: 20, marginBottom: 20 }}
                  onClick={() => this.handleOpenDialogPromote(student)}
                >
                  Promover
                  <AddIcon style={{ marginLeft: 10 }} />
                </Button>
              }

            </ListItem>
          ))}
        </List>
        <ConfirmDialog
          open={this.state.dialogOpenPromote}
          text="Tem certeza que deseja promover esse aluno à condição de Professor?"
          onConfirm={() => this.handlePromote(this.props.courseId, this.state.studentToPromote.gid)}
          onClose={this.handleCloseDialogPromote}
        />
      </div>
    );
  }
}