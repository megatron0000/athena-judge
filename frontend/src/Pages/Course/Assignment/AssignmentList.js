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
import Dialog from '@material-ui/core/Dialog/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

export default class AssignmentList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null,
      loading: false,
      dialogOpenDeleteAssign: false,
      candidateToDelete: null
    };
  }

  getAssignmentsList = () => {
    this.setState({ loading: true });
    Api.get("/assignments/course/" + this.props.courseId).then((res) => {
      this.setState({ data: res.data.data, loading: false });
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
  }

  handleDelete = () => {
    Api.delete("/assignments/" + this.state.candidateToDelete).then((res) => {  
      this.setState({ data: this.state.data.filter(o => o.id !== this.state.candidateToDelete), loading: true });
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
  }

  componentWillMount() {
    this.getAssignmentsList();
  }

  handleOpenDialogDeleteAssign = (id) => {
    this.setState({ dialogOpenDeleteAssign: true,  candidateToDelete: id});
  };

  handleCloseDialogDeleteAssign = () => {
    this.setState({ dialogOpenDeleteAssign: false });
  };

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

                  <Dialog
                    open={this.state.dialogOpenDeleteAssign}
                    onClose={this.handleCloseDialogDeleteAssign}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                  >
                    <DialogContent>
                      <DialogContentText id="alert-dialog-description">
                        Tem certeza que deseja apagar esta atividade?
                      </DialogContentText>
                    </DialogContent>
                
                    <DialogActions>
                      <Button onClick={this.handleCloseDialogDeleteAssign} color="primary">
                         Não
                      </Button>
                  
                      <Button 
                        onClick={() => { this.handleDelete(); this.handleCloseDialogDeleteAssign() }}
                        color="primary" autoFocus>
                        Sim
                      </Button>
                    </DialogActions>
              
                  </Dialog>


                  <IconButton
                   aria-label="Delete"
                    onClick={() => {this.handleOpenDialogDeleteAssign(assignment.id)}}
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
            style={{ marginLeft: 20, marginBottom: 20 }}
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