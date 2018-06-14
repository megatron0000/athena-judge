import React from 'react';
import PropTypes from 'prop-types';
import TextField from '@material-ui/core/TextField';

const styles = theme => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    width: 200,
  },
});

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
