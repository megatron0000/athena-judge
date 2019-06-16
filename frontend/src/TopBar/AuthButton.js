import React from "react"

import Config from "../Config"
import LoginButton from "./LoginButton"
import UserMenu from "./UserMenu"
import Api from "../Api";
import GoogleApi from "../GoogleApi";

export default class AuthButton extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      user: null,
      gauth: null
    }
  }

  componentDidMount() {
    // gauth reference: https://developers.google.com/identity/sign-in/web/reference
    if (!window.gapi) {
      console.log("Missing Google Auth Api")
      return
    }
    gapi.load("client:auth2", () => {
      Promise.all([
        Api.get('/info/scopes').then(res => res.data.join(' ')),
        Api.get('/info/client-id').then(res => res.data),
        Api.get('/info/google-discovery-docs').then(res => res.data)
      ])
        .then(params => gapi.client.init({
          client_id: params[1],
          scope: params[0],
          discoveryDocs: params[2]
        }))
        .then(() => {
          GoogleApi.init(gapi)
          const gauth = gapi.auth2.getAuthInstance()
          console.log(gauth)
          this.handleUserUpdate(gauth.currentUser.get())
          this.setState({ gauth: gauth })
        })
        .catch(err => {
          console.log(err)
        })
    })
  }

  handleUserUpdate = guser => {
    console.log('guser is')
    console.log(guser)
    if (guser && guser.isSignedIn()) {

      const id_token = guser.getAuthResponse().id_token
      let profile = guser.getBasicProfile()

      this.props.onUserUpdate({
        gid: profile.getId(),
        name: profile.getName(),
        photo: profile.getImageUrl(),
        email: profile.getEmail(),
        id_token,
      })
    } else {
      this.props.onUserUpdate(null)
    }
  }

  handleLogin = () => {
    if (!this.state.gauth) {
      return
    }
    return this.state.gauth.signIn().then(this.handleUserUpdate)
  }

  handleLogout = () => {
    if (this.state.gauth) {
      this.state.gauth.signOut()
        .then(this.handleUserUpdate)
    }
  }

  render() {
    return (
      <div>
        {this.props.user == null
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
    )
  }
}
