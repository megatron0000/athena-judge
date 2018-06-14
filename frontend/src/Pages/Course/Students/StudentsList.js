import React from "react";
import Api from "../../../Api";

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import IconButton from "@material-ui/core/IconButton";

import AssignmentIcon from "@material-ui/icons/Assignment";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import Button from "@material-ui/core/Button";
import AddIcon from "@material-ui/icons/Add";

export default class StudentsList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null,
      loading: false
    };
  }

  getStudentsList = () => {
    this.setState({ loading: true });
    Api.get(`/course/${this.props.courseId}/students`).then((res) => {
      this.setState({ data: res.data.data, loading: false });
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
  }

  componentWillMount() {
    this.getAssignmentsList();
  }

  render() {
    return (
      <div>
        <List>
          {this.state.data && this.state.data.map((assignment) => (
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
                  onClick={() => { this.props.onDelete(assignment.id); this.getAssignmentsList(); }}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
        <Button
          variant="raised"
          color="secondary"
          style={{ marginLeft: 20, marginBottom: 20, zIndex: 10000 }}
          onClick={() => {
            this.props.showCreateAssignment();
          }}
        >
          Adicionar
          <AddIcon
            style={{ marginLeft: 10 }}
          />
        </Button>
      </div>
    );
  }
}