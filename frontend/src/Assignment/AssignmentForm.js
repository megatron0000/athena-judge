import React from "react";

import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import SendIcon from "@material-ui/icons/Send";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import Dialog from "@material-ui/core/Dialog/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import Typography from "@material-ui/core/Typography";

import DateTimePicker from "./DateTimePicker";
import MultipleTextFileUploadArea from "../Components/MultipleTextFileUploadArea";

/*
@vb: We are disabling file attachment per now. Only plain text uploads are allowed,
and the are stored in the database.
*/

export default class AssignmentForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      id: this.props.assignmentId,
      title: this.props.title,
      description: this.props.description,
      dueDate: this.props.dueDate,
      publicTestsInput: [],
      publicTestsOutput: [],
      dialogOpenCreateAssign: false,
    }
  }

  handleTitleChange = (e) => {
    this.setState({ title: e.target.value });
  }

  handleDescriptionChange = (e) => {
    this.setState({ description: e.target.value });
  }

  handleDueDateChange = (e) => {
    this.setState({ dueDate: e.target.value });
  }

  handlePublicTestsInputChange = (files) => {
    this.setState({ publicTestsInput: files });
  }

  handlePublicTestsOutputChange = (files) => {
    this.setState({ publicTestsOutput: files });
  }

  handleOpenDialogCreateAssign = () => {
    this.setState({ dialogOpenCreateAssign: true });
  };

  handleCloseDialogCreateAssign = () => {
    this.setState({ dialogOpenCreateAssign: false });
  };

  render() {
    return (
      <div style={{ padding: 20 }}>
        <TextField
          label="Título"
          defaultValue={this.state.title}
          autoFocus
          style={{ width: "100%" }}
          onChange={this.handleTitleChange}
        />
        <div style={{ height: 20 }}></div>
        <TextField
          label="Descrição"
          defaultValue={this.state.description}
          multiline
          rows={10}
          style={{ width: "100%" }}
          onChange={this.handleDescriptionChange}
        />
        <div style={{ height: 20 }}></div>
        <DateTimePicker
          defaultValue={this.state.dueDate}
          onChange={this.handleDueDateChange}
        />

        <div style={{ height: 20 }}></div>
        <Typography variant="caption">
          Entradas dos testes públicos
        </Typography>
        <MultipleTextFileUploadArea
          onChange={this.handlePublicTestsInputChange}
          style={{ paddingTop: 10 }}
        />

        <div style={{ height: 20 }}></div>
        <Typography variant="caption">
          Saída dos testes públicos
        </Typography>
        <MultipleTextFileUploadArea
          onChange={this.handlePublicTestsOutputChange}
          style={{ paddingTop: 10 }}
        />

        <div style={{ textAlign: "center", marginTop: 10 }}>
          <Button
            variant="raised"
            style={{ marginRight: 10 }}
            onClick={this.props.onBack}
          >
          <ArrowBackIcon style={{ marginRight: 14 }} />
            Voltar
          </Button>

          <Button
            variant="raised"
            color="primary"
            onClick={() => { this.handleOpenDialogCreateAssign() }}
          >
            <SendIcon style={{ marginRight: 14 }} />
            Criar Atividade
          </Button>

          <Dialog
            open={this.state.dialogOpenCreateAssign}
            onClose={this.handleCloseDialogCreateAssign}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
          >
            <DialogContent>
              <DialogContentText id="alert-dialog-description">
                Tem certeza que deseja adicionar esta atividade?
              </DialogContentText>
            </DialogContent>
                
            <DialogActions>
              <Button onClick={this.handleCloseDialogCreateAssign} color="primary">
                Não
              </Button>
            
               <Button 
                onClick={() => { this.props.onSubmit(this.state); this.handleCloseDialogCreateAssign() }}
                color="primary" autoFocus>
                Sim
              </Button>
            </DialogActions>
              
          </Dialog>

        </div>
      </div>
    );
  }
}