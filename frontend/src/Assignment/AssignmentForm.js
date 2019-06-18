import React from "react";
import ReactDOM from "react-dom";
import MUIDataTable from "mui-datatables";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import Cities from "./cities";

import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import SendIcon from "@material-ui/icons/Send";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import Typography from "@material-ui/core/Typography";

import DateTimePicker from "./DateTimePicker";
import MultipleTextFileUploadArea from "../Components/MultipleTextFileUploadArea";
import ConfirmDialog from "../Components/ConfirmDialog";

import Api from "../Api";

/*
@vb: We are disabling file attachment per now. Only plain text uploads are allowed,
and they are stored in the database.
*/

export default class AssignmentForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      id: this.props.assignmentId,
      courseId: this.props.courseId,
      title: this.props.title,
      description: this.props.description,
      dueDate: this.props.dueDate,
      publicTests: [],
      privateTests: [],
      dialogCreateAssignmentOpen: false,
    }
  }

  componentDidMount() {
    this.getTestsMetadata()
  }

  getTestsMetadata() {
    Api.get('/assignments/test-files-metadata/' + this.state.courseId + '/' + this.state.id)
      .then(res => res.data)
      .then(JSON.parse)
      .then(console.log)
  }

  handleTitleChange = (e) => {
    this.setState({ title: e.target.value });
  }

  handleDescriptionChange = (e) => {
    this.setState({ description: e.target.value });
  }

  handleDueDateChange = (e) => {
    this.setState({ dueDate: e.target.value });
  }

  handlePublicTestsChange = (files) => {
    var newFiles = [];
    for (var i = 0; i < files.length; i++) {
      var newFile = {input: files[i].name, output: files[i].name, isPrivate: false, weight: files[i].weight};
      newFiles[i] = newFile;
      console.log('oi');
      console.log(newFile);
    }
    console.log(newFiles);
    console.log(files);
    this.setState({ publicTests: files });
    // filesObject = {input: files.name, output: files.name, isPrivate: false, weight: files.weight};
  }

  handlePrivateTestsChange = (files) => {
    this.setState({ privateTests: files });
  }

  handleOpenDialogCreateAssign = () => {
    this.setState({ dialogCreateAssignmentOpen: true });
  };

  handleCloseDialogCreateAssignment = () => {
    this.setState({ dialogCreateAssignmentOpen: false });
  };

  render() {

    const columns = [
      {
        name: "Name",
        options: {
          filter: false
        }
      },
      {
        name: "Title",
        options: {
          filter: true
        }
      },
      {
        name: "Location",
        options: {
          filter: true,
          customBodyRender: (value, tableMeta, updateValue) => {
            return (
              <Cities
                value={value}
                index={tableMeta.columnIndex}
                change={event => updateValue(event)}
              />
            );
          }
        }
      },
      {
        name: "Age",
        options: {
          filter: false
        }
      },
      {
        name: "Salary",
        options: {
          filter: true,
          customBodyRender: (value, tableMeta, updateValue) => {
            const nf = new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            });

            return nf.format(value);
          }
        }
      },
      {
        name: "Active",
        options: {
          filter: true,
          customBodyRender: (value, tableMeta, updateValue) => {
            return (
              <FormControlLabel
                label={value ? "Yes" : "No"}
                value={value ? "Yes" : "No"}
                control={
                  <Switch
                    color="primary"
                    checked={value}
                    value={value ? "Yes" : "No"}
                  />
                }
                onChange={event => {
                  updateValue(event.target.value === "Yes" ? false : true);
                }}
              />
            );
          }
        }
      }
    ];

    const data = [
      ["Robin Duncan", "Business Analyst", "Los Angeles", 20, 77000, false],
      ["Mel Brooks", "Business Consultant", "Oklahoma City", 37, 135000, true],
      ["Harper White", "Attorney", "Pittsburgh", 52, 420000, false],
      ["Kris Humphrey", "Agency Legal Counsel", "Laredo", 30, 150000, true],
      ["Frankie Long", "Industrial Analyst", "Austin", 31, 170000, false],
      ["Brynn Robbins", "Business Analyst", "Norfolk", 22, 90000, true],
      ["Justice Mann", "Business Consultant", "Chicago", 24, 133000, false],
      [
        "Addison Navarro",
        "Business Management Analyst",
        "New York",
        50,
        295000,
        true
      ],
      ["Jesse Welch", "Agency Legal Counsel", "Seattle", 28, 200000, false],
      ["Eli Mejia", "Commercial Specialist", "Long Beach", 65, 400000, true],
      ["Gene Leblanc", "Industrial Analyst", "Hartford", 34, 110000, false],
      ["Danny Leon", "Computer Scientist", "Newark", 60, 220000, true],
      ["Lane Lee", "Corporate Counselor", "Cincinnati", 52, 180000, false],
      ["Jesse Hall", "Business Analyst", "Baltimore", 44, 99000, true],
      ["Danni Hudson", "Agency Legal Counsel", "Tampa", 37, 90000, false],
      ["Terry Macdonald", "Commercial Specialist", "Miami", 39, 140000, true],
      ["Justice Mccarthy", "Attorney", "Tucson", 26, 330000, false],
      ["Silver Carey", "Computer Scientist", "Memphis", 47, 250000, true],
      ["Franky Miles", "Industrial Analyst", "Buffalo", 49, 190000, false],
      ["Glen Nixon", "Corporate Counselor", "Arlington", 44, 80000, true],
      [
        "Gabby Strickland",
        "Business Process Consultant",
        "Scottsdale",
        26,
        45000,
        false
      ],
      ["Mason Ray", "Computer Scientist", "San Francisco", 39, 142000, true]
    ];

    const options = {
      filter: true,
      filterType: "dropdown",
      responsive: "scroll"
    };

    return (
      <div style={{ padding: 20 }}>
        <TextField
          label="Título"
          defaultValue={this.state.title}
          autoFocus
          style={{ width: "100%" }}
          onChange={this.handleTitleChange}
        />
        <div style={{ height: 20 }}></div>
        <TextField
          label="Descrição"
          defaultValue={this.state.description}
          multiline
          rows={10}
          style={{ width: "100%" }}
          onChange={this.handleDescriptionChange}
        />
        <div style={{ height: 20 }}></div>
        <DateTimePicker
          defaultValue={this.state.dueDate}
          onChange={this.handleDueDateChange}
        />

        <div style={{ height: 20 }}></div>
        <Typography variant="button">
          ATENÇÃO:
        </Typography>
        <Typography variant="caption">
          Existe um padrão para os pares de entradas e saídas!
          Para enviar pares de entrada e saída, nomeie os arquivos
          de testes com a padronização de nomes da seguinte maneira:
          input_fileName.txt para arquivos de entrada e
          output_fileName.txt para arquivos de saída.
          Note também que os arquivos devem ser .txt
        </Typography>

        <div style={{ height: 10 }}></div>
        <Typography variant="caption">
          Testes públicos
        </Typography>
        <MultipleTextFileUploadArea
          onChange={this.handlePublicTestsChange}
          style={{ paddingTop: 10 }}
        />

        <div style={{ height: 20 }}></div>
        <Typography variant="caption">
          Testes privados
        </Typography>
        <MultipleTextFileUploadArea
          onChange={this.handlePrivateTestsChange}
          style={{ paddingTop: 10 }}
        />

        <div style={{ textAlign: "center", marginTop: 10 }}>
          <Button
            variant="raised"
            style={{ marginRight: 10 }}
            onClick={this.props.onBack}
          >
            <ArrowBackIcon style={{ marginRight: 14 }} />
            Voltar
          </Button>

          <Button
            variant="raised"
            color="primary"
            onClick={() => { this.handleOpenDialogCreateAssign() }}
          >
            <SendIcon style={{ marginRight: 14 }} />
            {(this.props.assignmentId == null) ? "Criar Atividade" : "Editar Atividade"}
          </Button>

          <ConfirmDialog
            open={this.state.dialogCreateAssignmentOpen}
            text={`Tem certeza que deseja ${(this.props.assignmentId == null) ? "criar" : "editar"} esta atividade?`}
            onConfirm={() => this.props.onSubmit(this.state)}
            onClose={this.handleCloseDialogCreateAssignment}
          />
        </div>

        <MUIDataTable
          title={"ACME Employee list"}
          data={data}
          columns={columns}
          options={options}
        />

      </div>
    );
  }
}
