import React from 'react';
import Chip from "material-ui/Chip";

export default class FilesChips extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      files: props.files
    };
  }


  render() {
    console.log("Chips", this.state.files);
    return (
      <div>
        {this.state.files && this.state.files.map((file) => {
          return(
          <Chip
            key = {this.state.files.indexOf(file)}
            onDelete = {null}
            label = {file.name}
            style = {{margin: 5}}
          />);
        })}
      </div>
    )
  }
}