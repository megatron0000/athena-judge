import React from "react";
import Api from "../Api";

import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import IconButton from "@material-ui/core/IconButton";

import AssignmentIcon from "@material-ui/icons/Assignment";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import Button from "@material-ui/core/Button";
import AddIcon from "@material-ui/icons/Add";

import ConfirmDialog from "../Components/ConfirmDialog";
import GoogleApi from "../GoogleApi";

export default class AssignmentList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      assignmentList: [],
      loading: false,
      dialogDeleteAssignmentOpen: false,
      candidateToDelete: null
    };
  }

  getAssignmentsList = () => {
    this.setState({ loading: true })
    GoogleApi.listAssignments(this.props.courseId)
      .then(assignmentList => this.setState({ assignmentList, loading: false }))
      .catch(err => {
        console.log(err)
        this.setState({ loading: false })
      })
  }

  handleDelete = () => {
    Api.delete(`/assignments/${this.state.candidateToDelete}`).then((res) => {
      this.setState({ assignmentList: this.state.assignmentList.filter(o => o.id !== this.state.candidateToDelete), loading: true });
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
  }

  componentDidMount() {
    this.getAssignmentsList();
  }

  handleOpenDialogDeleteAssign = (id) => {
    this.setState({ dialogDeleteAssignmentOpen: true, candidateToDelete: id });
  };

  handleCloseDialogDeleteAssignment = () => {
    this.setState({ dialogDeleteAssignmentOpen: false });
  };

  render() {
    return (
      <div>
        <List>
          {this.state.assignmentList && this.state.assignmentList.map(googleAssignment => (
            <ListItem
              key={googleAssignment.id}
              button
              onClick={() => { this.props.onOpen(googleAssignment) }}
            >
              <ListItemIcon>
                <AssignmentIcon />
              </ListItemIcon>
              <ListItemText
                primary={googleAssignment.title}
                secondary={googleAssignment.description}
              />
              {this.props.isProfessor &&
                <ListItemSecondaryAction>
                  <IconButton
                    aria-label="Edit"
                    onClick={() => { this.props.onEdit(googleAssignment) }}
                  >
                    <EditIcon />
                  </IconButton>

                  {/* <IconButton
                    aria-label="Delete"
                    onClick={() => { this.handleOpenDialogDeleteAssign(googleAssignment.id) }}
                  >
                    <DeleteIcon />
                  </IconButton> */}

                </ListItemSecondaryAction>
              }
            </ListItem>
          ))}
        </List>
        {this.props.isProfessor &&
          <Button
            variant="raised"
            color="secondary"
            style={{ marginLeft: 20, marginBottom: 20 }}
            onClick={() => {
              this.props.showCreateAssignment();
            }}
          >
            Criar Atividade
            <AddIcon
              style={{ marginLeft: 10 }}
            />
          </Button>
        }

        <ConfirmDialog
          open={this.state.dialogDeleteAssignmentOpen}
          text="Tem certeza que deseja apagar esta atividade?"
          onConfirm={this.handleDelete}
          onClose={this.handleCloseDialogDeleteAssignment}
        />
      </div>
    );
  }
}