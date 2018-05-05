import React from "react";

import List, { ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction } from "material-ui/List";
import IconButton from "material-ui/IconButton";

import ClassIcon from "@material-ui/icons/Class";

export default class ClassesList extends React.Component {
  render() {
    return (
      <List style={{ width: 250 }}>
        {this.props.data.map((classes) => (
          <ListItem 
            key={classes.id}
            button
          >
            <ListItemIcon>
              <ClassIcon />
            </ListItemIcon>
            <ListItemText primary={classes.name} />
          </ListItem>  
        ))}
      </List>
    );
  }
}