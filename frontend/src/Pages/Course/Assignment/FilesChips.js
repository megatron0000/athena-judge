import React from 'react';
import Chip from "material-ui/Chip";
import Switch from "material-ui/Switch";
import TextField from "material-ui/TextField";
import Tooltip from "material-ui/Tooltip";

export default class FilesChips extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      files: props.files
    };
  }


  render() {
    return (
      <div>
        {this.state.files && this.state.files.map((file) => {
          let name = file.name.substr(2);
          let type = file.name[0];
          if (type === 'e')
          return(
            <div key = {this.state.files.indexOf(file)}>
          <Tooltip title="Teste Público?">
          <Switch value="checkedC" color="primary"/>
          </Tooltip>
          <TextField
          id="number"
          label="Peso"
          type="number"
          InputLabelProps={{
            shrink: true,
          }}
          margin="normal"
          style = {{maxWidth: 35, margin: 10}}
        />
          <Chip
            
            onDelete = {null}
            label = {name}
            style = {{margin: 5}}
          />
          </div>);
        })}
      </div>
    )
  }
}