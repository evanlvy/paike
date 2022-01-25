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
import { slotsTranslation } from "../../redux/modules/rawplan";

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
    this.buildUI(props);
    this.previousRowCount = 0;
    this.underShrink = false;
    this.gridSizeAdapted = false;
    this.zixi = t("kebiao.zixi");
    this.gridApi = null;
    this.prevWidth = 0;
    this.prevHeight = 0;
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
      this.buildUI(nextProps);
      //setTimeout(()=>{this.buildUI(nextProps)}, 0);
      console.log("shouldComponentUpdate1:true");
      return true;
    }
    if (nextState.curPageIndex !== state.curPageIndex) {
      console.log("shouldComponentUpdate2:true");
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
    //this.buildColDef(props);
    this.buildData(props);
  }

  buildColDef = (props) => {
    const { headers, defaultColWidth, colLineHeight } = props;
    this.columnDefs = this.buildColDefArray(headers, defaultColWidth, colLineHeight);
  }

  buildColDefArray = (headers, defaultColWidth, colLineHeight) => {
    let columnDefs = [];
    const { t } = this.props;
    for (let i=0; i < headers.length; i++) {
      if (headers[i].width) {
        headers[i].minW = undefined;
        headers[i].maxW = undefined;
      } else if (!headers[i].minW && !headers[i].maxW) {
        headers[i].width = defaultColWidth;
      }
      columnDefs[i] = {
        //colId: i,  // Do not set colId because field will not be used in startEditingCell or getColumn.
        headerName: headers[i].name,
        field: headers[i].field,
        width: headers[i].width,
        minWidth: headers[i].minW,
        maxWidth: headers[i].maxW,
        sortable: headers[i].sortable ? headers[i].sortable: false,
        filter: headers[i].filter ? headers[i].filter: false,
        //lineHeight: colLineHeight,
        cellRenderer: i === 0 ? "arrayDataRenderer" : "commonRenderer",
        cellRendererParams: {
          lineHeight : colLineHeight // pass the field value here
        },
        //resizable: headers[i].resizable,
      };
      if (headers[i].children && headers[i].children.length > 0) {
        columnDefs[i]["children"] = this.buildColDefArray(headers[i].children, defaultColWidth/2, colLineHeight);
      }
      if (headers[i].dataType && headers[i].dataType !== null) {
        if (headers[i].dataType === "course_teacher_combined") {
          columnDefs[i]["valueGetter"] = this.courseTeacherGetter;
          columnDefs[i]["cellStyle"] = params => { 
            let course_teacher_combined = params.data[params.colDef.field];
            if (!course_teacher_combined) return;
            return course_teacher_combined.cid < 0 ? { backgroundColor: '#FEB2B2' } : (course_teacher_combined.tid < 0? { backgroundColor: '#FED7E2' }:{});
          };
        }
        else if (headers[i].dataType === "classes_id_name_obj") {
          columnDefs[i]["valueGetter"] = this.classNamesGetter;
        }
        else if (headers[i].dataType === "slot_weekday_renderer") {
          //columnDefs[i]["valueGetter"] = this.slotWeekdayGetter;
          columnDefs[i]["cellRenderer"] = "conflictsRenderer";
          columnDefs[i]["cellRendererParams"] = {
            onItemClicked: this.onItemClicked
          };
        }
      }
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

  
  slotWeekdayGetter = (params) => {
    //console.log("slotWeekdayGetter: params:"+params.value+" column:"+JSON.stringify(params.colDef, this.getCircularReplacer()));
    let value = params.data[params.colDef.field];
    console.log("slotWeekdayGetter: value:"+JSON.stringify(value));
    //Data sample: [mon_12, tue_56] or [mon, fri]
    if (!value) {
      return "";
    }
    let flat_string = "";
    Object.keys(value).forEach(index => {
      let translated = slotsTranslation[value[index]];
      if (translated) {
        flat_string += translated+" ";
      }
    });
    return flat_string;
  };

  //Cell Edit Ref https://www.ag-grid.com/javascript-grid/cell-editing/?
  courseTeacherGetter = (params) => {
    //console.log("courseTeacherGetter: params:"+params.value+" column:"+JSON.stringify(params.colDef, this.getCircularReplacer()));
    let value = params.data[params.colDef.field];
    //console.log("courseTeacherGetter: value:"+JSON.stringify(value));
    if (!value) {
      return this.zixi;
    }
    let cname = value.course;
    /*if (value.cid <= 0){
      cname = (value.cid < 0?"\u274C":"\u2753")+cname;
    }*/
    let tname = value.teacher;
    /*if (value.tid <= 0){
      tname = (value.tid < 0?"\u274C":"\u2753")+tname;
    }*/
    let output = "\u3010" + cname + "\u3011 " + tname;
    //console.log("courseTeacherGetter: "+output);
    return output;
  };
  
  buildData = (props) => {
    const { data } = props;
    this.rowData = [];
    for (let i=0; i < data.length; i++) {
      this.rowData[i] = data[i];
    }
    //console.log("buildData: "+JSON.stringify(data));
  }

  onGridReady = (params) => {
    this.gridApi = params.api;
    // Following line to make the currently visible columns fit the screen  
    params.api.sizeColumnsToFit();
    // Following line dymanic set height to row on content
    params.api.resetRowHeights();
  }

  onGridSizeChanged = (event) => {
    console.log("onGridSizeChanged");
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
      console.log("RESULTABLE: resetRowHeights:"+event.type);
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
    document.querySelector('#myGrid').style.height = shouldShrink?(maxTableHeight+'px'):'';
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
    const { frameworkComponents, columnDefs, defaultColDef, rowClassRules, rowData, onGridSizeChanged, onGridReady,
      onCellClicked, onRowClicked, onRowSelected, onPagePrevClicked, onPageNextClicked, onEditPageNum } = this;
    const { t, width, title, titleHeight, color, rowHeight,
      pageNames, pagePrevCaption, pageNextCaption, initPageIndex, pageInputCaption, rowSelection, 
      onCellClicked: onCellClickedCallback, onRowClicked: onRowClickedCallback,
      headers, data, autoHeight, colLineHeight, autoShrinkDomHeight, onResultPageIndexChanged, onRowSelected: onRowSelectedCallback,
      ...other_props } = this.props;
    const { curPageIndex } = this.state;
    //console.log("render: curPageIndex: "+curPageIndex);
    return (
      <Flex flex={1} direction="column" width={width ? width : "100%"} {...other_props}>
        {
          (title || pageNames) &&
          <Box display="flex" flexDirection="row" bg={color+".400"} height={titleHeight} px={4} alignItems="center"
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
        <Box flex={1} width="100%" height="1500px" borderWidth={1} borderColor={color+".200"} roundedBottom="md">
          <div id="myGrid" className="ag-theme-alpine" style={{width: "100%", height: "100%"}}>
            <AgGridReact
              //domLayout={autoShrinkDomHeight?'autoHeight':'normal'}
              animateRows={false}
              onGridReady={onGridReady}
              onGridSizeChanged={onGridSizeChanged}
              defaultColDef={defaultColDef}
              frameworkComponents={frameworkComponents}
              columnDefs={columnDefs}
              rowData={rowData}
              rowHeight={rowHeight}
              //rowClassRules={rowClassRules}
              onCellClicked={onCellClicked}
              onRowClicked={onRowClicked}
              rowSelection={rowSelection}
              onRowSelected={onRowSelected} >
            </AgGridReact>
          </div>
        </Box>
      </Flex>
    );
  }
}

const ResultTable = withTranslation("translation")(ResultTableWrapper);
export { ResultTable };
