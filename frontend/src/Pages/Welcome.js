import React from "react";
import Api from "../Api";

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import ClassIcon from "@material-ui/icons/Class";
import AddIcon from "@material-ui/icons/Add";
import Button from "@material-ui/core/Button";
import Dialog from '@material-ui/core/Dialog/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

export default class Welcome extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      courses: [],
      teachingCourses: [],
      enrolledCourses: [],
      loading: false,
      dialogEnrollOpen: false
    };
  }

  // @italotabatinga: Dont know if this is the best way is with
  // componentDidMount and componentDidUpdate, but it works
  // when you give Welcome Course the responsability to GET its 
  // own lists
  componentDidMount = () => {
    if(this.props.user)
      this.getCoursesList();
  }

  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if(this.props.user && prevProps != this.props) {
      this.getCoursesList();
    }
  }

  getCoursesList = () => {
    // All courses    
    Api.get("/courses").then((res) => {
      this.setState({ courses: res.data.data });
    });
    // My enrolled courses
    Api.get(`/courses/enrolled/${this.props.user.gid}`).then((res) => {
      this.setState({ enrolledCourses: res.data.data });
    });
    // My teaching courses
    Api.get(`/courses/teaching/${this.props.user.gid}`).then((res) => {
      this.setState({ teachingCourses: res.data.data });
    });
  }

  handleEnroll = (courseId) => {
    this.setState({ loading: true });
    Api.post(`/courses/${courseId}/enroll`, {
      gid: this.props.user.gid,
    }).then((res) => {
      this.getCoursesList();
      this.setState({ loading: false, dialogEnrollOpen: false });
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false, dialogEnrollOpen: false });
    });
  }

  handleOpenEnrollDialog = () => {
    this.setState({ dialogEnrollOpen: true });
  };

  handleCloseEnrollDialog = () => {
    this.setState({ dialogEnrollOpen: false });
  };

  render() {
    return (
      <div>
        <Typography variant="title" style={{ paddingLeft: 20, paddingTop: 10, paddingRight: 20, paddingBottom: 4 }} >
          Cursos que eu estou inscrito
        </Typography>

        <List >
          {this.state.enrolledCourses.map((course) => (
            <ListItem
              key={course.id}
              onClick={() => { this.props.onCourseClick(course.id) }}
              button
            >
              <ListItemIcon>
                <ClassIcon />
              </ListItemIcon>
              <ListItemText primary={course.name} />
            </ListItem>
          ))}
        </List>

        <Typography
          variant="title"
          style={{ paddingLeft: 20, paddingTop: 10, paddingRight: 20, paddingBottom: 4 }}
        >
          Cursos disponíveis para inscrição
        </Typography>
        <List >
          {this.state.courses.map((course) => (
            <ListItem
              key={course.id}
            >
            
              <ListItemIcon>
                <ClassIcon />
              </ListItemIcon>
              
              <ListItemText primary={course.name} />

              <Button
                variant="raised"
                color="secondary"
                style={{ marginLeft: 20, marginBottom: 20 }}
                onClick={this.handleOpenEnrollDialog}
              >
                Inscrever-se
              </Button>

              <Dialog
                open={this.state.dialogEnrollOpen}
                onClose={this.handleCloseEnrollDialog}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
              >
                <DialogTitle id="alert-dialog-title">{course.name}</DialogTitle>
                
                <DialogContent>
                  <DialogContentText id="alert-dialog-description">
                    Tem certeza que deseja se inscrever na disciplina?
                  </DialogContentText>
                </DialogContent>
                
                <DialogActions>
                  <Button onClick={this.handleCloseEnrollDialog} color="primary">
                    Não
                  </Button>
                  
                  <Button 
                    onClick={ () => { this.handleEnroll(course.id) }} 
                    color="primary" autoFocus>
                    Sim
                  </Button>
                </DialogActions>
              
               </Dialog>

            </ListItem>
          ))}
        </List>

        <Typography variant="title" style={{ paddingLeft: 20, paddingTop: 10, paddingRight: 20, paddingBottom: 4 }} >
          Cursos que eu estou lecionando
        </Typography>

        <List >
          {this.state.teachingCourses.map((course) => (
            <ListItem
              key={course.id}
              onClick={() => { this.props.onCourseClick(course.id) }}
              button
            >
              <ListItemIcon>
                <ClassIcon />
              </ListItemIcon>
              <ListItemText primary={course.name} />
            </ListItem>
          ))}
        </List>

        <Button
          variant="raised"
          color="secondary"
          style={{ marginLeft: 20, marginBottom: 20 }}
          onClick={this.props.onCreateClick}
        >
          Criar curso
          <AddIcon 
            style={{ marginLeft: 10 }}
          />
        </Button>

      </div>
    );
  }
}