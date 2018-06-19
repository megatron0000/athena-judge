import React from 'react';
import TextField from '@material-ui/core/TextField';

export default class DateTimePicker extends React.Component {

  render() {
    return (
        <TextField
          id="datetime-local"
          label="Data de Entrega"
          type="datetime-local"
          defaultValue= { this.props.defaultValue }
          InputLabelProps={{
            shrink: true,
          }}
          onChange={this.props.onChange}
        />
    );
  }
}
