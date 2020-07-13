/* @flow */

import React, { Component } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  Flex,
  Box,
} from '@chakra-ui/core';

import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine.css';

class ResultTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      columnDefs: [{
        headerName: "Make", field: "make", width: 400
      }, {
        headerName: "Model", field: "model", width: 400
      }, {
        headerName: "Price", field: "price", width: 400
      }],
      rowData: [{
        make: "Toyota", model: "Celica", price: 35000
      }, {
        make: "Ford", model: "Mondeo", price: 32000
      }, {
        make: "Porsche", model: "Boxter", price: 72000
      }]
    }
  }

  render() {
    const { width, title, titleHeight, color, ...other_props } = this.props;
    const { columnDefs, rowData } = this.state;
    return (
      <Flex direction="column" width={width ? width : "100%"} {...other_props} >
        <Box display="flex" bg={color+".400"} height={titleHeight} px={4} alignItems="center"
          borderWidth={1} borderColor={color+".200"} roundedTop="md">{title}</Box>
        <Box width="100%" height="100%" borderWidth={1} borderColor={color+".200"} roundedBottom="md">
        <div className="ag-theme-alpine" style={{width: "100%", height: "100%"}}>
          <AgGridReact
            columnDefs={columnDefs}
            rowData={rowData}>
          </AgGridReact>
        </div>
        </Box>
      </Flex>
    );
  }
}

export { ResultTable };
