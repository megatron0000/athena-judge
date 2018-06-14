import React from "react";

import List, { ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction } from "material-ui/List";
import IconButton from "material-ui/IconButton";

import ClassIcon from "@material-ui/icons/Class";

export default class CoursesList extends React.Component {
  render() {
    return (
      <List style={{ width: 250 }}>
        {this.props.data.map((course) => (
          <ListItem 
            key={course.id}
            button
          >
            <ListItemIcon>
              <ClassIcon />
            </ListItemIcon>
            <ListItemText primary={course.name} />
          </ListItem>  
        ))}
      </List>
    );
  }
}