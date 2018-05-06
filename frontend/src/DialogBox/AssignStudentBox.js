import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import Button from 'material-ui/Button';
import Avatar from 'material-ui/Avatar';
import List, { ListItem, ListItemAvatar, ListItemText } from 'material-ui/List';
import Dialog, { DialogTitle } from 'material-ui/Dialog';
import PersonIcon from '@material-ui/icons/Person';
import AddIcon from '@material-ui/icons/Add';
import Typography from 'material-ui/Typography';
import blue from 'material-ui/colors/blue';

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
              <ListItemAvatar>
                <Avatar >
                  <PersonIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={"Atividade"} />
            </ListItem>
            <ListItem button onClick={() => this.handleListItemClick("aluno")} key={"Aluno"}>
              <ListItemAvatar>
                <Avatar >
                  <PersonIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={"Aluno"} />
            </ListItem>
            <ListItem button onClick={() => this.handleListItemClick("gerarLink")}>
              <ListItemAvatar>
                <Avatar>
                  <AddIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary="Gerar Link de Cadastro" />
            </ListItem>
          </List>
        </div>
      </Dialog>
    );
  }
}