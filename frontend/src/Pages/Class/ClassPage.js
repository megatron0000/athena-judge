import React from "react";
import Axios from "axios";

import Config from "../../Config";
import AssignmentList from "./Assignment/AssignmentList";

import Typography from "material-ui/Typography";
import { CircularProgress } from "material-ui/Progress";
import Divider from 'material-ui/Divider';
import Button from "material-ui/Button";

export default class ClassPage extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        // show: "list",
        // list: [],
        // assignment: null,
        // data: this.props.data,
        loading: false
      };
    }

  getClassData = () => {
    this.setState({ loading: true });
    Axios.get(Config.api + "/classes/" + this.props.classid).then((res) => {
      this.setState({ data: res.data.data, loading: false });
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    });
  }

  componentWillMount() {
    this.getClassData();
  }

    render() {
        return (
            <div>
              { this.state.loading &&
                <CircularProgress style={{ float: "right", marginRight: 18, marginTop: 18 }} /> }
              <Typography
                variant="title"
                style={{ paddingLeft: 20, paddingTop: 22, paddingRight: 20, paddingBottom: 4 }}
              >
                { this.state.data && this.state.data.name }
              </Typography>
              <Typography
                variant="subheading"
                style={{ paddingLeft: 20, paddingTop: 22, paddingRight: 20, paddingBottom: 4 }}
              >
                { this.state.data && this.state.data.description }
              </Typography>
              <Divider />
              <Typography
                variant="title"
                style={{ paddingLeft: 20, paddingTop: 22, paddingRight: 20, paddingBottom: 4 }}
              >
                Atividades
              </Typography>
              <AssignmentList 
                classid = {this.props.classid}
              />
              <Divider />
              <Typography
                variant="title"
                style={{ paddingLeft: 20, paddingTop: 22, paddingRight: 20, paddingBottom: 4 }}
              >
                Aluno
              </Typography>
            </div>
        );
    }
}