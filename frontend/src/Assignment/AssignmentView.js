import React from "react";
import Api from "../Api";

import TextFileUploadButton from "../Components/TextFileUploadButton";
import CodeView from "../Components/CodeView";

import CircularProgress from "@material-ui/core/CircularProgress";
import Button from "@material-ui/core/Button";
import SendIcon from "@material-ui/icons/Send";
import UploadIcon from "@material-ui/icons/FileUpload";

import ConfirmDialog from "../Components/ConfirmDialog";
import SubmissionResult from "../Submission/SubmissionResult";

export default class AssignmentsView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      code: null,
      tests: [],
      dialogAddSubmissionOpen: false,
      results: [],
    };
  }

  componentDidMount() {
    this.getTests();
  }

  getTests = () => {
    this.setState({ loading: true });
    Api.get(`/assignments/${this.props.assignmentId}/tests`).then((res) => {
      this.setState({ tests: res.data.data, loading: false });
    })
  }

  handleUpload = (file) => {
    this.setState({ code: file.data });
  }

  handleSubmission = () => {    
    let current = -1;
    this.setState({ loading: true, results: [] });
    const runNext = () => {
      current++;
      if (current < this.state.tests.length) {
        Api.run(this.state.code, this.state.tests[current].input).then((res) => {
          let output = res.data.data.filter((e) => e.event === "stdout").map((e) => e.data).join("");
          this.setState((prev) => ({
            results: prev.results.concat({
              input: this.state.tests[current].input,
              expectedOutput: this.state.tests[current].output,
              actualOutput: output,
            }),
            loading: false,
          }));
          runNext();
        }).catch((err) => {
          console.log("err:", err);
          this.setState({ loading: false });
        });
      }
    }
    runNext();
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
        
        { this.state.code != null &&
          <CodeView style={{ marginLeft: 22, marginRight: 22, marginTop: 22 }}>{ this.state.code }</CodeView> }

        <div style={{ padding: 22 }}>
          { this.state.results.map((result, i) => <SubmissionResult key={i} result={result} /> ) }
        </div>

        <div style={{ textAlign: "center", margin: 20 }}>
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
            {this.state.code ? "Trocar Código" : "Escolher Código"}
          </TextFileUploadButton>
          <Button
            variant="raised"
            color="primary"
            onClick={this.handleOpenDialogAddSubmission}
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