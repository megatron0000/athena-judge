import React from "react";

import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";

export default class ConfirmDialog extends React.Component {
  render() {
    return (
      <Dialog
        open={this.props.open}
        onClose={this.onClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            { this.props.text }
          </DialogContentText>
        </DialogContent>
            
        <DialogActions>
          <Button onClick={this.props.onClose} color="primary">
            Não
          </Button>
        
            <Button 
            onClick={() => {this.props.onConfirm(); this.props.onClose() }}
            color="primary" autoFocus>
            Sim
          </Button>
        </DialogActions>
          
      </Dialog>
    );
  }
}