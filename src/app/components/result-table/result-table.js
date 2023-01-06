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

class ResultTableWrapper extends Component {
  constructor(props) {
    super(props);
    const { t, onCellIndicatorClicked, initPageIndex, rowHeight, fixedColWidth } = props;
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
      autoHeight: !rowHeight,
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
    this.previousRowCount = 0;
    this.underShrink = false;
    this.gridSizeAdapted = false;
    this.zixi = t("kebiao.zixi");
    this.gridApi = null;
    this.prevWidth = 0;
    this.prevHeight = 0;
    this.overlayNoRowsTemplate = '<span class="ag-overlay-loading-center">...空空如也...</span>';
    this.overlayLoadingTemplate = '<span class="ag-overlay-loading-center">...加载中...</span>';
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

  onGridReady = (params) => {
    this.gridApi = params.api;
    // Following line to make the currently visible columns fit the screen  
    params.api.sizeColumnsToFit();
    // Following line dymanic set height to row on content
    params.api.resetRowHeights();
  }

  onGridSizeChanged = (event) => {
    //console.log("onGridSizeChanged");
    const { autoShrinkDomHeight, maxHeight } = this.props;
    let max_height = maxHeight;
    if (!max_height) {
      // get the screen height as fail-safe max height
      // So that the table grid will not exceed the valid screen height!
      max_height = window.screen.availHeight - 80;
    }
    if (autoShrinkDomHeight) {
      let newRowCount = event.api.getDisplayedRowCount();
      if (this.gridSizeAdapted === true) {
        if (this.previousRowCount !== newRowCount) {
          if (this.previousRowCount < newRowCount && this.underShrink === false) {
            this.gridSizeAdapted = false;
            console.log("RESULTABLE: Need re-adapt!");
          } else if (this.previousRowCount > newRowCount && this.underShrink === true) {
            if (max_height > newRowCount*40) {
              this.gridSizeAdapted = false;
              console.log("RESULTABLE: Need re-adapt for RowCount!");
            }
          }
          console.log("RESULTABLE: RowCount different:"+this.previousRowCount+" to "+newRowCount);
        }
      }
      this.previousRowCount = newRowCount;
    } else {
      this.gridSizeAdapted = true;
    }
    if (!this.gridSizeAdapted) {
      let should_shrink = false;
      if (event.clientHeight > max_height) {
        // Perform shrink
        should_shrink = true;
      }
      console.log("RESULTABLE: should_shrink:"+should_shrink+" grid Client h:"+event.clientHeight+
      " maxH:"+maxHeight+" screenH:"+window.screen.availHeight+" RowCount:"+this.previousRowCount);
      this.setAutoHeight(event, should_shrink, max_height);
      this.gridSizeAdapted = true;
    } else {
      //console.log("RESULTABLE: resetRowHeights:"+event.type);
      //event.api.resetRowHeights();
      if (event.clientWidth !== this.prevWidth) {
        // Following line to make the currently visible columns fit the screen  
        event.api.sizeColumnsToFit();
      }
      /*if (event.clientHeight !== this.prevHeight) {
        //setTimeout(()=>{this.gridApi.resetRowHeights()}, 0);
        // Following line dymanic set height to row on content
        event.api.resetRowHeights();
      }*/
      this.prevWidth = event.clientWidth;
      this.prevHeight = event.clientHeight;
    }
  }

  // Checkout how-to here: https://www.ag-grid.com/javascript-data-grid/grid-size/
  setAutoHeight = (gridOptions, shouldShrink, maxTableHeight) => {
    gridOptions.api.setDomLayout(shouldShrink?'normal':'autoHeight');
    // auto height will get the grid to fill the height of the contents,
    // so the grid div should have no height set, the height is dynamic.
    document.querySelector('#resultGrid').style.height = shouldShrink?((maxTableHeight-this.props.titleHeight)+'px'):'';
    this.underShrink = shouldShrink;
    console.log("RESULTABLE: setDomLayout: "+(shouldShrink?'normal':'autoHeight'));
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

  render() {
    const { frameworkComponents, columnDefs, defaultColDef, onGridSizeChanged, onGridReady,
      onCellClicked, onRowClicked, onRowDoubleClicked, onRowSelected, onPagePrevClicked, onPageNextClicked, onEditPageNum } = this;
    const { t, width, title, titleHeight, color, rowHeight,
      pageNames, pagePrevCaption, pageNextCaption, initPageIndex, pageInputCaption, rowSelection, 
      onCellClicked: onCellClickedCallback, onRowClicked: onRowClickedCallback, onRowDoubleClicked: onRowDoubleClickedCb,
      headers, data, autoHeight, colLineHeight, autoShrinkDomHeight, onResultPageIndexChanged, onRowSelected: onRowSelectedCallback,
      ...other_props } = this.props;
    const { curPageIndex } = this.state;
    //console.log("render: curPageIndex: "+curPageIndex);
    return (
      <Flex flex={1} direction="column" width={width ? width : "100%"} height="inherit">
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
                    <Input width="3rem" px="4px" textAlign="center" mx={2} size="md" value={curPageIndex+1} onChange={onEditPageNum} />
                    <Text mr={2} whiteSpace="nowrap">{pageInputCaption[1]}</Text>
                  </Flex>
                }
                <Button mr={2} variantColor="gray" variant="solid" disabled={curPageIndex <= 0} onClick={onPagePrevClicked}>{pagePrevCaption ? pagePrevCaption : t("common.previous")}</Button>
                { !pageInputCaption && <Text whiteSpace="nowrap" mx={2}>{this.getPageText(pageNames, curPageIndex)}</Text> }
                <Button ml={2} variantColor="gray" variant="solid" disabled={curPageIndex >= pageNames.length-1} onClick={onPageNextClicked}>{pageNextCaption ? pageNextCaption : t("common.next")}</Button>
              </Flex>
            }
          </Box>
        }
        <Box flex={1} width="100%" height="inherit" borderWidth={1} borderColor={color+".200"} roundedBottom="md">
          <div id="resultGrid" className="ag-theme-alpine" style={{width: "100%", height: "inherit"}}>
            <AgGridReact
              //domLayout={autoShrinkDomHeight?'autoHeight':'normal'}
              overlayNoRowsTemplate={this.overlayNoRowsTemplate}
              overlayLoadingTemplate={this.overlayLoadingTemplate}
              animateRows={false}
              onGridReady={onGridReady}
              onGridSizeChanged={onGridSizeChanged}
              defaultColDef={defaultColDef}
              frameworkComponents={frameworkComponents}
              columnDefs={columnDefs}
              rowData={data}
              rowHeight={rowHeight}
              //rowClassRules={rowClassRules}
              onCellClicked={onCellClicked}
              onRowClicked={onRowClicked}
              onRowDoubleClicked={onRowDoubleClicked}
              rowSelection={rowSelection}
              onRowSelected={onRowSelected}
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
