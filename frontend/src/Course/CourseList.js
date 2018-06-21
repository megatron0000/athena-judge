import React from "react";
import Api from "../Api";

import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import Typography from "@material-ui/core/Typography";
import ClassIcon from "@material-ui/icons/Class";
import AddIcon from "@material-ui/icons/Add";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";

export default class CourseList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      courses: [],
      availableCourses: [],
      teachingCourses: [],
      enrolledCourses: [],
      loading: false,
      dialogEnrollOpen: false,
    };
  }

  componentDidMount = () => {
    if (this.props.user != null) {
      this.getCoursesList();
    }
  }

  getCoursesList = () => {
    this.setState({ loading: true });
    let doneCount = 0;

    // All courses    
    Api.get("/courses").then((res) => {
      this.setState({ courses: res.data.data }, done);
    });

    // My enrolled courses
    Api.get(`/courses/enrolled/${this.props.user.gid}`).then((res) => {
      this.setState({ enrolledCourses: res.data.data }, done);
    });

    // My teaching courses
    Api.get(`/courses/teaching/${this.props.user.gid}`).then((res) => {
      this.setState({ teachingCourses: res.data.data }, done);
    });

    function done() {
      doneCount++;
      if (doneCount == 3) { // all done
        // compute the list of available courses (all courses removing already enrolled courses)
        let mapCourse = {};
        for (let course of this.state.courses) {
          mapCourse[course.id] = course;
        }
        for (let course of this.state.enrolledCourses) {
          delete mapCourse[course.id];
        }
        for (let course of this.state.teachingCourses) {
          delete mapCourse[course.id];
        }
        let available = [];
        for (let course in mapCourse) {
          available.push(mapCourse[course]);
        }
        this.setState({ availableCourses: available, loading: false });
      }
    }
  }

  handleEnroll = (courseId) => {
    this.setState({ loading: true });
    Api.post(`/courses/${courseId}/students`, {
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
          {this.state.availableCourses.map((course) => (
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