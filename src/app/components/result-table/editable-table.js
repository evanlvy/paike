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
    this.defaultColDef = {
      autoHeight: true,
    }
    this.frameworkComponents = {
      commonRenderer: CommonRenderer,
    }
    this.buildUI(props);
  }

  shouldComponentUpdate(nextProps) {
    const { props } = this;
    // console.log("shouldComponentUpdate, orig props "+JSON.stringify(props));
    if (nextProps.headers !== props.headers || nextProps.data !== props.data) {
      this.buildUI(nextProps);
      return true;
    }
    if (nextProps.defaultColWidth !== props.defaultColWidth
    || nextProps.colLineHeight !== props.colLineHeight) {
      return true;
    }
    return false;
  }

  buildUI = (props) => {
    const columns = this.buildColDef(props);
    const rows = this.buildData(props);
    this.columnDefs = columns;
    this.rowData = rows;
    if (this.gridApi) {
      this.gridApi.refreshCells();
    }
  }

  buildColDef = (props) => {
    const { headers, defaultColWidth, colLineHeight, cellClassRules } = props;
    const columnDefs = [];
    for (let i=0; i < headers.length; i++) {
      columnDefs[i] = {
        index: i,
        headerName: headers[i].name,
        field: headers[i].field,
        width: headers[i].width == null ? defaultColWidth : headers[i].width,
        lineHeight: colLineHeight,
        cellClassRules: cellClassRules,
        cellRenderer: "commonRenderer",
        editable: headers[i].editable,
      };
    }
    return columnDefs;
  }

  buildData = (props) => {
    const { data } = props;
    const rowData = [];
    for (let i=0; i < data.length; i++) {
      rowData[i] = data[i];
    }
    return rowData;
  }

  onCellClicked = (event) => {
    const { onCellClicked: onCellClickedCallback } = this.props;
    //console.log("onCellClicked, row: "+event.rowIndex+" col: "+event.colDef.index+" field: "+event.colDef.field+" value: "+event.value);
    let e = {
      row: event.rowIndex,
      col: event.colDef.index,
      field: event.colDef.field,
      value: event.value,
      event: event,
    }
    if (onCellClickedCallback != null) {
      onCellClickedCallback(e);
    }
  }

  onGridReady = (params) => {
    this.gridApi = params.api;
  };

  render() {
    const { columnDefs, rowData, defaultColDef, frameworkComponents, onGridReady, onCellClicked } = this;
    const { width, defaultColWidth, cellClassRules, headers, data,
      onCellClicked: onCellClickedCallback, ...other_props } = this.props;
    //console.log("RowData: "+JSON.stringify(rowData));
    return (
      <Flex direction="column" width={width ? width : "100%"} {...other_props} >
        <div className="ag-theme-alpine" style={{width: "100%", height: "100%"}}>
          <AgGridReact
            defaultColDef={defaultColDef}
            frameworkComponents={frameworkComponents}
            columnDefs={columnDefs}
            rowData={rowData}
            onGridReady={onGridReady}
            onCellClicked={onCellClicked} >
          </AgGridReact>
        </div>
      </Flex>
    )
  }
}

export { EditableTable };
