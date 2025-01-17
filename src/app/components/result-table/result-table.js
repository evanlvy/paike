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
import { ConflictsRenderer } from "./conflicts-renderer";
import { CellConverters } from './cell-converters';
import { DEFAULT_TABLE_ROW_HEIGHT } from "../../redux/modules/common/info"

class ResultTableWrapper extends Component {
  constructor(props) {
    super(props);
    const { t, onCellIndicatorClicked, initPageIndex, fixedColWidth, colLineHeight, maxHeight=9999, minHeight=0} = props;
    this.state = {
      curPageIndex: initPageIndex ? initPageIndex : 0,
      editPageNum: ""
    };
    if (onCellIndicatorClicked != null) {
      this.onCellIndicatorClicked = onCellIndicatorClicked;
    }
    this.frameworkComponents = {
      commonRenderer: CommonRenderer,
      arrayDataRenderer: ArrayDataRenderer,
      conflictsRenderer: ConflictsRenderer,
    };

    this.defaultColDef = {
      autoHeight: !colLineHeight,
      flex: 1,
      minWidth: 80,
      resizable: !fixedColWidth,
      wrapText: true,
    };

    /*this.rowClassRules = {
      'conflict-warning': (params) => {
          return params.data.is_conflict;
      },
    };*/
    this.onItemClicked = this.onItemClicked.bind(this);
    this.buildColDef(props);
    this.zixi = t("kebiao.zixi");
    this.gridApi = null;
    this.overlayNoRowsTemplate = '<span class="ag-overlay-loading-center">...空空如也...</span>';
    this.overlayLoadingTemplate = '<span class="ag-overlay-loading-center">...加载中...</span>';
    this.prevRowCount = 0;
    this.prevHeight = 0;
    let rh = colLineHeight;
    if (!colLineHeight) rh = DEFAULT_TABLE_ROW_HEIGHT;
    this.maxRowCount = Math.ceil(maxHeight/rh);
    this.minRowCount = Math.ceil(minHeight/rh);
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { props, state } = this;
    //console.log("shouldComponentUpdate, initPageIndex: "+props.initPageIndex+"->"+nextProps.initPageIndex);
    if (nextProps.headers !== props.headers || nextProps.defaultColWidth !== props.defaultColWidth
    || nextProps.colLineHeight !== props.colLineHeight || nextProps.data !== props.data
    || nextProps.initPageIndex !== props.initPageIndex) {
      if (nextProps.initPageIndex !== props.initPageIndex) {
        this.needCorrectPageIndex = true;
      }
      return true;
    }
    if (nextState.curPageIndex !== state.curPageIndex) {
      return true;
    }
    return false;
  }

  componentDidUpdate() {
    //console.log("componentDidUpdate, state.curPageIndex: "+this.state.curPageIndex+", props.initPageIndex: "+this.props.initPageIndex+", need correct: "+this.needCorrectPageIndex);
    if (this.needCorrectPageIndex) {
      this.setState({
        curPageIndex: this.props.initPageIndex
      });
      this.needCorrectPageIndex = false;
    }
  }

  componentWillUnmount() {
    this.clearEditTimer();
  }

  buildColDef = (props) => {
    const { headers, defaultColWidth, colLineHeight } = props;
    this.columnDefs = this.buildColDefArray(headers, defaultColWidth, colLineHeight);
  }

  buildColDefArray = (headers, defaultColWidth, colLineHeight) => {
    let columnDefs = [];
    for (let i=0; i < headers.length; i++) {
      let { name, width, maxW, minW, dataType, fn_disable, children, ...defs_generated} = headers[i];
      if (width) {
        defs_generated.width = width;
      } else if (minW) {
        defs_generated.minWidth = minW;
      } else if (maxW) {
        defs_generated.maxWidth = maxW;
      } else {
        defs_generated.width = defaultColWidth;
      }
      if (width && width>=200) {
        // Use Large text editor for super long text!
        defs_generated.cellEditor = 'agLargeTextCellEditor';
      }
      if (defs_generated.rowDrag !== true) {
        defs_generated.cellRenderer = i === 0 ? "arrayDataRenderer" : "commonRenderer";
        defs_generated.cellRendererParams = {
          lineHeight : colLineHeight, // pass the field value here
          fn_disable : fn_disable,
        };
      }
      defs_generated.headerName = name;
      if (children && children.length > 0) {
        defs_generated.children = this.buildColDefArray(children, defaultColWidth/2, colLineHeight);
      }
      if (dataType && dataType !== null) {
        switch(dataType) {
          case "classes_id_name_obj":
            defs_generated.valueGetter = CellConverters.classNamesGetter;
            break;
          case "slot_weekday_renderer":
            //columnDefs[i]["valueGetter"] = CellConverters.slotWeekdayGetter;
            defs_generated.cellRenderer = "conflictsRenderer";
            defs_generated.cellRendererParams = {
              onItemClicked: this.onItemClicked
            };
            break;
          case "course_teacher_combined":
            defs_generated.valueGetter = CellConverters.courseTeacherGetter;
            defs_generated.cellStyle = CellConverters.courseTeacherCellStyle;
            break;
          default:
            console.log(`Sorry, Unknown dataType: ${dataType}.`);
        }
      }
      columnDefs[i] = defs_generated;
    }
    columnDefs[0]["pinned"] = "left";
    return columnDefs;
  }

  onItemClicked(colKey, rowIndex) {
    //console.log('Conflict clicked: key:'+colKey+" idx:"+rowIndex);
    if (this.onCellIndicatorClicked) {
      this.onCellIndicatorClicked(rowIndex, colKey);
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

  onRowDoubleClicked = (event) => {
    const { onRowDoubleClicked: onRowDoubleClickedCallback } = this.props;
    if (!onRowDoubleClickedCallback) {
      return;
    }
    if (event.data.hasOwnProperty("id")) {
      onRowDoubleClickedCallback(event.rowIndex, event.data["id"]);
    }
    else {
      onRowDoubleClickedCallback(event.rowIndex);
    }
  }

  onRowSelected = (event) => {
    const { onRowSelected: onRowSelectedCallback } = this.props;
    if (!onRowSelectedCallback || !event.node.selected) {// This is for unselected! not selected.
        return;
    }
    if (event.data.hasOwnProperty("id")) {
      onRowSelectedCallback(event.rowIndex, event.data["id"]);
    }
    else {
      onRowSelectedCallback(event.rowIndex);
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

  getPageText = (pageArray, index) => {
    if (!pageArray || pageArray.length < index || !pageArray[index]) {
      return "";
    }
    if (typeof pageArray[index] === "string") {
      return pageArray[index];
    }
    if (pageArray[index].hasOwnProperty('name')) {
      return pageArray[index].name;
    }
    return "";
  }

  onGridReady = (params) => {
    this.gridApi = params.api;
    // Following line to make the currently visible columns fit the screen  
    params.api.sizeColumnsToFit();
    // Following line dymanic set height to row on content
    params.api.resetRowHeights();
  }

  onGridSizeChanged = (event) => {
    const { height: fixHeight, maxHeight=9999, minHeight=0 } = this.props;
    if (fixHeight) return;
    let newRowCount = event.api.getDisplayedRowCount();
    let destHeight = 0;
    if (this.prevRowCount > newRowCount) {
      // Row deleted, estimate the new height by row count
      if (newRowCount > this.minRowCount || newRowCount < this.maxRowCount) destHeight = 0;
    } else {
      let newHeight = event.clientHeight;
      if (newHeight >= maxHeight) destHeight = maxHeight;
      else if (newHeight <= minHeight) destHeight = minHeight;
      if (this.prevHeight === destHeight) return;
    }
    document.querySelector('#resultGrid').style.height = destHeight>0?(destHeight+'px'):'';
    event.api.setDomLayout(destHeight>0?'normal':'autoHeight');
    console.log(`onGridSizeChanged: max:${maxHeight} min:${minHeight} dest:${destHeight}.`);
    this.prevRowCount = newRowCount;
    this.prevHeight = destHeight;
  }

  render() {
    const { t, margin, width, title, titleHeight, color, height: fixHeight,
      pageNames, pagePrevCaption, pageNextCaption, initPageIndex, pageInputCaption, rowSelection, 
      onCellClicked: onCellClickedCallback, onRowClicked: onRowClickedCallback, onRowDoubleClicked: onRowDoubleClickedCb,
      headers, data, onResultPageIndexChanged, onRowSelected: onRowSelectedCallback,
      ...other_props } = this.props;
    const { curPageIndex } = this.state;
    //console.log("render: curPageIndex: "+curPageIndex);
    return (
      <Flex flex={1} direction="column" width={width ? width : "100%"} height="inherit" margin={margin} >
        {
          (title || pageNames) &&
          <Box display="flex" flexDirection="row" bg={color+".400"} minH={titleHeight} px={4} alignItems="center"
            borderWidth={1} borderColor={color+".200"} roundedTop="md">
            <Text width="100%">{title}</Text>
            {
              pageNames && pageNames.length>0 && (!initPageIndex || initPageIndex>=0) &&
              <Flex direction="row" alignItems="center">
                {
                  pageInputCaption &&
                  <Flex direction="row" alignItems="center">
                    <Text ml={2} whiteSpace="nowrap">{pageInputCaption[0]}</Text>
                    <Input width="3rem" px="4px" textAlign="center" mx={2} size="md" value={curPageIndex+1} onChange={this.onEditPageNum} />
                    <Text mr={2} whiteSpace="nowrap">{pageInputCaption[1]}</Text>
                  </Flex>
                }
                <Button mr={2} variantColor="gray" variant="solid" disabled={curPageIndex <= 0} onClick={this.onPagePrevClicked}>{pagePrevCaption ? pagePrevCaption : t("common.previous")}</Button>
                { !pageInputCaption && <Text whiteSpace="nowrap" mx={2}>{this.getPageText(pageNames, curPageIndex)}</Text> }
                <Button ml={2} variantColor="gray" variant="solid" disabled={curPageIndex >= pageNames.length-1} onClick={this.onPageNextClicked}>{pageNextCaption ? pageNextCaption : t("common.next")}</Button>
              </Flex>
            }
          </Box>
        }
        <Box flex={1} width="100%" height="inherit" borderWidth={1} borderColor={color+".200"} roundedBottom="md">
          <div id="resultGrid" className="ag-theme-alpine" style={{width: "100%", height: fixHeight?fixHeight:""}}>
            <AgGridReact
              domLayout={fixHeight?'normal':'autoHeight'}
              overlayNoRowsTemplate={this.overlayNoRowsTemplate}
              overlayLoadingTemplate={this.overlayLoadingTemplate}
              animateRows={false}
              onGridReady={this.onGridReady}
              onGridSizeChanged={this.onGridSizeChanged}
              defaultColDef={this.defaultColDef}
              frameworkComponents={this.frameworkComponents}
              columnDefs={this.columnDefs}
              rowData={data}
              //rowClassRules={rowClassRules}
              onCellClicked={this.onCellClicked}
              onRowClicked={this.onRowClicked}
              onRowDoubleClicked={this.onRowDoubleClicked}
              rowSelection={rowSelection}
              onRowSelected={this.onRowSelected}
              {...other_props} >
            </AgGridReact>
          </div>
        </Box>
      </Flex>
    );
  }
}

const ResultTable = withTranslation("translation", {withRef: true})(ResultTableWrapper);
export { ResultTable };
