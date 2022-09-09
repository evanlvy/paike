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
    Box,
    Select,
  } from "@chakra-ui/core"
import { MdEdit, MdNoteAdd, MdSave } from "react-icons/md"

import { EditableTable } from '../result-table/editable-table';
import LabitemDialog from './labitem-dialog';
import { actions as progressdocActions, getDocProps, getDocItems, getOpenedDocId, parseImmutableLocs } from '../../redux/modules/progressdoc';

const DEFAULT_COLOR = "purple";
const CANCEL_COLOR = "gray";

class ProgressdocDialog extends Component {
  constructor(props) {
    super(props);
    const { t, color } = props;
    this.state = {
      isLabItemOpen: false,
      isOpen: false,
      isSaving: false,
      rowSelected: -1,
      editedRowCache: {},
    };
    this.color = color ? color : DEFAULT_COLOR;
    this.tableHeaders = [
      {name: t("progressdocScreen.items_header_order"), field: "ord", rowDrag: true, width: 80},
      {name: t("progressdocScreen.items_header_id"), field: "id", width: 80},
      {name: t("progressdocScreen.items_header_weekidx"), field: "week_idx", editable: true, width: 80, dataType: "increasing_value"},
      {name: t("progressdocScreen.items_header_chapter_name"), field: "chapter_name", editable: true},
      {name: t("progressdocScreen.items_header_theory"), field: "theory_item_content", editable: true, width: 380, fn_disable: this.theory_should_disable},
      {name: t("progressdocScreen.items_header_theoryhours"), field: "theory_item_hours", editable: true, width: 80, fn_disable: this.theory_should_disable},
      {name: t("progressdocScreen.items_header_labitem"), field: "labitem_content", editable: true, width: 380, fn_disable: this.lab_should_disable},
      {name: t("progressdocScreen.items_header_labhours"), field: "labitem_hours", editable: true, width: 80, fn_disable: this.lab_should_disable},
      {name: t("progressdocScreen.items_header_labs"), field: "lab_alloc", width: 100, dataType: "lab_list", fn_disable: this.lab_should_disable},
      {name: t("progressdocScreen.items_header_teaching_mode"), field: "teaching_mode", editable: true},
      {name: t("progressdocScreen.items_header_comment"), field: "comment", editable: true},
      //{name: t("progressdocScreen.items_header_docid"), field: "doc_id", width: 80},
    ];
    this.btnRef = React.createRef()
    this.forms = [
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
    this.gridApi = null;
  }

  static getDerivedStateFromProps(props, state) {
    let result = {};
    if (props.prevDocId) {
      if (props.prevDocId >= 0 && !state.isOpen) result = {isOpen: true};
      else if (props.prevDocId < 0 && state.isOpen) result = {isOpen: false};
    }
    if (!props.docProps) return result;
    // initialize the state with props by the same name id!
    if (props.docProps.id !== state.id) {
      result = {result, ...props.docProps, editedRowCache:{}, rowSelected: -1}//props.docDetails["props"];
    }
    return result;
  }

  lab_should_disable = (progress_item) => {
    if (!progress_item) {return false;}
    if (!progress_item["theory_item_content"] && !progress_item["theory_item_hours"]) return false;
    if ((!progress_item["theory_item_content"] || progress_item["theory_item_content"].length === 0) && progress_item["theory_item_hours"] <= 0) return false;
    return true;
  }

  theory_should_disable = (progress_item) => {
    if (!progress_item) {return false;}
    if (!progress_item["labitem_content"] && !progress_item["labitem_hours"]) return false;
    if ((!progress_item["labitem_content"] || progress_item["labitem_content"].length === 0) && progress_item["labitem_hours"] <= 0) return false;
    return true;
  }

  onClose = () => {
    this.props.closeDoc();
    //this.setState({ isOpen: false });
  }

  loadDocDetails = (docId) => {
    console.log("loadDocDetails: "+docId);
    if (!docId || docId < 1) {
      return;
    }
    this.props.fetchDoc(docId);
    if (this.props.prevDocId === docId) {
      this.setState({
        isOpen: true,
      });
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { docId, docProps, docItems } = this.props;
    //const { isOpen, department_id, isLabItemOpen, editedRowCache } = this.state;
    if (nextProps.docProps !== docProps){
      console.log("shouldComponentUpdate, docProps");
      this.setState({
        isOpen: true,
      });
      return true;
    }
    if (nextProps.docItems !== docItems) {
      console.log("shouldComponentUpdate, docItems");
      this.setState({
        rowSelected: -1,
        editedRowCache: {},
      });
      return true;
    }
    /*for (let index = 0; index < this.forms.length; index++) {
      let form = this.forms[index];
      if (this.state[form.id] !== nextState[form.id]) {
        console.log("shouldComponentUpdate, FORMs diff:"+form.id);
        return true;
      }
    }*/
    if (nextProps.docId !== docId) {
      console.log("shouldComponentUpdate, props diff: "+nextProps.docId+" "+docId);
      return true;
    }
    if (nextState !== this.state) {
      console.log("shouldComponentUpdate, nextState diff");
      return true;
    }
    /*if (nextState.isOpen !== isOpen || nextState.editedRowCache !== editedRowCache
      || nextState.department_id !== department_id || nextState.isLabItemOpen !== isLabItemOpen) {
      console.log("shouldComponentUpdate, nextState diff");
      return true;
    }*/
    return false;
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
    if (event && event.column.colId === "lab_alloc" && !event.data.theory_item_hours && !event.data.theory_item_content) {
      let lab_alloc = event.data.lab_alloc;
      let short_names = parseImmutableLocs(lab_alloc.items);
      this.setState({
        labs: {...lab_alloc, locations:short_names},
        context: {
          doc_course_name: this.state.course_name,
          doc_short_name: this.state.short_name,
          doc_department_id: this.state.department_id,
          doc_lab_content: event.data.labitem_content,
          rowIndex: event.rowIndex,
          progressId: event.data.id,
        },
        isLabItemOpen: true,
      });
    }
  }

  onCellValueChanged = (params) => {
    this.gridApi = params.api;
    let dest_col = params.colDef.field;
    console.log("onCellValueChanged: newValue:"+JSON.stringify(params.newValue)+" oldValue:"+params.oldValue);
    if (params.oldValue && params.newValue && params.newValue === params.oldValue) {
      // Compare value with no change
      return;
    }
    /*if (dest_col in this.props.docItems[params.rowIndex]) {
      let original_in_state = this.props.peekDocItem(params.data.id, dest_col);
      if (params.newValue == original_in_state) {
        console.log("onCellValueChanged: no change found compared with props! Clear from cache!");
        // Clear the edit cache
        if (params.rowIndex in this.state.editedRowCache) {
          this.setState({editedRowCache: {...this.state.editedRowCache, 
            [params.rowIndex]: {...this.state.editedRowCache[params.rowIndex], [dest_col]: undefined }}});
        }
        return;
      }
    }*/
    if (dest_col === 'lab_alloc') dest_col = 'labitem_id';
    this.setState({editedRowCache: {...this.state.editedRowCache, 
      [params.rowIndex]: {...this.state.editedRowCache[params.rowIndex], id: params.data.id, [dest_col]: params.newValue}}});
  }

  onCellEditingStarted  = (params) => {
    this.gridApi = params.api;
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
    if (!this.gridApi || !this.state.editedRowCache) return;
    Object.keys(this.state.editedRowCache).forEach(function(idx){
      let row = this.gridApi.getDisplayedRowAtIndex(parseInt(idx));
      if (row) {
        let cols = Object.keys(this.state.editedRowCache[idx]);
        if (cols.includes("labitem_id")) {
          cols.push("lab_alloc");
        }
        this.gridApi.flashCells({ rowNodes: [row], columns: cols });
      }
    }, this);
  }

  onLabItemClosed = (params) => {
    if (params && 'id' in params && 'rowIndex' in params) {
      // Update labitem_id to row cache
      this.setState({editedRowCache: {...this.state.editedRowCache, 
        [params.rowIndex]: {...this.state.editedRowCache[params.rowIndex], id: params.progressId, 'labitem_id': params.id}}});
      // Update progress list table states
      this.props.fetchLabitem(params.id, params.progressId);
      //if ('lab_locs' in params) {
        // Update the locations on list
        //this.props.updateLabItemInProgressList(params.progressId, params.lab_locs);
        /*if (this.gridApi){
          let cellparams = {
            force: true,
            rowNode: this.gridApi.getDisplayedRowAtIndex(params.rowIndex),
            //columns: ["lab_alloc"],
          };
          this.callRefreshAfterMillis(cellparams, 1000, this.gridApi);
        }*/
      //}
    }
    this.setState({
      isLabItemOpen: false
    });
  }

  /*callRefreshAfterMillis = (params, millis, gridApi) => {
    setTimeout(function () {
      gridApi.redrawRows();
    }, millis);
  }*/

  // TBD: Add Create-new-line button.
  // Add order to database for progress items display order.
  // Can modify row order
  onSave = () => {
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
  }

  onSelectionChanged = (params) => {
    this.gridApi = params.api;
    if (!this.gridApi) return;
    const rowCount = this.gridApi.getSelectedNodes().length;
    this.setState({
      rowSelected: rowCount
    });
  };

  addRow = () => {
    if (!this.gridApi) return;
    const rows = this.gridApi.getSelectedNodes();
    if (!rows || rows.length != 1) return;
    let idx = rows[0].rowIndex;
    let row_data = rows[0].data;
    let newRow = {id: -1, week_idx: row_data.week_idx, chapter_name: row_data.chapter_name, teaching_mode: row_data.teaching_mode};
    //this.gridApi.addRow(newRow);
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
    const { isOpen, id, department_id, labs: labItem, context: docContext, isLabItemOpen, editedRowCache, rowSelected, isSaving } = this.state;
    const { t, title, color, btnText, isSaveable, tableTitle, docId, departments, docProps, docItems } = this.props;
    const { tableHeaders, btnRef, loadDocDetails, onClose, onSave, onFormChanged, onCellDoubleClicked, onSelectionChanged,
      onLabItemClosed, onCellValueChanged, onCellEditingStarted, flashCells, addRow } = this;
    return (
      <>
        <Button leftIcon={MdEdit} variantColor="red" variant="solid" mt={3}  ref={btnRef} onClick={(e) => {
          loadDocDetails(docId);
        }}>
          {btnText}
        </Button>
        <Modal
          onClose={onClose}
          finalFocusRef={btnRef}
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
              id &&
              <Flex direction="row" alignItems="center" wrap="wrap" px={5} py={2}>
                {
                  this.forms.map((form, index) => (
                    <FormControl key={form.id} isRequired={form.isRequired} minW={form.minW} maxW={form.maxW} m={2}>
                      <FormLabel><b>{form.label}</b></FormLabel>
                      <Input id={form.id} type={form.id} value={this.state[form.id]} onChange={onFormChanged}
                        borderColor={(docProps && this.state[form.id]===docProps[form.id])?"gray.200":"blue.500"}/>
                    </FormControl>
                  ))
                }
                {
                departments &&
                <FormControl key="department_id" isRequired minW={280} m={2}>
                  <FormLabel><b>{t("progressdocScreen.form_label_departmentid")}</b></FormLabel>
                  <Select id="department_id" variant="outline" value={department_id} onChange={onFormChanged}
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
              docItems &&
              <EditableTable 
                flex={1}
                autoShrinkDomHeight
                minHeight={950}
                titleHeight={50}
                colLineHeight={15}
                defaultColWidth={180}
                title={tableTitle}
                color={color}
                headers={tableHeaders}
                data={docItems}
                orderbyAsc={'ord'}
                rowDragManaged={true}
                pagePrevCaption={t("common.previous")}
                pageNextCaption={t("common.next")}
                initPageIndex={0}
                onCellValueChanged={onCellValueChanged}
                onCellDoubleClicked={onCellDoubleClicked}
                onCellEditingStarted={onCellEditingStarted}
                rowSelection="multiple"
                onSelectionChanged={onSelectionChanged}
                //pageInputCaption={[t("kebiao.input_semester_week_prefix"), t("kebiao.input_semester_week_suffix")]}
                />
            }
              <LabitemDialog
                  t={t}
                  color={color}
                  data={labItem}
                  context={docContext}
                  isOpen={isLabItemOpen}
                  onClose={onLabItemClosed}
                  departments={departments}
                  title={t("labitemScreen.title")}
                  isSaveable />
            </ModalBody>
            <ModalFooter>
              <Button variantColor="blue" mr={3} onClick={addRow} leftIcon={MdNoteAdd} isDisabled={rowSelected!=1}>{t("common.insert_row")}</Button>
              <Button variantColor="green" mr={3} onClick={flashCells} isDisabled={Object.keys(editedRowCache).length<=0}>{t("common.flash_changed_cells")}</Button>
              { isSaveable && 
                <Button variantColor="red" mr={3} onClick={onSave} leftIcon={MdSave} /*isLoading={isSaving} loadingText={t("common.saving")}*/>{t("common.save")}</Button>
              }
              <Button onClick={onClose}>{t("common.close")}</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    docProps: getDocProps(state),
    docItems: getDocItems(state),
    prevDocId: getOpenedDocId(state),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    ...bindActionCreators(progressdocActions, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(ProgressdocDialog));