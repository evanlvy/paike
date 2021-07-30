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
    this.buildColDef(props);
    this.buildData(props);
  }

  shouldComponentUpdate(nextProps) {
    const { props } = this;
    // console.log("shouldComponentUpdate, orig props "+JSON.stringify(props));
    if (nextProps.headers !== props.headers || nextProps.defaultColWidth !== props.defaultColWidth
    || nextProps.colLineHeight !== props.colLineHeight) {
      this.buildColDef(nextProps);
      return true;
    }
    if (nextProps.data !== props.data) {
      this.buildData(nextProps);
      return false;
    }
    return false;
  }

  getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return;
        }
        seen.add(value);
      }
      return value;
    };
  };

  courseTeacherGetter = (params) => {
    //console.log("courseTeacherGetter: params:"+params.value+" column:"+JSON.stringify(params.colDef, this.getCircularReplacer()));
    let value = params.data[params.colDef.field];
    //console.log("courseTeacherGetter: value:"+JSON.stringify(value));
    if (!value) {
      return "自习";
    }
    let cname = value.course;
    if (value.cid <= 0){
      cname = cname+ (value.cid < 0?"\u274C":"\u2753");
    }
    let tname = value.teacher;
    if (value.tid <= 0){
      tname = tname+(value.tid < 0?"\u274C":"\u2753");
    }
    let output = cname + " " + tname;
    //console.log("courseTeacherGetter: "+output);
    return output;
  };

  courseTeacherSetter = (params) => {
    let dest_col = params.colDef.field;
    if (!params.newValue || params.newValue.length < 1) {
      delete params.data[dest_col];
      return true;
    }
    let old_string = "";
    if (params.oldValue && params.oldValue.length > 0) {
      old_string = params.oldValue.replace("\u274C", "").replace("\u2753", "").replace(/\s+/g, "");
    }
    let input_string = params.newValue.replace("\u274C", "").replace("\u2753", "");
    if (old_string.length > 1) {
      // Compare string after trim
      let new_trimmed = input_string.replace(/\s+/g, "");
      if (old_string === new_trimmed) {
        return false;
      }
    }
    let output = {course: "", cid: 0, teacher: "", tid: 0};
    let item_splited = input_string.split(' ');
    if (item_splited.length >= 1) {
      output.course = item_splited[0];
    }
    if (item_splited.length === 2) {
      output.teacher = item_splited[1];
    }
    if (item_splited.length > 2) {
      output.teacher = input_string.replace(output.course, "");
    }
    //console.log("courseTeacherSetter: "+JSON.stringify(output));
    params.data[dest_col] = output;
    return true;
  };

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
      if (headers[i].renderer && headers[i].renderer !== null) {
        if (headers[i].renderer === "course_teacher_renderer") {
          columnDefs[i]["valueGetter"] = this.courseTeacherGetter;
          columnDefs[i]["valueSetter"] = this.courseTeacherSetter;
        }
      }
    }
    this.columnDefs = columnDefs;
  }

  buildData = (props) => {
    const { data } = props;
    const rowData = [];
    for (let i=0; i < data.length; i++) {
      rowData[i] = data[i];
    }
    this.rowData = rowData;
    //console.log("EditTable BuildData: "+JSON.stringify(rowData));
    if (this.gridApi) {
      this.gridApi.setRowData(rowData);
    }
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
      onCellClicked: onCellClickedCallback,onCellValueChanged, ...other_props } = this.props;
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
            onCellValueChanged={onCellValueChanged}
            onCellClicked={onCellClicked} >
          </AgGridReact>
        </div>
      </Flex>
    )
  }
}

export { EditableTable };
