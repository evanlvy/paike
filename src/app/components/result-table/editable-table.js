import React, { Component } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  Flex,
  Text,
  Input,
  Button,
  Box,
} from '@chakra-ui/core';

import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine.css';
import './table.css';

import { CommonRenderer } from "./common-renderer";

class EditableTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      curPageIndex: props.initPageIndex ? props.initPageIndex : 0,
      editPageNum: ""
    };
    this.defaultColDef = {
      autoHeight: true,
    }
    this.frameworkComponents = {
      commonRenderer: CommonRenderer,
    }
    this.buildColDef(props);
    this.buildData(props);
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { props, state } = this;
    // console.log("shouldComponentUpdate, orig props "+JSON.stringify(props));
    if (nextProps.headers !== props.headers || nextProps.defaultColWidth !== props.defaultColWidth
    || nextProps.colLineHeight !== props.colLineHeight) {
      this.buildColDef(nextProps);
      return true;
    }
    if (nextState.curPageIndex !== state.curPageIndex) {
      console.log("shouldComponentUpdate:true");
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

  //Cell Edit Ref https://www.ag-grid.com/javascript-grid/cell-editing/?
  courseTeacherGetter = (params) => {
    //console.log("courseTeacherGetter: params:"+params.value+" column:"+JSON.stringify(params.colDef, this.getCircularReplacer()));
    let value = params.data[params.colDef.field];
    //console.log("courseTeacherGetter: value:"+JSON.stringify(value));
    if (!value) {
      return "自习";
    }
    let cname = value.course;
    if (value.cid <= 0){
      cname = (value.cid < 0?"\u274C":"\u2753")+cname;
    }
    let tname = value.teacher;
    if (value.tid <= 0){
      tname = (value.tid < 0?"\u274C":"\u2753")+tname;
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

  classNamesGetter = (params) => {
    //console.log("courseTeacherGetter: params:"+params.value+" column:"+JSON.stringify(params.colDef, this.getCircularReplacer()));
    let value = params.data[params.colDef.field];
    //console.log("courseTeacherGetter: value:"+JSON.stringify(value));
    //Data sample: {12: '20全科1', 13:'20全科2'}
    if (!value) {
      return "";
    }
    let short_names = Object.values(value);
    return short_names.join(', ');
  };

  buildColDef = (props) => {
    const { headers, defaultColWidth, colLineHeight, cellClassRules } = props;
    const columnDefs = [];
    if (!headers || !Array.isArray(headers)) {
      return;
    }
    for (let i=0; i < headers.length; i++) {
      columnDefs[i] = {
        //colId: i,  // Do not set colId because field will not be used in startEditingCell or getColumn.
        headerName: headers[i].name,
        field: headers[i].field,
        width: headers[i].width ? headers[i].width : defaultColWidth,
        lineHeight: colLineHeight,
        cellClassRules: cellClassRules,
        cellRenderer: "commonRenderer",
        editable: headers[i].editable,
      };
      if (headers[i].renderer && headers[i].renderer !== null) {
        if (headers[i].renderer === "course_teacher_renderer") {
          columnDefs[i]["valueGetter"] = this.courseTeacherGetter;
          columnDefs[i]["valueSetter"] = this.courseTeacherSetter;
          delete columnDefs[i]["cellRenderer"];
        }
        else if (headers[i].renderer === "class_name_renderer") {
          columnDefs[i]["valueGetter"] = this.classNamesGetter;
        }
      }
    }
    this.columnDefs = columnDefs;
  }

  buildData = (props) => {
    const { data } = props;
    const rowData = [];
    if (!data || !Array.isArray(data)) {
      return;
    }
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

  onPagePrevClicked = () => {
    const { curPageIndex } = this.state;
    if (curPageIndex > 0) {
      const newIndex = curPageIndex-1;
      this.setState({
        curPageIndex: newIndex
      });
      this.notifyPageIndexChanged(newIndex);
    }
  }

  onPageNextClicked = () => {
    const { curPageIndex } = this.state;
    const { pageNames } = this.props;
    if (curPageIndex < pageNames.length-1) {
      const newIndex = curPageIndex+1;
      this.setState({
        curPageIndex: newIndex
      });
      this.notifyPageIndexChanged(newIndex);
    }
  }

  onEditPageNum = (event) => {
    this.clearEditTimer();

    const { pageNames } = this.props;
    const newIndex = parseInt(event.target.value);
    if (isNaN(newIndex) || newIndex < 1 || newIndex > pageNames.length) {
      return;
    }
    this.setState({
      curPageIndex: newIndex-1
    });
    this.editTimer = setTimeout(() => {
      this.notifyPageIndexChanged(newIndex-1);
    }, 1000);
  }

  notifyPageIndexChanged = (index) => {
    const { onResultPageIndexChanged } = this.props;
    if (onResultPageIndexChanged) {
      onResultPageIndexChanged(index);
    }
  }

  onGridReady = (params) => {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
  };

  exportCsv = () => {
    if (this.gridApi) {
      this.gridApi.exportDataAsCsv();
    }
  };

  editCell = (rowIndex, colKey) => {
    if (this.gridApi) {
      //this.gridApi.sizeColumnsToFit();
      this.gridApi.stopEditing(false);
      //console.log("EditCell: "+rowIndex+" type:"+(typeof rowIndex));
      this.gridApi.ensureColumnVisible(colKey);  // very important
      this.gridApi.setFocusedCell(rowIndex, colKey);
      this.gridApi.startEditingCell({
        rowIndex: rowIndex,
        colKey: colKey,
        // set to 'top', 'bottom' or undefined
        //rowPinned: 'top'  // Do not use
      });
    }
  };

  render() {
    const { columnDefs, rowData, defaultColDef, frameworkComponents, onGridReady, onCellClicked, 
      onPagePrevClicked, onPageNextClicked, onEditPageNum } = this;
    const { t, width, defaultColWidth, cellClassRules, headers, data,
      title, color, titleHeight, pageNames, pageInputCaption, pagePrevCaption, pageNextCaption, onResultPageIndexChanged,
      onCellClicked: onCellClickedCallback,onCellValueChanged, ...other_props } = this.props;
    const { curPageIndex } = this.state;
    //console.log("RowData: "+JSON.stringify(rowData));
    return (
      <Flex direction="column" width={width ? width : "100%"} {...other_props} >
        {
          (title || pageNames) &&
          <Box display="flex" flexDirection="row" bg={color+".400"} height={titleHeight} px={4} alignItems="center"
            borderWidth={1} borderColor={color+".200"} roundedTop="md">
            <Text width="100%">{title}</Text>
            {
              pageNames &&
              <Flex direction="row" alignItems="center">
                {
                  pageInputCaption &&
                  <Flex direction="row" alignItems="center">
                    <Text ml={2} whiteSpace="nowrap">{pageInputCaption[0]}</Text>
                    <Input width="3rem" px="4px" textAlign="center" mx={2} size="md" value={curPageIndex+1} onChange={onEditPageNum} />
                    <Text mr={2} whiteSpace="nowrap">{pageInputCaption[1]}</Text>
                  </Flex>
                }
                <Button mr={2} variantColor="gray" variant="solid" disabled={curPageIndex <= 0} onClick={onPagePrevClicked}>{pagePrevCaption ? pagePrevCaption : t("common.previous")}</Button>
                { !pageInputCaption && <Text whiteSpace="nowrap" mx={2}>{pageNames[curPageIndex].name}</Text> }
                <Button ml={2} variantColor="gray" variant="solid" disabled={curPageIndex >= pageNames.length-1} onClick={onPageNextClicked}>{pageNextCaption ? pageNextCaption : t("common.next")}</Button>
              </Flex>
            }
          </Box>
        }
        <Box flex={1} width="100%" height="1500px" borderWidth={1} borderColor={color+".200"} roundedBottom="md">
          <div className="ag-theme-alpine" style={{width: "100%", height: "100%"}}>
            <AgGridReact
              deltaRowMode={true}
              getRowNodeId={data=>data.id}
              defaultColDef={defaultColDef}
              frameworkComponents={frameworkComponents}
              columnDefs={columnDefs}
              rowData={rowData}
              onGridReady={onGridReady}
              onCellValueChanged={onCellValueChanged}
              onCellClicked={onCellClicked}
              rowSelection="single" >
            </AgGridReact>
          </div>
        </Box>
      </Flex>
    )
  }
}

export { EditableTable };
