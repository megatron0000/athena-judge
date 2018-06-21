import React from "react";
import Api from "../Api";

import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";

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
    Api.get(`/assignments/${this.props.assignmentId}/submissions`).then((res) => {
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