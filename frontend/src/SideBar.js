import React from "react";

import Drawer from "material-ui/Drawer";
import List, { ListItem, ListItemIcon, ListItemText } from "material-ui/List";

import AssignmentIcon from "@material-ui/icons/Assignment";
import ClassIcon from "@material-ui/icons/Class";
import PeopleIcon from "@material-ui/icons/People";

export default class SideBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false
    };
  }

  handleOpen = () => {
    this.setState({ open: true });
  }

  handleClose = () => {
    this.setState({ open: false });
  }
  
  render() {
    return (
      <Drawer open={this.state.open} onClose={this.handleClose}>
        <List style={{ width: 250 }}>

          <ListItem button>
            <ListItemIcon>
              <AssignmentIcon />
            </ListItemIcon>
            <ListItemText primary="Atividades" />
          </ListItem>

          <ListItem button>
            <ListItemIcon>
              <ClassIcon />
            </ListItemIcon>
            <ListItemText primary="Cursos" />
          </ListItem>

          <ListItem button>
            <ListItemIcon>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="Alunos" />
          </ListItem>

        </List>
      </Drawer>
    );
  }
}