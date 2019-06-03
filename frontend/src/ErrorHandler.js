import React from "react";

export default class ErrorHandler extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    console.log("aqui");
    return { error: error };
  }

  componentDidCatch(error, info) {
    this.setState({ error: error, errorInfo: info })
    console.log(this.state)
  }

  render() {
    return this.state.error
    ? <div>
        <h1>Something went wrong!</h1>
        <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo.componentStack}
        </details>
      </div> 
    : this.props.children
  }
}

