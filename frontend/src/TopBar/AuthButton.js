import React from "react";

import Config from "../Config";
import LoginButton from "./LoginButton";
import UserMenu from "./UserMenu";

export default class AuthButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      gauth: null
    }
  }

  componentDidMount() {
    // gauth reference: https://developers.google.com/identity/sign-in/web/reference
    if (!window.gapi) {
      console.log("Missing Google Auth Api");
      return;
    }
    window.gapi.load("auth2", () => {
      window.gapi.auth2.init({
        client_id: Config.gauthClientId
      }).then((gauth) => {
        this.handleUserUpdate(gauth.currentUser.get());
        this.setState({ gauth: gauth });
      }).catch((err) => {
        console.log(err);
      });
    });
  }

  handleUserUpdate = (guser) => {
    if (guser && guser.isSignedIn()) {
      let profile = guser.getBasicProfile();
      this.props.onUserUpdate({
        gid: profile.getId(),
        name: profile.getName(),
        photo: profile.getImageUrl(),
        email: profile.getEmail()
      });
    } else {
      this.props.onUserUpdate(null);
    }
  }

  handleLogin = () => {
    if (this.state.gauth) {
      this.state.gauth.signIn()
        .then(this.handleUserUpdate);
    }
  }

  handleLogout = () => {
    if (this.state.gauth) {
      this.state.gauth.signOut()
        .then(this.handleUserUpdate);
    }
  }

  render() {
    return (
      <div>
      { this.props.user == null
        ? <LoginButton
          enabled={this.state.gauth != null}
          onClick={this.handleLogin}
        />
        : <UserMenu
          user={this.props.user}
          onLogout={this.handleLogout}
        />
      }
      </div>
    );
  }
}
