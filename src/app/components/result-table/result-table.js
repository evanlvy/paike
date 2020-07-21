/* @flow */

import React, { Component } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  Flex,
  Box,
} from '@chakra-ui/core';

import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine.css';
import './result-table.css';

import { CommonRenderer } from "./common-renderer";

class ResultTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      frameworkComponents: {
        commonRenderer: CommonRenderer,
      },
      columnDefs: [],
      rowData: []
    }
    this.defaultColDef = {
      autoHeight: true,
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
        headerName: headers[i].name,
        field: headers[i].field,
        width: headers[i].width == null ? defaultColWidth : headers[i].width,
        lineHeight: colLineHeight,
        cellRenderer: "commonRenderer",
      };
    }
    columnDefs[0]["pinned"] = "left";
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

  onGridSizeChanged = (event) => {
    console.log("onGridSizeChanged");
    event.api.resetRowHeights();
  }

  render() {
    const { defaultColDef, onGridSizeChanged } = this;
    const { width, title, titleHeight, colLineHeight, defaultColWidth, color, headers, data, ...other_props } = this.props;
    const { frameworkComponents, columnDefs, rowData } = this.state;
    return (
      <Flex direction="column" width={width ? width : "100%"} {...other_props} >
        <Box display="flex" bg={color+".400"} height={titleHeight} px={4} alignItems="center"
          borderWidth={1} borderColor={color+".200"} roundedTop="md">{title}</Box>
        <Box width="100%" height="100%" borderWidth={1} borderColor={color+".200"} roundedBottom="md">
        <div className="ag-theme-alpine" style={{width: "100%", height: "100%"}}>
          <AgGridReact
            onGridSizeChanged={onGridSizeChanged}
            defaultColDef={defaultColDef}
            frameworkComponents={frameworkComponents}
            columnDefs={columnDefs}
            rowData={rowData} >
          </AgGridReact>
        </div>
        </Box>
      </Flex>
    );
  }
}

export { ResultTable };
