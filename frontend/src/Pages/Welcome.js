import React from "react";
import Axios from "axios";
import Config from "../Config";

import List, { ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction } from "material-ui/List";
import IconButton from "material-ui/IconButton";
import Typography from "material-ui/Typography";
import ClassIcon from "@material-ui/icons/Class";
import AddIcon from "@material-ui/icons/Add";
import Button from "material-ui/Button";
import Dialog from 'material-ui/Dialog/Dialog';
import DialogActions from 'material-ui/Dialog/DialogActions';
import DialogContent from 'material-ui/Dialog/DialogContent';
import DialogContentText from 'material-ui/Dialog/DialogContentText';
import DialogTitle from 'material-ui/Dialog/DialogTitle';

export default class Welcome extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      list: [],
      currentClasses: [],
      loading: false,
      dialogRegisterOpen: false
    };
  }

  // @italotabatinga: Dont know if this is the best way is with
  // componentDidMount and componentDidUpdate, but it works
  // when you give Welcome Class the responsability to GET its 
  // own lists
  componentDidMount = () => {
    if(this.props.user)
      this.getClassesList();
  }

  componentDidUpdate = (prevProps, prevState, snapshot) => {
    if(this.props.user && prevProps != this.props) {
      this.getClassesList();
    }
  }

  getClassesList = () => {
    // All classes
    this.setState({ loading: true });
    Axios.get(Config.api + "/classes").then((res) => {
      this.setState({ list: res.data.data, loading: false });
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
    // My current classes
    this.setState({ loading: true });
    Axios.get(Config.api + "/classesgid/" + this.props.user.gid).then((res) => {
      this.setState({ currentClasses: res.data.data, loading: false });
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
  }

  handleRegister = (classId) => {
    this.setState({ loading: true });
    Axios.post(Config.api + "/registrations/",{
        gid: this.props.user.gid,
        email: this.props.user.email,
        photo: this.props.user.photo,
        username: this.props.user.name,
        classId: classId
      }).then((res) => {
      this.getClassesList();
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
          {this.state.currentClasses.map((theClass) => (
            <ListItem
              key={theClass.id}
              onClick={() => { this.props.onClassClick(theClass.id) }}
              button
            >
              <ListItemIcon>
                <ClassIcon />
              </ListItemIcon>
              <ListItemText primary={theClass.name} />
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
          {this.state.list.filter( o => !this.state.currentClasses.map(x => x.id).includes(o.id)).map((classes) => (
            <ListItem
              key={classes.id}
              button
            >
            
              <ListItemIcon>
                <ClassIcon />
              </ListItemIcon>
              
              <ListItemText primary={classes.name} />

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
                <DialogTitle id="alert-dialog-title">{classes.name}</DialogTitle>
                
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
                    onClick={ () => { this.handleRegister(classes.id) }} 
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