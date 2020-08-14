import React, { Component } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  Flex,
} from '@chakra-ui/core';

import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine.css';
import './table.css';

import { CommonRenderer } from "./common-renderer";

class EditableTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      columnDefs: [],
      rowData: []
    };

    this.defaultColDef = {
      autoHeight: true,
    }
    this.frameworkComponents = {
      commonRenderer: CommonRenderer,
    }
  }

  componentDidMount() {
    this.initUI();
  }

  initUI = () => {
    const columns = this.initColDef();
    const rows = this.initData();
    this.setState({
      columnDefs: columns,
      rowData: rows
    });
  }

  initColDef = () => {
    const { headers, defaultColWidth, colLineHeight } = this.props;
    const columnDefs = [];
    for (let i=0; i < headers.length; i++) {
      columnDefs[i] = {
        index: i,
        headerName: headers[i].name,
        field: headers[i].field,
        width: headers[i].width == null ? defaultColWidth : headers[i].width,
        lineHeight: colLineHeight,
        cellRenderer: "commonRenderer",
        editable: headers[i].editable,
      };
    }
    return columnDefs;
  }

  initData = () => {
    const { data } = this.props;
    const rowData = [];
    for (let i=0; i < data.length; i++) {
      rowData[i] = data[i];
    }
    return rowData;
  }

  render() {
    const { defaultColDef, frameworkComponents } = this;
    const { width, defaultColWidth, headers, data,
      onCellClicked: onCellClickedCallback, ...other_props } = this.props;
    const { columnDefs, rowData } = this.state;
    return (
      <Flex direction="column" width={width ? width : "100%"} {...other_props} >
        <div className="ag-theme-alpine" style={{width: "100%", height: "100%"}}>
          <AgGridReact
            defaultColDef={defaultColDef}
            frameworkComponents={frameworkComponents}
            columnDefs={columnDefs}
            rowData={rowData} >
          </AgGridReact>
        </div>
      </Flex>
    )
  }
}

export { EditableTable };
