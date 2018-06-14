import React from "react";

import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import HomeIcon from "@material-ui/icons/Home";

import AuthButton from "./AuthButton";

export default function TopBar(props) {
  return (
    <AppBar position="fixed">
      <Toolbar>
        <IconButton color="inherit" style={{ marginLeft: -12, marginRight: 20 }} onClick={props.onHomeClick}>
          <HomeIcon />
        </IconButton>
        <Typography variant="title" color="inherit" noWrap style={{ flex: 1 }}>
          { props.title }
        </Typography>
        <AuthButton
          user={props.user}
          onUserUpdate={props.onUserUpdate}
        />
      </Toolbar>
    </AppBar>
  );
}