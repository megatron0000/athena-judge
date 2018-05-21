import React from "react";
import Axios from "axios";
import Config from "../Config";

import List, { ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction } from "material-ui/List";
import IconButton from "material-ui/IconButton";
import Typography from "material-ui/Typography";
import ClassIcon from "@material-ui/icons/Class";
import AddIcon from "@material-ui/icons/Add";
import Button from "material-ui/Button";

export default class Welcome extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      list: [],
      currentClasses: [],
      loading: false
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

  handleRegister = (classid) => {
    this.setState({ loading: true });
    Axios.post(Config.api + "/registrations/",{
        gid: this.props.user.gid,
        classid: classid
      }).then((res) => {
      this.getClassesList();
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
  }

  render() {
    return (
      <div>
        <Typography
          variant="title"
          style={{ paddingLeft: 20, paddingTop: 10, paddingRight: 20, paddingBottom: 4 }}
        >
          Meus Cursos
        </Typography>
        <List >
          {this.state.currentClasses.map((classes) => (
            <ListItem
              key={classes.id}
              onClick={() => { this.props.showClass(classes.id) }}
              button
            >
              <ListItemIcon>
                <ClassIcon />
              </ListItemIcon>
              <ListItemText primary={classes.name} />
            </ListItem>
          ))}
        </List>
        <Button
          variant="raised"
          color="secondary"
          style={{ marginLeft: 20, marginBottom: 20, zIndex: 10000 }}
          onClick={() => {
              this.props.showCreateClass();
            }
          }
        >
          Adicionar
          <AddIcon 
            style ={{ marginLeft: 10 }}
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
                style={{ marginLeft: 20, marginBottom: 20, zIndex: 10000 }}
                onClick={() => {
                  this.handleRegister(classes.id);
                }}
              >
              Inscrever-se
              <AddIcon
                style={{ marginLeft: 10 }}
              />
            </Button>

            </ListItem>
          ))}
        </List>

      </div>
    );
  }
}