import React from "react";

import TextFileUploadButton from "./TextFileUploadButton";

import UploadIcon from "@material-ui/icons/FileUpload";
import InsertDriveFileIcon from "@material-ui/icons/InsertDriveFile";
import Avatar from '@material-ui/core/Avatar';
import Chip from '@material-ui/core/Chip';
import Select from '@material-ui/core/Select';
import { withStyles } from '@material-ui/core/styles';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Button from '@material-ui/core/Button';


export default class MultipleTextFileUploadArea extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      files: [], // { name, data }
      open: false,
    }
  }

  handleUpload = (file) => {
    file.weight = 5;
    this.setState((prev) => ({
      files: prev.files.concat(file),
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

  handleChange = event => {
    let files = this.state.files;
    files[event.target.name].weight = event.target.value;
    this.setState({ files: files });
  };

  handleClose = () => {
    this.setState({ open: false });
  };

  handleOpen = () => {
    this.setState({ open: true });
  };

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
            <div key={i}>
              <Chip
                key={i}
                avatar={<Avatar><InsertDriveFileIcon /></Avatar>}
                label={file.name}
                style={{ margin: 5 }}
                onDelete={() => this.handleDelete(i)}
              />
              peso
              <Select
                key={1000*(i+1)}
                open={this.state.open[i]}
                onClose={this.handleClose}
                onOpen={this.handleOpen}
                value={this.state.files[i].weight}
                onChange={this.handleChange}
                inputProps={{
                  name: i.toString(),
                  id: 'demo-controlled-open-select',
                }}
                style={{ marginLeft: 8 }}
              >
                <MenuItem value={1}>1</MenuItem>
                <MenuItem value={2}>2</MenuItem>
                <MenuItem value={3}>3</MenuItem>
                <MenuItem value={4}>4</MenuItem>
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={6}>6</MenuItem>
                <MenuItem value={7}>7</MenuItem>
                <MenuItem value={8}>8</MenuItem>
                <MenuItem value={9}>9</MenuItem>
                <MenuItem value={10}>10</MenuItem>
              </Select>
            </div>
          ))}
        </div>
        <div style={{ clear: "both" }} />
      </div>
    );
  }
}
