import React from "react";

import Typography from "@material-ui/core/Typography";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import SendIcon from "@material-ui/icons/Send";

export default class CourseForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: this.props.name,
      description: this.props.description,
    }
  }

  handleNameChange = (e) => {
    this.setState({ name: e.target.value });
  }

  handleDescriptionChange = (e) => {
    this.setState({ description: e.target.value });
  }

  render() {
    return  (
      <div>
        <Typography
          variant="title"
          style={{ paddingLeft: 20, paddingTop: 22, paddingRight: 20, paddingBottom: 4 }}
        >
          Criar Curso
        </Typography>

        <div style={{ padding: 20 }}>
          <TextField
            label="Nome"
            defaultValue={this.props.name}
            autoFocus
            style={{ width: "100%" }}
            onChange={this.handleNameChange}
          />

          <div style={{ height: 20 }}></div>
          
          <TextField
            label="Descrição"
            defaultValue={this.props.description}
            multiline
            rows={10}
            style={{ width: "100%" }}
            onChange={this.handleDescriptionChange}
          />
          
          <div style={{ height: 20 }}></div>
          <div style={{ textAlign: "center" }}>
          
            <Button
              variant="raised"
              style={{ marginRight: 10 }}
              onClick={this.props.onBack}
            >
              Voltar
            </Button>

            <Button
              variant="raised"
              color="primary"
              onClick={() => this.props.onSubmit(this.state)}
            >
            <SendIcon style={{ marginRight: 16 }} />
              Criar curso
            </Button>

          </div>
        </div>
      </div>
    );
  }
}