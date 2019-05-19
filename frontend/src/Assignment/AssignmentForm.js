import React from "react";

import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import SendIcon from "@material-ui/icons/Send";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import Typography from "@material-ui/core/Typography";

import DateTimePicker from "./DateTimePicker";
import MultipleTextFileUploadArea from "../Components/MultipleTextFileUploadArea";
import ConfirmDialog from "../Components/ConfirmDialog";

/*
@vb: We are disabling file attachment per now. Only plain text uploads are allowed,
and they are stored in the database.
*/

export default class AssignmentForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      id: this.props.assignmentId,
      title: this.props.title,
      description: this.props.description,
      dueDate: this.props.dueDate,
      publicTests: [],
      privateTests: [],
      dialogCreateAssignmentOpen: false,
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

  handlePublicTestsChange = (files) => {
    this.setState({ publicTests: files });
  }

  handlePrivateTestsChange = (files) => {
    this.setState({ privateTests: files });
  }

  handleOpenDialogCreateAssign = () => {
    this.setState({ dialogCreateAssignmentOpen: true });
  };

  handleCloseDialogCreateAssignment = () => {
    this.setState({ dialogCreateAssignmentOpen: false });
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
          ATENÇÃO: Padrão de pares entradas e saídas 
        </Typography>

        <div style={{ height: 20 }}></div>
        <Typography variant="caption">
          Testes públicos
        </Typography>
        <MultipleTextFileUploadArea
          onChange={this.handlePublicTestsChange}
          style={{ paddingTop: 10 }}
        />

        <div style={{ height: 20 }}></div>
        <Typography variant="caption">
          Testes privados
        </Typography>
        <MultipleTextFileUploadArea
          onChange={this.handlePrivateTestsChange}
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
            { (this.props.assignmentId == null) ? "Criar Atividade" : "Editar Atividade" }
          </Button>

          <ConfirmDialog
            open={this.state.dialogCreateAssignmentOpen}
            text={`Tem certeza que deseja ${ (this.props.assignmentId == null) ? "criar" : "editar" } esta atividade?`}
            onConfirm={() => this.props.onSubmit(this.state)}
            onClose={this.handleCloseDialogCreateAssignment}
          />
        </div>
      </div>
    );
  }
}