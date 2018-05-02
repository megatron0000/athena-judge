import React from "react";

import List, { ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction } from "material-ui/List";
import IconButton from "material-ui/IconButton";

import AssignmentIcon from "@material-ui/icons/Assignment";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";

export default class AssignmentList extends React.Component {
  render() {
    return (
      <List>
        {this.props.data.map((assignment) => (
          <ListItem
            key={assignment.id}
            button
            onClick={() => { this.props.onOpen(assignment.id) }}
          >
            <ListItemIcon>
              <AssignmentIcon />
            </ListItemIcon>
            <ListItemText
              primary={assignment.title}
              secondary={assignment.description}
            />
            <ListItemSecondaryAction>
              <IconButton
                aria-label="Edit"
                onClick={() => { this.props.onEdit(assignment.id) }}
              >
                <EditIcon />
              </IconButton>
              <IconButton
                aria-label="Delete"
                onClick={() => { this.props.onDelete(assignment.id) }}
              >
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    );
  }
}