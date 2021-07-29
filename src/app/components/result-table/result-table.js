/* @flow */

import React, { Component } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  Flex,
  Text,
  Input,
  Button,
  Box,
} from '@chakra-ui/core';
import { withTranslation } from 'react-i18next';

import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine.css';
import './table.css';

import { CommonRenderer } from "./common-renderer";
import { ArrayDataRenderer } from "./arraydata-renderer";

class ResultTableWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = {
      curPageIndex: props.initPageIndex ? props.initPageIndex : 0,
      editPageNum: ""
    };

    this.frameworkComponents = {
      commonRenderer: CommonRenderer,
      arrayDataRenderer: ArrayDataRenderer,
    };

    this.defaultColDef = {
      autoHeight: true,
    };

    this.rowClassRules = {
      'conflict-warning': (params) => {
          return params.data.is_conflict;
      },
    };
    this.buildUI(props);
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

  shouldComponentUpdate(nextProps, nextState) {
    const { props, state } = this;
    //console.log("shouldComponentUpdate, initPageIndex: "+props.initPageIndex+"->"+nextProps.initPageIndex);
    if (nextProps.headers !== props.headers || nextProps.defaultColWidth !== props.defaultColWidth
    || nextProps.colLineHeight !== props.colLineHeight || nextProps.data !== props.data
    || nextProps.initPageIndex !== props.initPageIndex) {
      if (nextProps.initPageIndex !== props.initPageIndex) {
        this.needCorrectPageIndex = true;
      }
      this.buildUI(nextProps);
      console.log("shouldComponentUpdate:true");
      return true;
    }
    if (nextState.curPageIndex !== state.curPageIndex) {
      console.log("shouldComponentUpdate:true");
      return true;
    }
    console.log("shouldComponentUpdate:false");
    return false;
  }

  componentDidUpdate() {
    console.log("componentDidUpdate, state.curPageIndex: "+this.state.curPageIndex+", props.initPageIndex: "+this.props.initPageIndex+", need correct: "+this.needCorrectPageIndex);
    if (this.needCorrectPageIndex) {
      this.setState({
        curPageIndex: this.props.initPageIndex
      });
      this.needCorrectPageIndex = false;
    }
  }

  componentWillUnmount() {
    console.log("componentWillUnmount");
    this.clearEditTimer();
  }

  buildUI = (props) => {
    console.log("resultTable buildUI");
    this.buildColDef(props);
    this.buildData(props);
  }

  buildColDef = (props) => {
    const { headers, defaultColWidth, colLineHeight } = props;
    this.columnDefs = this.buildColDefArray(headers, defaultColWidth, colLineHeight);
  }

  buildColDefArray = (headers, defaultColWidth, colLineHeight) => {
    let columnDefs = [];
    for (let i=0; i < headers.length; i++) {
      columnDefs[i] = {
        index: i,
        headerName: headers[i].name,
        field: headers[i].field,
        width: headers[i].width == null ? defaultColWidth : headers[i].width,
        lineHeight: colLineHeight,
        cellRenderer: i === 0 ? "arrayDataRenderer" : "commonRenderer",
      };
      if (headers[i].children && headers[i].children.length > 0) {
        columnDefs[i]["children"] = this.buildColDefArray(headers[i].children, defaultColWidth/2, colLineHeight);
      }
      if (headers[i].renderer && headers[i].renderer !== null) {
        if (headers[i].renderer === "course_teacher_renderer") {
          columnDefs[i]["cellRenderer"] = (params) => {
            // console.log("CourseTeacherRenderer: "+JSON.stringify(params, this.getCircularReplacer()));
            if (!params.value) {
              return null;
            }
            let cname = params.value.course;
            if (params.value.cid <= 0){
              cname = `<font color="white" style="background-color:#FF0000;">${cname}</font>`;
            }
            let tname = params.value.teacher;
            if (params.value.tid <= 0){
              tname = `<font color="white" style="background-color:#FF0000;">${tname}</font>`;
            }
            let output = `<b>${cname}</b><br>${tname}`
            return output;
          };
        }
      }
    }
    columnDefs[0]["pinned"] = "left";
    return columnDefs;
  }

  buildData = (props) => {
    const { data } = props;
    this.rowData = [];
    for (let i=0; i < data.length; i++) {
      this.rowData[i] = data[i];
    }
    console.log("buildData: "+JSON.stringify(data));
  }

  onGridSizeChanged = (event) => {
    console.log("onGridSizeChanged");
    event.api.resetRowHeights();
  }

  onCellClicked = (event) => {
    const { onCellClicked: onCellClickedCallback } = this.props;
    //console.log("onCellClicked, row: "+event.rowIndex+" col: "+event.colDef.index+" field: "+event.colDef.field+" value: "+event.value);
    let e = {
      row: event.rowIndex,
      col: event.colDef.index,
      field: event.colDef.field,
      value: event.value,
    }
    if (onCellClickedCallback != null) {
      onCellClickedCallback(e);
    }
  }

  onRowClicked = (event) => {
    const { onRowClicked: onRowClickedCallback } = this.props;
    if (onRowClickedCallback != null) {
      onRowClickedCallback(event.rowIndex);
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

  clearEditTimer = () => {
    if (this.editTimer) {
      clearTimeout(this.editTimer);
      this.editTimer = null;
    }
  }

  notifyPageIndexChanged = (index) => {
    const { onResultPageIndexChanged } = this.props;
    if (onResultPageIndexChanged) {
      onResultPageIndexChanged(index);
    }
  }

  render() {
    const { frameworkComponents, columnDefs, defaultColDef, rowClassRules, rowData, onGridSizeChanged, onCellClicked, onRowClicked, onPagePrevClicked, onPageNextClicked, onEditPageNum } = this;
    const { t, width, title, titleHeight, colLineHeight, defaultColWidth, color, headers, data,
      pageNames, pagePrevCaption, pageNextCaption, initPageIndex, pageInputCaption,
      onCellClicked: onCellClickedCallback, onRowClicked: onRowClickedCallback, onResultPageIndexChanged,
      ...other_props } = this.props;
    const { curPageIndex } = this.state;
    //console.log("render: curPageIndex: "+curPageIndex);
    return (
      <Flex direction="column" width={width ? width : "100%"} {...other_props} >
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
        <Box width="100%" height="100%" borderWidth={1} borderColor={color+".200"} roundedBottom="md">
          <div className="ag-theme-alpine" style={{width: "100%", height: "100%"}}>
            <AgGridReact
              onGridSizeChanged={onGridSizeChanged}
              defaultColDef={defaultColDef}
              frameworkComponents={frameworkComponents}
              columnDefs={columnDefs}
              rowData={rowData}
              rowClassRules={rowClassRules}
              onCellClicked={onCellClicked}
              onRowClicked={onRowClicked} >
            </AgGridReact>
          </div>
        </Box>
      </Flex>
    );
  }
}

const ResultTable = withTranslation("translation")(ResultTableWrapper);
export { ResultTable };
