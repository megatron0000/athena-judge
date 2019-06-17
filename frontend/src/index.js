import React from "react";
import ReactDOM from "react-dom";

import ErrorHandler from "./ErrorHandler"
import App from "./App";

ReactDOM.render(<ErrorHandler>
                    <App />
                </ErrorHandler>, document.getElementById("app"));