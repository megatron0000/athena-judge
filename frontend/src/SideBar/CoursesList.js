import React from "react";

import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemIcon from "@material-ui/core/ListItemIcon";

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