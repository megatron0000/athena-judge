import React from 'react';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Avatar from '@material-ui/core/Avatar';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import PersonIcon from '@material-ui/icons/Person';
import AddIcon from '@material-ui/icons/Add';

export default class AssignStudentBox extends React.Component {
  constructor(props) {
    super(props);
  }

  handleClose = () => {
    this.props.onClose(null);
  };

  handleListItemClick = value => {
    this.props.onClose(value);
  };

  render() {
    return (
      <Dialog onClose={this.handleClose} aria-labelledby="simple-dialog-title" open={this.props.open}>
        <DialogTitle id="simple-dialog-title">Deseja Adicionar</DialogTitle>
        <div>
          <List>
            <ListItem button onClick={() => this.handleListItemClick("atividade")} key={"Atividade"}>
                <Avatar >
                  <PersonIcon />
                </Avatar>
              <ListItemText primary={"Atividade"} />
            </ListItem>
            <ListItem button onClick={() => this.handleListItemClick("aluno")} key={"Aluno"}>
                <Avatar >
                  <PersonIcon />
                </Avatar>
              <ListItemText primary={"Aluno"} />
            </ListItem>
            <ListItem button onClick={() => this.handleListItemClick("gerarLink")}>
                <Avatar>
                  <AddIcon />
                </Avatar>
              <ListItemText primary="Gerar Link de Cadastro" />
            </ListItem>
          </List>
        </div>
      </Dialog>
    );
  }
}