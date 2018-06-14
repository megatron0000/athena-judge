import React from "react";

import Avatar from "@material-ui/core/Avatar";
import IconButton from "@material-ui/core/IconButton";
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';


export default class UserMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = { anchorEl: null };
  }

  handleMenuOpen = (event) => {
    this.setState({ anchorEl: event.currentTarget });
  }

  handleMenuClose = () => {
    this.setState({ anchorEl: null });
  }

  render() {
    return (
      <React.Fragment>
        <IconButton
          aria-owns={this.state.anchorEl ? "auth-menu" : null}
          aria-haspopup="true"
          onClick={this.handleMenuOpen}
        >
          <Avatar
            alt={this.props.user.name}
            src={this.props.user.photo}
          />
        </IconButton>
        <Menu
          id="auth-menu"
          anchorEl={this.state.anchorEl}
          open={this.state.anchorEl != null}
          onClose={this.handleMenuClose}
        >
          <MenuItem disabled>
            {this.props.user.name} ({this.props.user.email})
          </MenuItem>
          <MenuItem onClick={() => { this.handleMenuClose(); this.props.onLogout(); }}>Logout</MenuItem>
        </Menu>
      </React.Fragment>
    );
  }
}