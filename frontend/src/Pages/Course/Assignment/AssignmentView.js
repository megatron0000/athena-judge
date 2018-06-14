import React from "react";
import Api from "../../../Api";

import TextFileUploadButton from "../../../Components/TextFileUploadButton";
import CodeView from "../../../Components/CodeView";

import Typography from "@material-ui/core/Typography";
import CircularProgress from "@material-ui/core/CircularProgress";
import Button from "@material-ui/core/Button";
import SendIcon from "@material-ui/icons/Send";
import UploadIcon from "@material-ui/icons/FileUpload";
import Dialog from '@material-ui/core/Dialog/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

export default class AssignmentsView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      code: null,
      dialogOpenAddSubmission: false,
    };
  }

  handleUpload = (file) => {
    console.log(file);
    this.setState({ code: file.data });
  }

  handleSubmission = () => {
    this.setState({ loading: true });
    Api.post("/submissions", {
      assignid: this.props.assignmentid,
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
    this.setState({ dialogOpenAddSubmission: true });
  };

  handleCloseDialogAddSubmission = () => {
    this.setState({ dialogOpenAddSubmission: false });
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
        
        <Dialog
            open={this.state.dialogOpenAddSubmission}
            onClose={this.handleCloseDialogAddSubmission}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Tem certeza que deseja submeter esta solução?
            </DialogContentText>
          </DialogContent>
              
          <DialogActions>
            <Button onClick={this.handleCloseDialogAddSubmission} color="primary">
                Não
            </Button>
                
            <Button 
              onClick={() => { this.handleSubmission(this.state), this.handleCloseDialogAddSubmission() }}
              color="primary" autoFocus>
              Sim
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}