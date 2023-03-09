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

import { CellConverters } from './cell-converters';
import { CommonRenderer } from "./common-renderer";
import { ArrayDataRenderer } from "./arraydata-renderer";
import { SelectorCelleditor } from "./selector-celleditor";
import { DEFAULT_TABLE_ROW_HEIGHT } from "../../redux/modules/common/info"

export const DATATYPE_WEEK = "grouped_increasing_week";
export const DATATYPE_COLOR_AS_WEEK = "grouped_color_as_week";

class EditableTableWrapper extends Component {
  constructor(props) {
    super(props);
    const { t, initPageIndex, fixedColWidth, maxHeight=9999, minHeight=0, colLineHeight=DEFAULT_TABLE_ROW_HEIGHT } = props;
    this.state = {
      curPageIndex: initPageIndex ? initPageIndex : 0,
      editPageNum: ""
    };
    this.defaultColDef = {
      minWidth: 80,
      resizable: !fixedColWidth,
      wrapText: true,
      enableCellChangeFlash: true,
      //cellStyle: { display: 'block', textOverflow:'ellipsis',whiteSpace:'nowrap', overflow: 'hidden', padding: 0 }
    }
    this.frameworkComponents = {
      commonRenderer: CommonRenderer,
      arrayDataRenderer: ArrayDataRenderer,
      selectorCelleditor: SelectorCelleditor,
    }
    this.buildColDef(props);
    this.buildData(props);
    this.zixi = t("kebiao.zixi");
    this.gridApi = null;
    this.prevRowCount = 0;
    this.prevHeight = 0;
    this.maxRowCount = Math.ceil(maxHeight/colLineHeight);
    this.minRowCount = Math.ceil(minHeight/colLineHeight);
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { props, state } = this;
    // console.log("shouldComponentUpdate, orig props "+JSON.stringify(props));
    if (nextProps.data !== props.data) {
      return true;
      //this.buildData(nextProps);
    }
    if (nextProps.title !== props.title || nextProps.headers !== props.headers || nextProps.defaultColWidth !== props.defaultColWidth
    || nextProps.colLineHeight !== props.colLineHeight) {
      this.buildColDef(nextProps);
      return true;
    }
    if (nextState.curPageIndex !== state.curPageIndex) {
      console.log("shouldComponentUpdate:true");
      return true;
    }
    return false;
  }

  componentDidUpdate(prevProps) {
    console.log("LIFECYCLE: componentDidUpdate");
    if (prevProps.data !== this.props.data) {
      this.buildData(this.props);
    }
  }

  buildColDef = (props) => {
    const { headers, defaultColWidth, colLineHeight, cellClassRules, disableEdit } = props;
    const columnDefs = [];
    if (!headers || !Array.isArray(headers)) {
      return;
    }
    for (let i=0; i < headers.length; i++) {
      let { name, dataType, fn_disable, ...defs_generated} = headers[i];
      if (defs_generated.editable === true) {
        if (disableEdit === false) {
          defs_generated.editable = false;
        }
        else if ((defs_generated.width && defs_generated.width>=200) || ( defs_generated.minWidth && defs_generated.minWidth>=200)) {
          // Use Large text editor for super long text!
          defs_generated.cellEditor = 'agLargeTextCellEditor';
        }
      }
      if (cellClassRules) {
        defs_generated.cellClassRules = cellClassRules;
      }
      if (defs_generated.rowDrag !== true) {
        defs_generated.cellRenderer = i === 0 ? "arrayDataRenderer" : "commonRenderer";
        defs_generated.cellRendererParams = {
          lineHeight : colLineHeight, // pass the field value here
          fn_disable : fn_disable,
        };
      }
      defs_generated.headerName = name;
      if (dataType && dataType !== null) {
        switch(dataType) {
          case "classes_id_name_obj":
            defs_generated.valueGetter = CellConverters.classNamesGetter;
            break;
          case "lab_list":
            defs_generated.valueGetter = CellConverters.labListGetter;
            break;
          case "teacher_obj_array":
            defs_generated.valueGetter = CellConverters.teacherListGetter;
            defs_generated.valueSetter = CellConverters.teacherListSetter;
            break;
          case "course_teacher_combined":
            defs_generated.valueGetter = CellConverters.courseTeacherGetter;
            defs_generated.valueSetter = CellConverters.courseTeacherSetter;
            defs_generated.cellStyle = CellConverters.courseTeacherCellStyle;
            break;
          case "departments_selector":
            if (this.props.departments) {
              defs_generated.cellEditor = "selectorCelleditor";
              defs_generated.cellEditorParams = {
                values: Object.values(this.props.departments),
              }
              defs_generated.valueGetter = params => {
                let data_item = params.data[params.column.colId];
                if (typeof data_item === 'number') {
                  let dep_name = this.props.departments[data_item+""];
                  return dep_name;
                } else {
                  return data_item;
                }
              }
            }
            /*defs_generated["valueFormatter"] = params => {  // valueFormatter will not init selector value right
              if (typeof params.value === 'number') {
                let dep_name = this.props.departments[params.value+""];
                return dep_name;
              } else {
                return params.value;
              }
            }*/
            break;
          case DATATYPE_WEEK:
            // To display exclamation sign when the value is smaller than before row.
            //defs_generated.valueGetter = this.increasingValueGetter;
            defs_generated.valueSetter = CellConverters.numbersOnlyValueSetter;
            // NO BREAK HERE! SHARING CODE!
          case DATATYPE_COLOR_AS_WEEK:
            defs_generated.cellStyle = CellConverters.groupColoredWeekCellStyle;
            break;
          default:
            console.log(`Sorry, Unknown dataType: ${dataType}.`);
        }
      }
      columnDefs[i] = defs_generated;
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

  onGridReady = (params) => {
    this.gridApi = params.api;
    // Following line to make the currently visible columns fit the screen  
    params.api.sizeColumnsToFit();
    // Following line dymanic set height to row on content
    params.api.resetRowHeights();
    const { additionalColumnState } = this.props;
    if (additionalColumnState) {
      params.columnApi.applyColumnState(additionalColumnState);
    }
    /*
    // Order rows by colId from props---re-order will disable rowDrag!
    const { rowDragManaged, orderbyAsc, orderbyDesc } = this.props;
    if (!rowDragManaged && (orderbyAsc || orderbyDesc)) {
      let _sort = orderbyAsc?'asc':'desc';
      let _col = orderbyAsc?orderbyAsc:orderbyDesc;
      if (typeof _col === 'string' &&  _col.length >= 1) {
        params.columnApi.applyColumnState({
          state: [{ colId: _col, sort: _sort }],
          defaultState: { sort: null },
        });
      }
    }*/
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
    document.querySelector('#editableGrid').style.height = destHeight>0?(destHeight+'px'):'';
    event.api.setDomLayout(destHeight>0?'normal':'autoHeight');
    console.log(`onGridSizeChanged: max:${maxHeight} min:${minHeight} dest:${destHeight}.`);
    this.prevRowCount = newRowCount;
    this.prevHeight = destHeight;
  }

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
    const { t, margin, color, title, width, height: fixHeight, maxHeight, minHeight, titleHeight, 
      pageNames, pageInputCaption, pagePrevCaption, pageNextCaption, 
      rowSelection, onCellDoubleClicked, onCellEditingStarted, rowDragManaged, onSelectionChanged,
      onCellValueChanged, defaultColWidth, cellClassRules, headers, data,
      undoRedoCellEditing, undoRedoCellEditingLimit, enableCellChangeFlash,
      ...other_props } = this.props;
    const { curPageIndex } = this.state;
    //console.log("RowData: "+JSON.stringify(rowData));
    return (
      <Flex direction="column" width={width ? width : "100%"} height="inherit" margin={margin} >
        {
          (title || pageNames) &&
          <Box display="flex" flexDirection="row" bg={color+".400"} minH={titleHeight} px={4} alignItems="center"
            borderWidth={1} borderColor={color+".200"} roundedTop="md">
            <Text width="100%">{title}</Text>
            {
              Array.isArray(pageNames) && pageNames.length > 0 &&
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
                { !pageInputCaption && <Text whiteSpace="nowrap" mx={2}>{pageNames[curPageIndex].name}</Text> }
                <Button ml={2} variantColor="gray" variant="solid" disabled={curPageIndex >= pageNames.length-1} onClick={this.onPageNextClicked}>{pageNextCaption ? pageNextCaption : t("common.next")}</Button>
              </Flex>
            }
          </Box>
        }
        <Box flex={1} width="100%" height="inherit" borderWidth={1} borderColor={color+".200"} roundedBottom="md">
          <div id="editableGrid" className="ag-theme-alpine" style={{width: "100%", height: fixHeight?fixHeight:""}}>
            <AgGridReact
              //animateRows={true}
              domLayout={fixHeight?'normal':'autoHeight'}
              rowDragManaged={rowDragManaged}
              suppressMoveWhenRowDragging={true}
              onGridReady={this.onGridReady}
              onGridSizeChanged={this.onGridSizeChanged}
              defaultColDef={this.defaultColDef}
              frameworkComponents={this.frameworkComponents}
              columnDefs={this.columnDefs}
              rowData={this.rowData}
              stopEditingWhenCellsLoseFocus={true}
              //deltaRowMode={true}
              //getRowId={} // NO USE!!! Never called!
              //getRowNodeId={data=>data.id} // Bug: make rowHeight flash forever!
              onCellValueChanged={onCellValueChanged}
              onCellEditingStarted={onCellEditingStarted}
              onCellClicked={this.onCellClicked}
              onCellDoubleClicked={onCellDoubleClicked}
              rowSelection={rowSelection}
              onSelectionChanged={onSelectionChanged}
              undoRedoCellEditing={undoRedoCellEditing}
              undoRedoCellEditingLimit={undoRedoCellEditingLimit}
              enableCellChangeFlash={enableCellChangeFlash} 
              {...other_props}>
            </AgGridReact>
          </div>
        </Box>
      </Flex>
    )
  }
}
const EditableTable = withTranslation("translation", {withRef: true})(EditableTableWrapper);
export { EditableTable };
