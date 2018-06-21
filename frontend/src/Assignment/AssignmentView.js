import React from "react";
import Api from "../Api";

import TextFileUploadButton from "../Components/TextFileUploadButton";
import CodeView from "../Components/CodeView";

import CircularProgress from "@material-ui/core/CircularProgress";
import Button from "@material-ui/core/Button";
import SendIcon from "@material-ui/icons/Send";
import UploadIcon from "@material-ui/icons/FileUpload";

import ConfirmDialog from "../Components/ConfirmDialog";

export default class AssignmentsView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      code: null,
      dialogAddSubmissionOpen: false,
    };
  }

  handleUpload = (file) => {
    console.log(file);
    this.setState({ code: file.data });
  }

  handleSubmission = () => {
    this.setState({ loading: true });
    Api.post("/submissions", {
      assignmentId: this.props.assignmentId,
      courseId: this.props.courseId,
      code: this.state.code,
      username: this.props.user.name,
      usergid: this.props.user.gid,
      email: this.props.user.email,
    }).then((res) => {
      this.setState({ loading: false });
    }).catch((err) => {
      console.log(err);
      this.setState({ loading: false });
    }); 
  }

  handleOpenDialogAddSubmission = () => {
    this.setState({ dialogAddSubmissionOpen: true });
  };

  handleCloseDialogAddSubmission = () => {
    this.setState({ dialogAddSubmissionOpen: false });
  };

  render() {
    return (
      <div>
        { this.state.loading &&
          <CircularProgress style={{ float: "right", marginRight: 18, marginTop: 18 }} /> }
          
        <CodeView>{ this.state.code }</CodeView>

        <div style={{ textAlign: "center", margin: 10 }}>
          <Button
            variant="raised"
            style={{ marginRight: 10 }}
            onClick={this.props.onBack}
          >
            Voltar
          </Button>
          <TextFileUploadButton
            accept=".cpp,.c"
            style={{ marginRight: 10 }}
            onUpload={this.handleUpload}
          >
            <UploadIcon style={{ marginRight: 16 }} />
            {this.state.code ? "Troque Código" : "Escolha Código"}
          </TextFileUploadButton>
          <Button
            variant="raised"
            color="primary"
            onClick={() => { this.handleOpenDialogAddSubmission() }}
          >
            <SendIcon style={{ marginRight: 16 }} />
            Enviar
          </Button>
        </div>
        
        <ConfirmDialog
          open={this.state.dialogAddSubmissionOpen}
          text="Tem certeza que deseja submeter esta solução?"
          onConfirm={() => this.handleSubmission(this.state)}
          onClose={this.handleCloseDialogAddSubmission}
        />
      </div>
    );
  }
}