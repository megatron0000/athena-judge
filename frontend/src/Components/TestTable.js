import MaterialTable from "material-table";
import React from "react";
import { forwardRef } from 'react';

import AddBox from '@material-ui/icons/AddBox';
import ArrowUpward from '@material-ui/icons/ArrowUpward';
import Check from '@material-ui/icons/Check';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import ChevronRight from '@material-ui/icons/ChevronRight';
import Clear from '@material-ui/icons/Clear';
import Delete from '@material-ui/icons/Delete';
import Edit from '@material-ui/icons/Edit';
import FilterList from '@material-ui/icons/FilterList';
import FirstPage from '@material-ui/icons/FirstPage';
import LastPage from '@material-ui/icons/LastPage';
import Remove from '@material-ui/icons/Remove';
import Save from '@material-ui/icons/Save';
import Search from '@material-ui/icons/Search';
import ViewColumn from '@material-ui/icons/ViewColumn';
import UploadIcon from "@material-ui/icons/FileUpload";
import TextFileUploadButton from "./TextFileUploadButton";
import CodeView from "./CodeView";
import { Typography } from "@material-ui/core";

const tableIcons = {
  Add: forwardRef((props, ref) => <AddBox {...props} ref={ref} />),
  Check: forwardRef((props, ref) => <Check {...props} ref={ref} />),
  Clear: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
  Delete: forwardRef((props, ref) => <Delete {...props} ref={ref} />),
  DetailPanel: forwardRef((props, ref) => <ChevronRight {...props} ref={ref} />),
  Edit: forwardRef((props, ref) => <Edit {...props} ref={ref} />),
  Export: forwardRef((props, ref) => <Save {...props} ref={ref} />),
  Filter: forwardRef((props, ref) => <FilterList {...props} ref={ref} />),
  FirstPage: forwardRef((props, ref) => <FirstPage {...props} ref={ref} />),
  LastPage: forwardRef((props, ref) => <LastPage {...props} ref={ref} />),
  NextPage: forwardRef((props, ref) => <ChevronRight {...props} ref={ref} />),
  PreviousPage: forwardRef((props, ref) => <ChevronLeft {...props} ref={ref} />),
  ResetSearch: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
  Search: forwardRef((props, ref) => <Search {...props} ref={ref} />),
  SortArrow: forwardRef((props, ref) => <ArrowUpward {...props} ref={ref} />),
  ThirdStateCheck: forwardRef((props, ref) => <Remove {...props} ref={ref} />),
  ViewColumn: forwardRef((props, ref) => <ViewColumn {...props} ref={ref} />)
};

const validators = {
  weight(value) {
    const parsed = parseInt(value, 10)
    if (isNaN(parsed) || parsed < 0) {
      return 0
    }
    return parsed
  },

  input_output(value) {
    if (!value) {
      return ''
    }
    return value
  }
}

function topicalize(text) {
  let hadToCrop = false
  hadToCrop = hadToCrop || (text.split('\n').length > 5)
  const max5Lines = text.split('\n').slice(0, 5).join('\n')
  hadToCrop = hadToCrop || (max5Lines.length > 40)
  const max40Chars = max5Lines.length > 40 ? max5Lines.slice(0, 40) : max5Lines
  const topicalizedText = hadToCrop ? (max40Chars + '...') : max40Chars
  return <div>
    {topicalizedText.split('\n').map((line, index) => <p key={index} style={{ margin: 0 }}>{line}</p>)}
  </div>
}

export default class TestTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      columns: [
        {
          title: 'Entrada', field: 'input',
          render: rowData => topicalize(rowData.input),
          editComponent: props => (
            <TextFileUploadButton
              accept=".txt"
              multiple={false}
              onUpload={name_data => props.onChange(name_data.data)}
              style={{ float: "left", marginRight: 8 }}
            >
              <UploadIcon />
            </TextFileUploadButton>
          )
        },
        {
          title: 'Saida', field: 'output',
          render: rowData => topicalize(rowData.output),
          editComponent: props => (
            <TextFileUploadButton
              accept=".txt"
              multiple={false}
              onUpload={name_data => props.onChange(name_data.data)}
              style={{ float: "left", marginRight: 8 }}
            >
              <UploadIcon />
            </TextFileUploadButton>
          )
        },
        { title: 'Privado', field: 'isPrivate', type: 'boolean' },
        { title: 'Peso', field: 'weight', type: 'numeric' }
      ]
    }
  }

  render() {
    return (
      <div
        style={this.props.style}
      >
        <MaterialTable
          icons={tableIcons}
          title="Arquivos de teste"
          columns={this.state.columns}
          data={this.props.data}
          editable={{
            onRowAdd: newData =>
              new Promise((resolve, reject) => {
                setTimeout(() => {
                  {
                    newData.weight = validators.weight(newData.weight)
                    newData.input = validators.input_output(newData.input)
                    newData.output = validators.input_output(newData.output)
                    const data = this.props.data;
                    data.push(newData);
                    this.setState({ data }, () => resolve());
                  }
                  resolve()
                }, 1000)
              }),
            onRowUpdate: (newData, oldData) =>
              new Promise((resolve, reject) => {
                setTimeout(() => {
                  {
                    newData.weight = validators.weight(newData.weight)
                    newData.input = validators.input_output(newData.input)
                    newData.output = validators.input_output(newData.output)
                    const data = this.props.data;
                    const index = data.indexOf(oldData);
                    data[index] = newData;
                    this.setState({ data }, () => resolve());
                  }
                  resolve()
                }, 1000)
              }),
            onRowDelete: oldData =>
              new Promise((resolve, reject) => {
                setTimeout(() => {
                  {
                    let data = this.props.data;
                    const index = data.indexOf(oldData);
                    data.splice(index, 1);
                    this.setState({ data }, () => resolve());
                  }
                  resolve()
                }, 1000)
              }),
          }}
          detailPanel={rowData => (
            <div>
              <Typography variant="caption" style={{ padding: 10 }}>Entrada:</Typography>
              <CodeView>{rowData.input}</CodeView>
              <Typography variant="caption" style={{ padding: 10 }}>Saida:</Typography>
              <CodeView>{rowData.output}</CodeView>
            </div>
          )}
          localization={{
            body: {
              emptyDataSourceMessage: 'Sem resultados a mostrar',
              addTooltip: 'Adicionar',
              deleteTooltip: 'Deletar',
              editTooltip: 'Editar',
              filterRow: {
                filterTooltip: 'Filtrar'
              },
              editRow: {
                deleteText: 'Deletar esta linha ?',
                cancelTooltip: 'Cancelar',
                saveTooltip: 'Salvar'
              }
            },
            grouping: {
              placeholder: 'Arraste os cabeçalhos ...'
            },
            header: {
              actions: 'Açoes'
            },
            pagination: {
              labelDisplayedRows: '{from}-{to} de {count}',
              labelRowsSelect: 'linhas',
              labelRowsPerPage: 'Linhas por pagina: ',
              firstTooltip: 'Primeira pagina',
              previousTooltip: 'Pagina anterior',
              nextTooltip: 'Proxima pagina',
              lastTooltip: 'Ultima pagina'
            },
            toolbar: {
              addRemoveColumns: 'Adicione ou remova colunas',
              nRowsSelected: '{0} linha(s) selecionada(s)',
              showColumnsTitle: 'Mostrar colunas',
              exportTitle: 'Exportar',
              exportName: 'Exportar como CSV',
              searchTooltip: 'Procurar'
            }
          }}
        />
      </div>
    )
  }
}