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
    Axios.get(Config.api + "/submissions/submissionsassig/" + this.props.assignmentid).then((res) => {
      this.setState({ data: res.data.data, loading: false });
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
  }

  componentWillMount() {
    this.getSubmissionsList();
  }

  render() {
    return (
      <div>
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