import React from "react";
import Api from "../Api";

import Drawer from "material-ui/Drawer";
import List, { ListItem, ListItemIcon, ListItemText } from "material-ui/List";
import Divider from 'material-ui/Divider';

import HomeIcon from "@material-ui/icons/Home";
import AssignmentIcon from "@material-ui/icons/Assignment";
import ClassIcon from "@material-ui/icons/Class";
import PeopleIcon from "@material-ui/icons/People";

import CoursesList from "./CoursesList"

export default class SideBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      list:  [],
      loading: false
    };
  }

  componentWillMount() {
    this.showList();
  }

  handleOpen = () => {
    this.setState({ open: true });
  }

  handleClose = () => {
    this.setState({ open: false });
  }

  handleItemClick = (handler) => {
    return () => this.setState({ open: false }, handler);
  }
  
  showList = () => {
    this.setState({loading: true });
    
    Api.get("/courses").then((res) => {
      this.setState({ list: res.data.data, loading: false });
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
  }

  render() {
    return (
      <Drawer open={this.state.open} onClose={this.handleClose}>
        <List style={{ width: 250 }}>

          <ListItem button onClick={this.handleItemClick(this.props.onHomeClick)}>
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItem>

          <Divider />

          <ListItem button>
            <ListItemIcon>
              <ClassIcon />
            </ListItemIcon>
            <ListItemText primary="Cursos" />
          </ListItem>

          <Divider />

          <ListItem button>
            <ListItemIcon>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="Alunos" />
          </ListItem>

          <ListItem button>
            <ListItemIcon>
              <AssignmentIcon />
            </ListItemIcon>
            <ListItemText primary="Atividades" />
          </ListItem>

        </List>
        <CoursesList
          data={this.state.list}
        />
      </Drawer>
    );
  }
}