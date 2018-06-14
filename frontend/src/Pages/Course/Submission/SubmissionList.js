import React from "react";
import Api from "../../../Api";

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import IconButton from "@material-ui/core/IconButton";

import AssignmentIcon from "@material-ui/icons/Assignment";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import Button from "@material-ui/core/Button";
import AddIcon from "@material-ui/icons/Add";
import Typography from "@material-ui/core/Typography";

export default class SubmissionList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null,
      loading: false
    };
  }

  getSubmissionsList = () => {
    this.setState({ loading: true });
    Api.get("/submissions/submissionsassig/" + this.props.assignmentid).then((res) => {
      this.setState({ data: res.data.data, loading: false });
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
  }

  componentDidMount() {
    this.getSubmissionsList();
  }

  render() {
    console.log("coe rapaziada", this.state.data);
    return (
      <div>
      <Typography
          variant="title"
          style={{ paddingLeft: 20, paddingTop: 22, paddingRight: 20, paddingBottom: 4 }}
        >
          Submissões
        </Typography>

        <List >
          {this.state.data && this.state.data.map((submission) => (
            <ListItem key={submission.id}>              
              {submission.studentName}
            </ListItem>
          ))}
        </List>
      </div>
    );
  }
}