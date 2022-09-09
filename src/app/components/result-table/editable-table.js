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
import { isImmutable } from 'immutable';

import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine.css';
import './table.css';

import { CommonRenderer } from "./common-renderer";
import { ArrayDataRenderer } from "./arraydata-renderer";
import { SelectorCelleditor } from "./selector-celleditor";

class EditableTableWrapper extends Component {
  constructor(props) {
    super(props);
    const { t, initPageIndex, rowHeight, fixedColWidth } = props;
    this.state = {
      curPageIndex: initPageIndex ? initPageIndex : 0,
      editPageNum: ""
    };
    this.defaultColDef = {
      autoHeight: !rowHeight,
      flex: 1,
      minWidth: 80,
      resizable: !fixedColWidth,
      wrapText: true,
    }
    this.frameworkComponents = {
      commonRenderer: CommonRenderer,
      arrayDataRenderer: ArrayDataRenderer,
      selectorCelleditor: SelectorCelleditor,
    }
    this.buildColDef(props);
    this.buildData(props);
    this.zixi = t("kebiao.zixi");
    this.previousRowCount = 0;
    this.underShrink = false;
    this.gridSizeAdapted = false;
    this.gridApi = null;
    this.prevWidth = 0;
    this.prevHeight = 0;
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

  courseTeacherSetter = (params) => {
    let dest_col = params.colDef.field;
    if (!params.newValue || params.newValue.length < 1) {
      delete params.data[dest_col];
      return true;
    }
    let old_string = "";
    if (params.oldValue && params.oldValue.length > 0) {
      //old_string = params.oldValue.replace("\u274C", "").replace("\u2753", "").replace(/\s+/g, "");
      old_string = params.oldValue.replace("\u3010", "").replace("\u3011", "").replace(/\s+/g, "");
    }
    //let input_string = params.newValue.replace("\u274C", "").replace("\u2753", "");
    let input_string = params.newValue.replace("\u3010", "").replace("\u3011", "");
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
      if (output.course === this.zixi) {
        delete params.data[dest_col];
        return true;
      }
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

  labListGetter = (params) => {
    let value = params.data[params.colDef.field];
    if (!value) {
      // Show flash icon when lab hour > 0
      return (!params.data.theory_item_content && !params.data.theory_item_hours)?"\u26A1":"";
    }
    let loc_data = value.items;
    if (!loc_data) {
      return "...";
    }
    if (isImmutable(loc_data)) {
      loc_data = value.items.toJS();
    }
    let short_names = Object.values(loc_data).map(function (lab_info) {
      return lab_info.location;
    });
    return short_names.join(', ');
  };

  teacherListGetter = (params) => {
    let value = params.data[params.colDef.field];
    if (!value) {
      return "";
    }
    if (Array.isArray(value)) {
      return value.map(function (teacher_info) {
        return teacher_info.name;
      });
    }
    return value.name;
  };

  increasingValueGetter = (params) => {
    let value = params.data[params.colDef.field];
    if (!value) {
      return "";
    }
    if (params.node.rowIndex == 0) {
      return value;
    }
    let indexBefore = params.node.rowIndex;
    if (params.api == undefined) {
      return value;
    }
    let dataBefore = params.api.getDisplayedRowAtIndex(indexBefore - 1);
    if (value < dataBefore.data[params.colDef.field]) {
      return "\u2757"+value;
    }
    return value;
  };

  buildColDef = (props) => {
    const { headers, defaultColWidth, colLineHeight, cellClassRules } = props;
    const columnDefs = [];
    if (!headers || !Array.isArray(headers)) {
      return;
    }
    for (let i=0; i < headers.length; i++) {
      let { name, width, maxW, minW, dataType, fn_disable, ...defs_generated} = headers[i];
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
            defs_generated.valueGetter = this.classNamesGetter;
            break;
          case "lab_list":
            defs_generated.valueGetter = this.labListGetter;
            break;
          case "teacher_obj_array":
            defs_generated.valueGetter = this.teacherListGetter;
            defs_generated.valueSetter = params => {
              let newValue = params.newValue;
              if (typeof newValue !== 'string') return false;
              newValue = newValue.replace('，',' ').replace(',', ' ');
              let teachers = newValue.split(" ");
              params.data[params.column.colId] = teachers.map(teacher_name => ({id: -1, name: teacher_name}));
              return true;
            }
            break;
          case "course_teacher_combined":
            defs_generated.valueGetter = this.courseTeacherGetter;
            defs_generated.valueSetter = this.courseTeacherSetter;
            defs_generated.cellStyle = params => { 
              let course_teacher_combined = params.data[params.colDef.field];
              if (course_teacher_combined) {
                if (course_teacher_combined.cid < 0) return { backgroundColor: '#FEB2B2' };
                if (course_teacher_combined.tid < 0) return { backgroundColor: '#FED7E2' };
                if (course_teacher_combined.cid == 0) return { backgroundColor: '#00B5D8' };
              }
              return;
            };
            break;
          case "departments_selector":
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
            /*defs_generated["valueFormatter"] = params => {  // valueFormatter will not init selector value right
              if (typeof params.value === 'number') {
                let dep_name = this.props.departments[params.value+""];
                return dep_name;
              } else {
                return params.value;
              }
            }*/
            break;
          case "increasing_value":
            // To display exclamation sign when the value is smaller than before row.
            defs_generated.valueGetter = this.increasingValueGetter;
            defs_generated.valueSetter = params => {
              let newValue = params.newValue;
              if (typeof newValue !== 'string') {
                return false;
              }
              // Remove any non-numberic charactors
              params.data[params.column.colId] = newValue.replace(/[^0-9]/ig, "");
              return true;
            }
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

  notifyPageIndexChanged = (index) => {
    const { onResultPageIndexChanged } = this.props;
    if (onResultPageIndexChanged) {
      onResultPageIndexChanged(index);
    }
  }

  onGridReady = (params) => {
    const { rowDragManaged, orderbyAsc, orderbyDesc } = this.props;
    this.gridApi = params.api;
    // Following line to make the currently visible columns fit the screen  
    params.api.sizeColumnsToFit();
    // Following line dymanic set height to row on content
    params.api.resetRowHeights();
    // Order rows by colId from props---re-order will disable rowDrag!
    if (!rowDragManaged && (orderbyAsc || orderbyDesc)) {
      let _sort = orderbyAsc?'asc':'desc';
      let _col = orderbyAsc?orderbyAsc:orderbyDesc;
      if (typeof _col === 'string' &&  _col.length >= 1) {
        params.columnApi.applyColumnState({
          state: [{ colId: _col, sort: _sort }],
          defaultState: { sort: null },
        });
      }
    }
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
            console.log("EDITABLETABLE: Need re-adapt!");
          } else if (this.previousRowCount > newRowCount && this.underShrink === true) {
            if (max_height > newRowCount*40) {
              this.gridSizeAdapted = false;
              console.log("EDITABLETABLE: Need re-adapt for RowCount!");
            }
          }
          console.log("EDITABLETABLE: RowCount different:"+this.previousRowCount+" to "+newRowCount);
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
      console.log("EDITABLETABLE: should_shrink:"+should_shrink+" grid Client h:"+event.clientHeight+
      " maxH:"+maxHeight+" screenH:"+window.screen.availHeight+" RowCount:"+this.previousRowCount);
      this.setAutoHeight(event, should_shrink, max_height);
      this.gridSizeAdapted = true;
    } else {
      console.log("EDITABLETABLE: resetRowHeights:"+event.type);
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
    document.querySelector('#editableGrid').style.height = shouldShrink?(maxTableHeight+'px'):'';
    this.underShrink = shouldShrink;
    console.log("EDITABLETABLE: setDomLayout: "+(shouldShrink?'normal':'autoHeight'));
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
    const { columnDefs, rowData, defaultColDef, frameworkComponents, onGridReady, onGridSizeChanged,
      onCellClicked, onPagePrevClicked, onPageNextClicked, onEditPageNum } = this;
    const { t, width, title, color, rowHeight, titleHeight, pageNames, pageInputCaption, pagePrevCaption, pageNextCaption, 
      rowSelection, onCellClicked: onCellClickedCallback, onCellDoubleClicked, onCellEditingStarted, rowDragManaged, onSelectionChanged,
      onCellValueChanged, defaultColWidth, cellClassRules, headers, data, onResultPageIndexChanged, 
      ...other_props } = this.props;
    const { curPageIndex } = this.state;
    //console.log("RowData: "+JSON.stringify(rowData));
    return (
      <Flex direction="column" width={width ? width : "100%"} height="inherit" {...other_props}>
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
        <Box flex={1} width="100%" height="inherit" borderWidth={1} borderColor={color+".200"} roundedBottom="md">
          <div id="editableGrid" className="ag-theme-alpine" style={{width: "100%", height: "inherit"}}>
            <AgGridReact
              animateRows={true}
              rowDragManaged={rowDragManaged}
              suppressMoveWhenRowDragging={true}
              onGridReady={onGridReady}
              onGridSizeChanged={onGridSizeChanged}
              defaultColDef={defaultColDef}
              frameworkComponents={frameworkComponents}
              columnDefs={columnDefs}
              rowData={rowData}
              rowHeight={rowHeight}
              stopEditingWhenCellsLoseFocus={true}
              deltaRowMode={true}
              //getRowNodeId={data=>data.id} // Bug: make rowHeight flash forever!
              onCellValueChanged={onCellValueChanged}
              onCellEditingStarted={onCellEditingStarted}
              onCellClicked={onCellClicked}
              onCellDoubleClicked={onCellDoubleClicked}
              rowSelection={rowSelection}
              onSelectionChanged={onSelectionChanged} >
            </AgGridReact>
          </div>
        </Box>
      </Flex>
    )
  }
}
const EditableTable = withTranslation("translation", {withRef: true})(EditableTableWrapper);
export { EditableTable };
