import React from "react";

import TextFileUploadButton from "./TextFileUploadButton";

import UploadIcon from "@material-ui/icons/FileUpload";
import InsertDriveFileIcon from "@material-ui/icons/InsertDriveFile";
import Avatar from '@material-ui/core/Avatar';
import Chip from '@material-ui/core/Chip';

export default class MultipleTextFileUploadArea extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      files: [], // { name, data }
    }
  }

  handleUpload = (file) => {
    this.setState((prev) => ({
      files: prev.files.concat(file)
    }), () => {
      if (this.props.onChange) {
        this.props.onChange(this.state.files)
      }
    });
  }

  handleDelete = (i) => {
    this.setState((prev) => ({
      files: prev.files.slice(0, i).concat(prev.files.slice(i + 1))
    }), () => {
      if (this.props.onChange) {
        this.props.onChange(this.state.files)
      }
    });
  }

  render() {
    return (
      <div style={this.props.style}>
        <TextFileUploadButton
          accept=".txt"
          multiple={true}
          onUpload={this.handleUpload}
          style={{ float: "left", marginRight: 8 }}
        >
          <UploadIcon style={{ marginRight: 16 }} />
          Enviar
        </TextFileUploadButton>
        <div>
          { this.state.files.map((file, i) => (
            <Chip
              key={i}
              avatar={<Avatar><InsertDriveFileIcon /></Avatar>}
              label={file.name}
              style={{ margin: 5 }}
              onDelete={() => this.handleDelete(i)}
            />
          ))}
        </div>
        <div style={{ clear: "both" }} />
      </div>
    );
  }
}