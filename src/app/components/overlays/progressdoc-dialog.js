import React, { Component } from 'react';
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { withTranslation } from 'react-i18next';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    FormControl,
    FormLabel,
    FormErrorMessage,
    FormHelperText,
    Flex,
    Input,
    Select,
    Text,
    RadioGroup,
    Radio,
    CircularProgress,
  } from "@chakra-ui/core"
import { MdNoteAdd, MdSave, MdDelete } from "react-icons/md"

import {
  CommonModal
} from '../modal/common-modal';

import { EditableTable, DATATYPE_WEEK, DATATYPE_COLOR_AS_WEEK } from '../result-table/editable-table';
import LabitemDialog from './labitem-dialog';
import { actions as progressdocActions, tableFields, getDocProps, getDocItems, parseImmutableLocs } from '../../redux/modules/progressdoc';
import { actions as appActions } from '../../redux/modules/app';
import role from '../../redux/modules/auth';

const DEFAULT_COLOR = "purple";
const CANCEL_COLOR = "gray";

class ProgressdocDialog extends Component {
  constructor(props) {
    super(props);
    const { t, color } = props;
    this.state = {
      isLabItemOpen: false,
      //isOpen: false,
      isSaving: false,
      rowSelected: -1,
      createdItems: [{id:-1, week_idx: 1, chapter_name: "第一章", teaching_mode: "课堂讲授/演示，实验操作讲解"}, {id:-2, week_idx: 2, chapter_name: "第二章", teaching_mode: "课堂讲授/演示，实验操作讲解"}],
      editedRowCache: {},
      removedNodeIds: [],
      saveOption: '1',
    };
    this.color = color ? color : DEFAULT_COLOR;
    this.tableHeaders = [
      //{name: t("progressdocScreen.items_header_order"), field: "ord", rowDrag: true, width: 80, dataType: "grouped_color_as_week"},
      {name: t("progressdocScreen.items_header_id"), field: "id", width: 80, dataType: DATATYPE_COLOR_AS_WEEK},
      {name: t("progressdocScreen.items_header_weekidx"), field: tableFields.WEEK_IDX, rowDrag: true, editable: true, width: 80, dataType: DATATYPE_WEEK},
      {name: t("progressdocScreen.items_header_order_in_week"), field: tableFields.ORDER_IN_WEEK, width: 80, dataType: DATATYPE_COLOR_AS_WEEK},
      {name: t("progressdocScreen.items_header_chapter_name"), field: tableFields.CHAPTER_NAME, editable: true, width: 120},
      {name: t("progressdocScreen.items_header_theory"), field: tableFields.THEORY_ITEM_CONTENT, editable: true, width: 380, fn_disable: this.theory_should_disable},
      {name: t("progressdocScreen.items_header_theoryhours"), field: tableFields.THEORY_ITEM_HOURS, editable: true, width: 80, fn_disable: this.theory_should_disable},
      {name: t("progressdocScreen.items_header_labitem"), field: tableFields.LABITEM_CONTENT, editable: true, width: 380, fn_disable: this.lab_should_disable},
      {name: t("progressdocScreen.items_header_labhours"), field: tableFields.LABITEM_HOURS, editable: true, width: 80, fn_disable: this.lab_should_disable},
      {name: t("progressdocScreen.items_header_labs"), field: tableFields.LAB_ALLOC, width: 100, dataType: "lab_list", fn_disable: this.lab_should_disable},
      {name: t("progressdocScreen.items_header_teaching_mode"), field: tableFields.TEACHING_MODE, editable: true},
      {name: t("progressdocScreen.items_header_comment"), field: tableFields.COMMENT, editable: true},
      //{name: t("progressdocScreen.items_header_docid"), field: "doc_id", width: 80},
    ];
    //this.btnRef = React.createRef()
    this.commonModalRef = React.createRef();
    this.agGridRef = React.createRef();
    this.forms = [
      {id: "user_id", label: t("progressdocScreen.form_label_docowner"), minW: 280, isRequired: true},
      {id: "course_name", label: t("progressdocScreen.form_label_coursename"), minW: 280, isRequired: true},
      {id: "short_name", label: t("progressdocScreen.form_label_shortname"), minW: 280, isRequired: true},
      {id: "description", label: t("progressdocScreen.form_label_description"), minW: 280, isRequired: false},
      //{id: "department_id", label: t("progressdocScreen.form_label_departmentid"), maxW: 100, isRequired: true},
      {id: "total_hours", label: t("progressdocScreen.form_label_totalhours"), maxW: 100, isRequired: true},
      {id: "theory_hours", label: t("progressdocScreen.form_label_theoryhours"), maxW: 100, isRequired: true},
      {id: "lab_hours", label: t("progressdocScreen.form_label_labhours"), maxW: 100, isRequired: true},
      {id: "flex_hours", label: t("progressdocScreen.form_label_flexhours"), maxW: 100, isRequired: true},
      {id: "textbook", label: t("progressdocScreen.form_label_textbook"), minW: 280, isRequired: true},
      {id: "exam_type", label: t("progressdocScreen.form_label_examtype"), minW: 280, isRequired: true},
      {id: "comments", label: t("progressdocScreen.form_label_comments"), minW: 280, isRequired: false},
    ];
    this.insertDbId = -1;
    this.choices = [t("progressdocScreen.selector_save_doc_as_copy"), t("progressdocScreen.selector_save_original_doc", {count: 5})];
    this.lastHighlightedRow = null;
  }

  static getDerivedStateFromProps(props, state) {
    let result = {};
    /*if (props.openedDocId) {
      if (props.openedDocId >= 0 && !state.isOpen) result = {isOpen: true};
      else if (props.openedDocId < 0 && state.isOpen) result = {isOpen: false};
    }*/
    if (props.openedDocId < 0 || props.isNewDoc) {
      // Closed or create new doc
      // Clear doc props
      result = {...result, id: 0, user_id:props.userInfo.id, course_name:"", short_name:"", description:"",total_hours:0, theory_hours:0, lab_hours:0, flex_hours:0, textbook:"", exam_tyoe:"", comments:"" };
    }
    if (!props.docProps) return result;
    // initialize the state with props by the same name id!
    if (props.docProps.id !== state.id) {
      result = {...result, ...props.docProps, editedRowCache:{}, rowSelected: -1}//props.docDetails["props"];
    }
    return result;
  }

  lab_should_disable = (progress_item) => {
    if (!progress_item) {return false;}
    if (!progress_item[tableFields.THEORY_ITEM_CONTENT] && !progress_item[tableFields.THEORY_ITEM_HOURS]) return false;
    if ((!progress_item[tableFields.THEORY_ITEM_CONTENT] || progress_item[tableFields.THEORY_ITEM_CONTENT].length === 0) && progress_item[tableFields.THEORY_ITEM_HOURS] <= 0) return false;
    return true;
  }

  theory_should_disable = (progress_item) => {
    if (!progress_item) {return false;}
    if (!progress_item[tableFields.LABITEM_CONTENT] && !progress_item[tableFields.LABITEM_HOURS]) return false;
    if ((!progress_item[tableFields.LABITEM_CONTENT] || progress_item[tableFields.LABITEM_CONTENT].length === 0) && progress_item[tableFields.LABITEM_HOURS] <= 0) return false;
    return true;
  }

  shouldComponentUpdate(nextProps, nextState) {
    //const { docId, docProps, docItems } = this.props;
    //const { isOpen, department_id, isLabItemOpen, editedRowCache } = this.state;
    //if (nextState.isOpen === this.state.isOpen) {
      // No need to update if dialog is closed
    //  if (!nextState.isOpen) return false;
    //}
    /*if (nextProps.docProps !== docProps){
      console.log("shouldComponentUpdate, docProps diff");
      this.setState({
        isOpen: true,
      });
      return true;
    }*/
    /*if (nextProps.docItems !== docItems) {
      console.log("shouldComponentUpdate, docItems");
      this.setState({
        rowSelected: -1,
        editedRowCache: {},
      });
      return true;
    }*/
    /*for (let index = 0; index < this.forms.length; index++) {
      let form = this.forms[index];
      if (this.state[form.id] !== nextState[form.id]) {
        console.log("shouldComponentUpdate, FORMs diff:"+form.id);
        return true;
      }
    }*/
    if (nextState !== this.state) {
      //console.log("shouldComponentUpdate, nextState diff");
      return true;
    }
    /*if (nextState.isOpen !== isOpen || nextState.editedRowCache !== editedRowCache
      || nextState.department_id !== department_id || nextState.isLabItemOpen !== isLabItemOpen) {
      console.log("shouldComponentUpdate, nextState diff");
      return true;
    }*/
    return false;
  }

  componentDidUpdate(prevProps) {
    //console.log("LIFECYCLE: componentDidMount");
    const { docItems, openedDocId } = this.props;
    if (!docItems) return;
    if (prevProps.openedDocId !== openedDocId) {
      this.doc_items_obj = {};
      docItems.forEach(item => {
        this.doc_items_obj[item.id] = {...item};
      });
    }
  }
  
  onFormChanged = (event) => {
    let newVal = event.target.value;
    if (event.target.id.endsWith("_hours")){
      // Keep numberic value, remove 0 from header
      newVal = newVal.replace(/[^0-9]/ig, "").replace(/\b(0+)/gi,"");
      if (newVal.length < 1) {
        newVal = "0";
      }
    } else {
      newVal = newVal.trim();
    }
    // Must keep the state id same with the form input id
    this.setState({
      [event.target.id] : newVal,
    });
  }

  onCellDoubleClicked = (event) => {
    // Process lab_alloc column only
    if (event && event.column.colId === tableFields.LAB_ALLOC && !event.data.theory_item_hours && !event.data.theory_item_content) {
      let lab_alloc = event.data.lab_alloc;
      let short_names = lab_alloc?parseImmutableLocs(lab_alloc.items):"";
      let lab_state = lab_alloc?{...lab_alloc, locations:short_names}:{};
      this.setState({
        labs: lab_state,
        context: {
          doc_course_name: this.state.course_name,
          doc_short_name: this.state.short_name,
          doc_department_id: this.state.department_id,
          // Progress item lab content may not be the same with lab item name
          doc_lab_content: lab_alloc?lab_alloc.name:"", //event.data.labitem_content,
          //rowIndex: event.rowIndex,
          progressId: event.data.id,
        },
        isLabItemOpen: true,
      });
    }
  }

  onCellValueChanged = (params) => {
    let dest_col = params.colDef.field;
    console.log("onCellValueChanged: newValue:"+JSON.stringify(params.newValue)+" oldValue:"+params.oldValue);
    if (params.oldValue && params.newValue && params.newValue == params.oldValue) {
      // Compare value with no change
      return;
    }
    if (dest_col === tableFields.WEEK_IDX) {
      let num = parseInt(params.newValue);
      let bad_num = false;
      if (!num) {
        num = params.oldValue;
        bad_num = true;
      }
      if (bad_num) {
        const data = params.data;
        data[tableFields.WEEK_IDX] = num;
        params.api.applyTransaction({ update: [data] });
        return;  // Do not record to changed value because we recover it!
      }
      this.arrangeOrder(params.api, [params.node], null, (params.oldValue < params.newValue)?0:1, params.oldValue, params.newValue);
    }
    if (dest_col === tableFields.LAB_ALLOC) dest_col = tableFields.LABITEM_ID;
    this.setState({editedRowCache: {...this.state.editedRowCache, 
      [params.node.id]: {...this.state.editedRowCache[params.node.id], [dest_col]: params.newValue}}});
  }

  onCellEditingStarted  = (params) => {
    let dest_col = params.colDef.field;
    // When theory cells added, check if the lab cells have contents
    let should_stop_editing = false;
    let verify_mutex = null;
    if (dest_col.startsWith("theory_item_")) {
      verify_mutex = "labitem_";
    } else if (dest_col.startsWith("labitem_")) {
      verify_mutex = "theory_item_"
    }
    if (verify_mutex != null) {
      if (params.data[verify_mutex+"content"] && params.data[verify_mutex+"content"].length > 0) should_stop_editing = true;
      if (params.data[verify_mutex+"hours"] && params.data[verify_mutex+"hours"] > 0) should_stop_editing = true;
    }
    if (should_stop_editing) params.api.stopEditing();
  }

  flashCells = () => {
    if (!this.agGridRef.current.gridApi || !this.state.editedRowCache) return;
    Object.keys(this.state.editedRowCache).forEach(function(nodeId){
      //let row = this.agGridRef.current.gridApi.getDisplayedRowAtIndex(parseInt(idx));
      let rowNode = this.agGridRef.current.gridApi.getRowNode(nodeId);
      if (rowNode) {
        let cols = Object.keys(this.state.editedRowCache[nodeId]);
        if (cols.includes(tableFields.LABITEM_ID)) {
          cols.push(tableFields.LAB_ALLOC);
        }
        this.agGridRef.current.gridApi.flashCells({ rowNodes: [rowNode], columns: cols });
      }
    }, this);
  }

  onLabItemClosed = (params) => {
    if (this.agGridRef && params && 'progressId' in params /*&& 'rowIndex' in params*/) {
      // Update labitem_id to row cache
      let previous_row_data = this.agGridRef.current.gridApi.getRowNode(params.progressId).data;
      if (!previous_row_data.lab_alloc || (previous_row_data.lab_alloc && previous_row_data.lab_alloc.id !== params.lab_alloc.id)) {
        let newItem = { ...previous_row_data};
        if (tableFields.LAB_ALLOC in params && params.lab_alloc) {
          newItem[tableFields.LAB_ALLOC] = params.lab_alloc;
          // Server do not accept lab_alloc attribute, so record down labitem_id directly (only way to change labitem_id was here)
          newItem[tableFields.LABITEM_ID] = params.lab_alloc.id;
        } else {
          delete newItem[tableFields.LAB_ALLOC];
          delete newItem[tableFields.LABITEM_ID];
        }
        this.agGridRef.current.gridApi.applyTransaction({ update: [newItem] });
        // Update lab_alloc column to edited-row-cache
        this.setState({editedRowCache: {...this.state.editedRowCache, 
          [params.progressId]: {...this.state.editedRowCache[params.progressId], lab_alloc: params.lab_alloc}}});
      }
    }
    this.setState({
      isLabItemOpen: false
    });
  }

  // TBD: Add Create-new-line button.
  // Add order to database for progress items display order.
  // Can modify row order
  /*onSave = () => {
    const { docProps } = this.props;
    const { editedRowCache } = this.state;
    // Check doc props
    let has_diff = false;
    let props_diff = {id: docProps.id};  // Must have id prop
    for (let index = 0; index < this.forms.length; index++) {
      let form = this.forms[index];
      if (this.state[form.id] !== docProps[form.id]) {
        console.log("onSave: FORMs diff:"+form.id);
        props_diff[form.id] = this.state[form.id];
        has_diff = true;
      }
    }
    if (!has_diff && editedRowCache.length <= 0) return; // for nothing changed
    if (editedRowCache.length <= 3) {
      // when 1 or 2 rows changed, use dict mode directly.
      console.log("onSave: delta_dict"+JSON.stringify(editedRowCache));
      this.props.saveDoc(this.state['id'], props_diff, editedRowCache);
    } else {
      // When many rows changed, use dataframe mode.
      let df_col = this.tableHeaders.map((col) => {
        return col['field'] === 'lab_alloc'?'labitem_id':col['field'];
      });
      let df_data = [];
      Object.keys(editedRowCache).forEach((index) => {
        df_data.push(df_col.map((col)=> {
          return (col in editedRowCache[index])?editedRowCache[index][col]:undefined;
        }));
      });
      console.log("onSave: df_data"+JSON.stringify(df_data));
      this.props.saveDoc(this.state['id'], props_diff, null, df_col, df_data);
    }
    this.setState({
      isSaving: true
    });
    this.props.closeDoc();
  }*/
  onSave = () => {
    const { accessLevel, docProps, docItems } = this.props;
    if (!docProps || !docItems) return;
    if (accessLevel > role.PROFESSOR ) {
      // Not enouth access right!
      this.props.setToast({type:"error", message:"toast.access_denied"})
      return;
    }
    // Ask user if we should copy to a new doc
    this.commonModalRef.current.show();
  };

  onSaveDialogResult = (isOk) => {
    if (!isOk || !this.agGridRef.current.gridApi) return true;
    const { docProps } = this.props;
    if (this.state.saveOption === '2'){
      // Overwrite current doc directly:
      // 1. Doc Propertises: Check each prop change
      let props_diff = {};
      if (docProps) {
        Object.keys(docProps).forEach(key => {
          if (this.state[key]!==docProps[key]) {
            props_diff[key] = this.state[key];
          }
        });
      }
      // 2. Progress items: Compose a rows_diff object to send to server for updating existing doc
      let rows_diff = {};
      this.agGridRef.current.gridApi.forEachNode((rowNode) => {
        if (rowNode.id in rows_diff) {
          this.props.setToast({type:"error", message:"NodeId already exist in diff array!"})
          return false; // Break for error
        }
        // Compare edited node with original row data
        let original_row = this.doc_items_obj[rowNode.id];
        if (!original_row) {
          // Create new row
          if (rowNode.id < 0 || rowNode.id.startsWith('-')) {
            // New row for real
            rows_diff[rowNode.id] = rowNode.data;
            // Server do not accept lab_alloc attribute
            delete rows_diff[rowNode.id][tableFields.LAB_ALLOC];
            return true;  // Continue for next row
          } else {
            this.props.setToast({type:"error", message:"New rowNode Id should use negaitive number!"})
            return false; // Break for error
          }
        }
        // Enum each column checking changes
        let row_diff = {};
        this.tableHeaders.forEach(column => {
          if (rowNode.data[column.field] !== original_row[column.field]) {
            if (column.field === tableFields.LAB_ALLOC) {
              // Server do not accept lab_alloc attribute
              row_diff[tableFields.LABITEM_ID] =rowNode.data[tableFields.LABITEM_ID];
            } else {
              row_diff[""+column.field] = rowNode.data[column.field];
            }
          }
        });
        // Add cell changes of the row to table-level changes array
        if (Object.keys(row_diff).length > 0) {
          rows_diff[rowNode.id] = row_diff;
        }
      });
      // Traversal removed items
      this.state.removedNodeIds.forEach((removed_id) => {
        // Remove single row
        if (removed_id in rows_diff) {
          return true; // Continue
        } else {
          rows_diff[removed_id] = {};  // Means delete this progress item
        }
      });
      console.log(rows_diff);
      // Call Server backend API
      this.props.saveDoc(this.state['id'], props_diff, rows_diff);
    } else {
      // Copy a new set of doc & items! Change user_id to current user!
      // Send data as dataframe to save traffic
      let new_props = {}
      this.forms.forEach((form) => {
        new_props[form.id] = this.state[form.id];
      });
      // When many rows changed, use dataframe mode.
      let df_col = this.tableHeaders.map((col) => {
        // Server do not accept lab_alloc attribute, change to labitem_id
        return col['field'] === tableFields.LAB_ALLOC?tableFields.LABITEM_ID:col['field'];
      });
      let df_data = [];
      this.agGridRef.current.gridApi.forEachNode((rowNode) => {
        df_data.push(df_col.map((col)=> {
          return (col in rowNode.data)?rowNode.data[col]:undefined;
        }));
      });
      console.log("onSave: df_data"+JSON.stringify(df_data));
      this.props.saveDoc(this.state['id'], new_props, null, df_col, df_data);
    }
    return true;
  }

  onSaveOptionChanged = (event) => {
    this.setState({
      saveOption: event.target.value
    });
  }

  onSelectionChanged = (params) => {
    const rowCount = params.api.getSelectedNodes().length;
    this.setState({
      rowSelected: rowCount
    });
  };

  onRowDragEnter = (event) => {
    // No multiple-rows dragging allowed.
    event.api.deselectAll();
    event.node.setSelected(true);
  }

  onRowDragMove = (event) => {
    const { rowTop, rowHeight } = event.overNode;
    if (this.lastHighlightedRow && this.lastHighlightedRow !== event.overNode) {
      this.lastHighlightedRow.onMouseLeave();
      this.lastHighlightedRow.setHighlighted(null);
      event.overNode.onMouseEnter();
    }
    // RowHighlightPosition.Above : 0, RowHighlightPosition.Below : 1
    let pos = ((event.y - rowTop) < rowHeight / 2) ?0:1;
    event.overNode.setHighlighted(pos);
    this.lastHighlightedRow = event.overNode;
  };

  pushNodes = (dest_nodes, nodes, week_idx, start_order) => {
    let counter = 0;
    for (let idx = 0; idx < nodes.length; idx++) {
      const node = nodes[idx];
      node.data[tableFields.ORDER_IN_WEEK] = start_order?(start_order + idx):0;
      if (week_idx) {
        node.data[tableFields.WEEK_IDX] = week_idx;
      }
      dest_nodes.push(node.data);
      counter+=1;
    }
    return counter + start_order;
  }

  addRowArrangeOrder = (api, overNode, rowData) => {
    this.arrangeOrder(api, null, overNode, 1, null, rowData['week_idx'], rowData);
  }

  delRowsArrangeOrder = (api, del_nodes) => {
    let week_map = {};
    del_nodes.forEach(node => {
      if (!week_map[node.data.week_idx]) week_map[node.data.week_idx] = [];
      week_map[node.data.week_idx].push(node);
    });
    for (const [key, value] of Object.entries(week_map)) {
      this.arrangeOrder(api, value, null, 1, key, null, null);
    }
  }

  arrangeOrder = (api, dragged_nodes, overNode, pos, _from, _to, added_data_array) => {
    // pos: 0---Insert ahead of overNode; 1---Insert after overNode
    // _from (week) is null, added_data_array is valid: add node
    // _to (week) is null: delete node
    if (!_from && (dragged_nodes || !added_data_array)) return;  // Bad add-data call
    if (!_to && (overNode || added_data_array || !dragged_nodes)) return;  // Bad delete-node call

    let from_week_idx = parseInt(_from);
    let to_week_idx = parseInt(_to);
    if (!_from && !_to) return;  // Bad call with no week_idx

    let dragged_ids = []; 
    if (Array.isArray(dragged_nodes)) {
      dragged_ids = dragged_nodes.map(node => node.id);
    }
    let max_week_idx = Math.max(from_week_idx, to_week_idx);
    let total_rows = api.getDisplayedRowCount();
    // Go through all notes, collecting ids of from_week and to_week.
    let from_week_node_ids = [], to_week_node_ids = [];
    for (let idx = 0; idx < total_rows; idx++ ) {
      let node = api.getDisplayedRowAtIndex(idx);
      if (node.data.week_idx > max_week_idx) break;
      //console.log("onDragEnd: go through rows: node id="+node.id+" @week="+node.data.week_idx);
      if (dragged_ids.includes(node.id)) { //} === event.node.id) {
        //to_week_node_ids.push(node.id);
      } else if (node.data.week_idx == to_week_idx) { // DO NOT USE ===
        // In case from_week == to_week, we put all of them to to_week array!
        // So put to_week condition behind from_week condition
        to_week_node_ids.push(node.id);
      } else if (node.data.week_idx == from_week_idx) { // DO NOT USE ===
        // Use == instead of === because cell value was string
        from_week_node_ids.push(node.id);
      }
    }
    //console.log("From week "+from_week_idx+" to week "+to_week_idx);
    //console.log("From nodes: "+from_week_node_ids+" to nodes: "+to_week_node_ids);
    const transactions = {};
    // Check from_week ids array, clear order_in_week cell if this week have only one row
    const itemsToUpdate = [];
    if (_from) {
      if (from_week_node_ids.length === 1) {
        //event.api.getRowNode(from_week_node_ids[0]).setDataValue(tableFields.ORDER_IN_WEEK, null);
        const node = api.getRowNode(from_week_node_ids[0]);
        this.pushNodes(itemsToUpdate, [node], null, null);  // Clear order
      } else if (from_week_node_ids.length > 1) {
        for (let idx = 0; idx < from_week_node_ids.length; idx++ ) {
          const node = api.getRowNode(from_week_node_ids[idx]);
          this.pushNodes(itemsToUpdate, [node], from_week_idx, idx+1);
        }
      }
    }
    // Check to_weeks ids array
    let added_order_in_week = 0;
    if (_to) {
      if (to_week_node_ids.length < 1) {
        if (dragged_nodes && dragged_nodes.length > 0) {
          // Move to a new week with no progress
          this.pushNodes(itemsToUpdate, dragged_nodes, to_week_idx, dragged_nodes.length>1?1:null);
        }
      } else {
        let dest_order = 1;
        if (!overNode && pos === 0) {
          // Insert to the top of the dest week
          if (dragged_nodes && dragged_nodes.length > 0) {
            dest_order = this.pushNodes(itemsToUpdate, dragged_nodes, to_week_idx, dest_order);
          } else if(!_from) {
            // No _from means add row!
            added_order_in_week = 1;
          }
        }
        for (let idx = 0; idx < to_week_node_ids.length; idx++ ) {
          const node = api.getRowNode(to_week_node_ids[idx]);
          if (node === overNode) {
            // Check position to determine the order of inserting row datas
            if (pos === 0) {
              // Above
              if (dragged_nodes && dragged_nodes.length > 0) {
                dest_order = this.pushNodes(itemsToUpdate, dragged_nodes, to_week_idx, dest_order);
              } else if (!_from) {
                // No _from means add row!
                added_order_in_week = dest_order;
                dest_order += 1;
              }
              dest_order = this.pushNodes(itemsToUpdate, [node], null, dest_order);
            } else {
              // Below
              dest_order = this.pushNodes(itemsToUpdate, [node], null, dest_order);
              if (dragged_nodes && dragged_nodes.length > 0) {
                dest_order = this.pushNodes(itemsToUpdate, dragged_nodes, to_week_idx, dest_order);
              } else if (!_from) {
                // No _from means add row!
                added_order_in_week = dest_order;
                dest_order += 1;
              }
            }
          } else {
            // Set Order of rows before & after overNode
            dest_order = this.pushNodes(itemsToUpdate, [node], null, dest_order);
          }
        }
        if (!overNode && pos === 1) {
          // Insert to below of the dest week
          if (dragged_nodes && dragged_nodes.length > 0) {
            dest_order = this.pushNodes(itemsToUpdate, dragged_nodes, to_week_idx, dest_order);
          } else if(!_from) {
            // No _from means add row!
            added_order_in_week = dest_order;
          }
        }
      }
    } else {
      // _to is null means delete nodes
      transactions['remove'] = dragged_nodes.map(node => (node.data));
    }
    if (!_from) {
      added_data_array['order_in_week'] = added_order_in_week;
      transactions['add'] = [added_data_array];
    }
    if (itemsToUpdate && itemsToUpdate.length > 0) {
      transactions['update'] = itemsToUpdate;
    }
    api.applyTransaction(transactions);
  }

  onRowDragEnd = (event) => {
    if (this.lastHighlightedRow) {
      this.lastHighlightedRow.setHighlighted(null);
      this.lastHighlightedRow.onMouseLeave();
      this.lastHighlightedRow = null;
    }
    const { rowTop, rowHeight } = event.overNode;
    // Check if over the dragging row itself
    if (event.overIndex < 0 || event.node === event.overNode) return;
    let from_week_idx = event.node.data.week_idx;
    let to_week_idx = event.overNode.data.week_idx;
    let pos = ((event.y - rowTop) < rowHeight / 2) ?0:1;
    let dragged_nodes = event.nodes?event.nodes:[event.node];

    this.arrangeOrder(event.api, dragged_nodes, event.overNode, pos, from_week_idx, to_week_idx);
  };

  addRow = () => {
    const api = this.agGridRef.current.gridApi;
    if (!api) return;
    const nodes = api.getSelectedNodes();
    if (!nodes || nodes.length !== 1) return;
    //let idx = nodes[0].rowIndex;
    let row_data = nodes[0].data;
    //TODO: Select node index 0 will make the same dbid!
    const to_week = row_data.week_idx;
    let newRow = {id: this.insertDbId--, week_idx: to_week, chapter_name: row_data.chapter_name, teaching_mode: row_data.teaching_mode};
    //api.applyTransaction({ addIndex: idx+1, add: [newRow] });  // Insert after selected row.
    this.addRowArrangeOrder(api, nodes[nodes.length-1], newRow);
  };

  delRow = () => {
    const api = this.agGridRef.current.gridApi;
    if (!api) return;
    const nodes = api.getSelectedNodes();
    if (!nodes || nodes.length < 1) return;
    //api.applyTransaction({ remove: nodes.map(node => (node.data)) });
    this.delRowsArrangeOrder(api, nodes);
    // Remembet NodeIds of removed rows for quick saving
    this.setState({removedNodeIds: [...this.state.removedNodeIds, ...nodes.map(node => (node.id))]});
  };

  // CellClassRules will be verified (excute this func) before onCellValueChanged called!
  // params.data.isEdited will be aware for the whole row instead of a cell!
  /*
  cellClassRules = {
    'edited-cell': (params) => {
      let edited = !!params.data.isEdited && (params.colDef.field in params.data.isEdited);
      console.log("cellClassRules: "+params.colDef.field+" result="+String(edited));
      return edited;
    }
  };*/

  render() {
    const { department_id, labs: labItem, context: docContext, isLabItemOpen, editedRowCache, rowSelected, saveOption, createdItems } = this.state;
    const { t, title, color, isOpen, onClose, openedDocId, isSaveable, tableTitle, departments, docProps, docItems, userInfo, accessLevel, isNewDoc } = this.props;
    return (
      <>
        <Modal
          onClose={onClose}
          //finalFocusRef={this.btnRef}
          isOpen={isOpen}
          scrollBehavior="inside"
          closeOnOverlayClick={false}
          closeOnEsc={false}
          size="full"
        >
          <ModalOverlay />
          <ModalContent borderRadius="md">
            <ModalHeader>{title}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
            {
              (openedDocId>=0 || isNewDoc) &&
              <Flex direction="row" alignItems="center" wrap="wrap" px={5} py={2}>
                {
                  this.forms.map((form, index) => (
                    <FormControl key={form.id} isRequired={form.isRequired} minW={form.minW} maxW={form.maxW} m={2}>
                      <FormLabel><b>{form.label}</b></FormLabel>
                      <Input id={form.id} type={form.id} value={this.state[form.id]} onChange={this.onFormChanged}
                        borderColor={(docProps && this.state[form.id]===docProps[form.id])?"gray.200":"blue.500"}/>
                    </FormControl>
                  ))
                }
                {
                departments &&
                <FormControl key={tableFields.DEPARTMENT_ID} isRequired minW={280} m={2}>
                  <FormLabel><b>{t("progressdocScreen.form_label_departmentid")}</b></FormLabel>
                  <Select id={tableFields.DEPARTMENT_ID} variant="outline" value={department_id} onChange={this.onFormChanged}
                    borderColor={(docProps && department_id===docProps.department_id)?"gray.200":"blue.500"}>
                  {
                    departments.map((dep) => (
                      <option key={dep.id} value={dep.id} >{dep.name}</option>
                    ))
                  }
                  </Select>
                  <FormHelperText>{t("progressdocScreen.form_helper_departmentid")}</FormHelperText>
                </FormControl>
                }
              </Flex>
            }
            {
              !docItems && !isNewDoc &&
                <CircularProgress isIndeterminate color="blue" size="120px" width="100%"></CircularProgress>
            }
            {
              (docItems || isNewDoc) &&
              <EditableTable
                ref={this.agGridRef}
                flex={1}
                autoShrinkDomHeight
                minHeight={950}
                titleHeight={50}
                colLineHeight={15}
                defaultColWidth={180}
                title={tableTitle}
                color={color}
                headers={this.tableHeaders}
                data={isNewDoc?createdItems:docItems}
                pagePrevCaption={t("common.previous")}
                pageNextCaption={t("common.next")}
                initPageIndex={0}
                onCellValueChanged={this.onCellValueChanged}
                onCellDoubleClicked={this.onCellDoubleClicked}
                onCellEditingStarted={this.onCellEditingStarted}
                rowSelection="multiple"
                onSelectionChanged={this.onSelectionChanged}
                //getRowId={params => params.data.id} // NO USE, NEVER CALLED!
                getRowNodeId={data => data.id}
                onRowDragEnd={this.onRowDragEnd}
                // Sort by week and order-in-week, enable dragging by setting rowDragManaged to false
                rowDragManaged={false}
                onRowDragMove={this.onRowDragMove}
                onRowDragEnter={this.onRowDragEnter}
                additionalColumnState={{
                  state: [
                    { colId: tableFields.WEEK_IDX, sort: 'asc', sortIndex: 0 },
                    { colId: tableFields.ORDER_IN_WEEK, sort: 'asc', sortIndex: 1 },
                  ],
                  defaultState: {
                    sort: null
                  }
                }}
                //pageInputCaption={[t("kebiao.input_semester_week_prefix"), t("kebiao.input_semester_week_suffix")]}
                />
            }
            <LabitemDialog
              t={t}
              color={color}
              data={labItem}
              context={docContext}
              isOpen={isLabItemOpen}
              onClose={this.onLabItemClosed}
              departments={departments}
              title={t("labitemScreen.title")}
              isSaveable />
            </ModalBody>
            <ModalFooter>
              <Button variantColor="blue" mr={3} onClick={this.addRow} leftIcon={MdNoteAdd} isDisabled={rowSelected!==1}>{t("common.insert_row")}</Button>
              <Button variantColor="red" mr={3} onClick={this.delRow} leftIcon={MdDelete} isDisabled={rowSelected<1}>{t("common.remove_row")}</Button>
              <Button variantColor="green" mr={3} onClick={this.flashCells} isDisabled={Object.keys(editedRowCache).length<=0}>{t("common.flash_changed_cells")}</Button>
              { isSaveable && 
                <Button variantColor="red" mr={3} onClick={this.onSave} leftIcon={MdSave} /*isLoading={isSaving} loadingText={t("common.saving")}*/>{t("common.save")}</Button>
              }
              <Button onClick={onClose}>{t("common.close")}</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <CommonModal
          withCancel
          okColor={saveOption==='1'?'green':'red'}
          ref={this.commonModalRef}
          title={t("common.save")}
          titleBgColor={"white"}
          onResult={this.onSaveDialogResult}>
          <Text><b>{t("progressdocScreen.selector_save_dialog_title")}</b></Text>
          <br/>
          <RadioGroup onChange={this.onSaveOptionChanged} defaultValue='1' value={saveOption}>
            <Radio value='1' variantColor='green' size='lg'>
              {t("progressdocScreen.selector_save_doc_as_copy")}
            </Radio>
            <Radio value='2' variantColor='red' size='lg' isDisabled={docProps && userInfo && userInfo.id !== docProps.user_id && accessLevel >= role.PROFESSOR}>
              {t("progressdocScreen.selector_save_original_doc", {count: 5})}
            </Radio>
          </RadioGroup>
          <br/>
        </CommonModal>
      </>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    docProps: getDocProps(state),
    docItems: getDocItems(state),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    ...bindActionCreators(progressdocActions, dispatch),
    ...bindActionCreators(appActions, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(withTranslation()(ProgressdocDialog));

// TODO: 增加API获取此doc关联的课程数，用来决定保存是否使用另存为。 2. 增加创建新doc 3. 删除doc 4. 插入新行时指定周内序号  5. 载入时排序按week_idx+order_in_week两个
// 没拖动一行，就重新计算赋值from和to两周的order_in_week，简化当前算法！