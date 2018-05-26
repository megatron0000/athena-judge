import React from "react";

import Typography from "material-ui/Typography";
import TextField from "material-ui/TextField";
import Button from "material-ui/Button";
import SendIcon from "@material-ui/icons/Send";
import Dialog from 'material-ui/Dialog/Dialog';
import DialogActions from 'material-ui/Dialog/DialogActions';
import DialogContent from 'material-ui/Dialog/DialogContent';
import DialogContentText from 'material-ui/Dialog/DialogContentText';
import DialogTitle from 'material-ui/Dialog/DialogTitle';

export default class ClassForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: this.props.name,
      description: this.props.description,
      professorid: this.props.professorid,
      dialogCreateOpen: false
    }
  }

  handleNameChange = (e) => {
    this.setState({ name: e.target.value });
  }

  handleDescriptionChange = (e) => {
    this.setState({ description: e.target.value });
  }

  handleOpenDialogCreate = () => {
    this.setState({ dialogCreateOpen: true });
  };

  handleCloseDialogCreate = () => {
    this.setState({ dialogCreateOpen: false });
  };

    render() {
        return  (
            <div>
            <Typography
              variant="title"
              style={{ paddingLeft: 20, paddingTop: 22, paddingRight: 20, paddingBottom: 4 }}
            >
              Criar Novo Curso
            </Typography>

            <form style={{ padding: 20 }}>
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
                        onClick={this.handleOpenDialogCreate}
                    >
                        <SendIcon style={{ marginRight: 16 }} />
                        Enviar
                    </Button>

                    <Dialog
                        open={this.state.dialogCreateOpen}
                        onClose={this.handleCloseDialogCreate}
                        aria-labelledby="alert-dialog-title"
                        aria-describedby="alert-dialog-description"
                    >
                        <DialogContent>
                          <DialogContentText id="alert-dialog-description">
                            Tem certeza que deseja criar essa disciplina?
                          </DialogContentText>
                        </DialogContent>
                
                        <DialogActions>
                          <Button onClick={this.handleCloseDialogCreate} color="primary">
                            Não
                          </Button>
                  
                         <Button 
                           onClick={ () => { this.props.onSubmit(this.state), this.handleCloseDialogCreate() }} 
                            color="primary" autoFocus>
                            Sim
                          </Button>
                        </DialogActions>
              
                    </Dialog>

                </div>
            </form>
            </div>
        );
    }
}