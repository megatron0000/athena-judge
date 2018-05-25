import React from "react";
import Axios from "axios";

import Config from "../../../Config";

import List, { ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction } from "material-ui/List";
import IconButton from "material-ui/IconButton";

import AssignmentIcon from "@material-ui/icons/Assignment";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import Button from "material-ui/Button";
import AddIcon from "@material-ui/icons/Add";

export default class AssignmentList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // show: "list",
      // list: [],
      // assignment: null,
      data: null,
      loading: false
    };
  }

  getAssignmentsList = () => {
    this.setState({ loading: true });
    Axios.get(Config.api + "/assignments/class/" + this.props.classid).then((res) => {
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
              onClick={() => { this.props.onOpen(assignment); }}
            >
              <ListItemIcon>
                <AssignmentIcon />
              </ListItemIcon>
              <ListItemText
                primary={assignment.title}
                secondary={assignment.description}
              />
              {this.props.selfType == "Creator" &&
                <ListItemSecondaryAction>
                  <IconButton
                    aria-label="Edit"
                    onClick={() => { this.props.onEdit(assignment.id); }}
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
              }
            </ListItem>
          ))}
        </List>
        {this.props.selfType == "Creator" &&
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
        }
      </div>
    );
  }
}