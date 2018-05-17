import React from "react";
import Axios from "axios";

import Config from "../../../Config";

import TextField from "material-ui/TextField";
import { IconButton, Icon, InputAdornment } from 'material-ui';
import Button from "material-ui/Button";
import SendIcon from "@material-ui/icons/Send";
import FileUpload from '@material-ui/icons/FileUpload';

import DateTimePicker from "./DateTimePicker";

export default class AssignmentForm extends React.Component {
  constructor(props) {
    super(props);
    console.log(props);
    this.state = {
      id: this.props.assignmentid,
      title: this.props.title,
      description: this.props.description,
      // code: this.props.code
      dueDate: this.props.dueDate
    }
    console.log(this.state);
  }

  handleTitleChange = (e) => {
    this.setState({ title: e.target.value });
  }

  handleDescriptionChange = (e) => {
    this.setState({ description: e.target.value });
  }

  handleDueDateChange = (e) => {
    console.log(e.target.value);
    this.setState({ dueDate: e.target.value});
  }

  /*
  @vb: This code should be used to handle a single submission, not creating/editing the assignment.

  readTextFile(file) {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result.replace("\r", ""));
      }
      reader.readAsText(file);
    })
  }

  handleUpload = (e) => {
    let fileUpload = document.createElement("input");
    fileUpload.type = "file";
    fileUpload.accept = ".cpp, .c";
    fileUpload.onchange = () => {
      this.readTextFile(fileUpload.files[0]).then((text) => {
        this.setState({ code: text });
      });
    };
    fileUpload.click();
  }
  */

  render() {
    return (
      <form style={{ padding: 20 }}>
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
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <Button
            variant="raised"
            style={{ marginRight: 10 }}
            onClick={this.props.onBack}
          >
            Voltar
          </Button>
          
          {/*
          @vb: This code should be used to handle a single submission, not creating/editing the assignment.
          
          <Button
            variant="raised"
            color="default"
            style={{ marginRight: 10 }}
            onClick={this.handleUpload}
          >
            <FileUpload style={{ marginRight: 16 }} />
            Upload
          </Button>*/}
          <Button
            variant="raised"
            color="primary"
            onClick={() => { this.props.onSubmit(this.state) }}
          >
            <SendIcon style={{ marginRight: 16 }} />
            Enviar
          </Button>
        </div>
      </form>
    );
  }
}