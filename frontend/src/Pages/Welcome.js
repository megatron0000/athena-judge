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
      list: [],
      currentCourses: [],
      loading: false,
      dialogRegisterOpen: false
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
    this.setState({ loading: true });
    Api.get("/courses").then((res) => {
      this.setState({ list: res.data.data, loading: false });
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
    // My current courses
    this.setState({ loading: true });
    Api.get("/coursesgid/" + this.props.user.gid).then((res) => {
      this.setState({ currentCourses: res.data.data, loading: false });
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
  }

  handleRegister = (courseId) => {
    this.setState({ loading: true });
    Api.post("/registrations/",{
        gid: this.props.user.gid,
        email: this.props.user.email,
        photo: this.props.user.photo,
        username: this.props.user.name,
        courseId: courseId
      }).then((res) => {
      this.getCoursesList();
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
  }

  handleOpenDialogRegister = () => {
    this.setState({ dialogRegisterOpen: true });
  };

  handleCloseDialogRegister = () => {
    this.setState({ dialogRegisterOpen: false });
  };

  render() {
    return (
      <div>
        <Typography variant="title" style={{ paddingLeft: 20, paddingTop: 10, paddingRight: 20, paddingBottom: 4 }} >
          Meus Cursos
        </Typography>

        <List >
          {this.state.currentCourses.map((course) => (
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
          Criar novo curso
          <AddIcon 
            style={{ marginLeft: 10 }}
          />
        </Button>

        <Typography
          variant="title"
          style={{ paddingLeft: 20, paddingTop: 10, paddingRight: 20, paddingBottom: 4 }}
        >
          Outros Cursos
        </Typography>
        <List >
          {this.state.list.filter( o => !this.state.currentCourses.map(x => x.id).includes(o.id)).map((course) => (
            <ListItem
              key={course.id}
              button
            >
            
              <ListItemIcon>
                <ClassIcon />
              </ListItemIcon>
              
              <ListItemText primary={course.name} />

              <Button
                variant="raised"
                color="secondary"
                style={{ marginLeft: 20, marginBottom: 20 }}
                onClick={this.handleOpenDialogRegister}
              >
                Inscrever-se
              </Button>

              <Dialog
                open={this.state.dialogRegisterOpen}
                onClose={this.handleCloseDialogRegister}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
              >
                <DialogTitle id="alert-dialog-title">{course.name}</DialogTitle>
                
                <DialogContent>
                  <DialogContentText id="alert-dialog-description">
                    Tem certeza que deseja se cadastrar na disciplina?
                  </DialogContentText>
                </DialogContent>
                
                <DialogActions>
                  <Button onClick={this.handleCloseDialogRegister} color="primary">
                    Não
                  </Button>
                  
                  <Button 
                    onClick={ () => { this.handleRegister(course.id) }} 
                    color="primary" autoFocus>
                    Sim
                  </Button>
                </DialogActions>
              
               </Dialog>

            </ListItem>
          ))}
        </List>

      </div>
    );
  }
}