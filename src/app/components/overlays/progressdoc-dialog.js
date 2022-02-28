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
import { MdEdit } from "react-icons/md"

import { EditableTable } from '../result-table/editable-table';
import LabitemDialog from './labitem-dialog';
import { actions as progressdocActions, getDocProps, getDocItems, getOpenedDocId } from '../../redux/modules/progressdoc';

const DEFAULT_COLOR = "purple";
const CANCEL_COLOR = "gray";

class ProgressdocDialog extends Component {
  constructor(props) {
    super(props);
    const { t, color } = props;
    this.state = {
      isLabItemOpen: false,
      isOpen: false,
      depSelected: -1,
    };
    this.color = color ? color : DEFAULT_COLOR;
    this.tableHeaders = [
      {name: t("progressdocScreen.items_header_id"), field: "id", width: 80},
      {name: t("progressdocScreen.items_header_weekidx"), field: "week_idx", editable: true, width: 80},
      {name: t("progressdocScreen.items_header_chapter_name"), field: "chapter_name", editable: true},
      {name: t("progressdocScreen.items_header_theory"), field: "theory_item_content", editable: true, width: 380, fn_disable: this.theory_should_disable},
      {name: t("progressdocScreen.items_header_theoryhours"), field: "theory_item_hours", editable: true, width: 80, fn_disable: this.theory_should_disable},
      {name: t("progressdocScreen.items_header_labitem"), field: "labitem_content", editable: true, width: 380, fn_disable: this.lab_should_disable},
      {name: t("progressdocScreen.items_header_labhours"), field: "labitem_hours", editable: true, width: 80, fn_disable: this.lab_should_disable},
      {name: t("progressdocScreen.items_header_labs"), field: "lab_alloc", width: 100, dataType: "lab_list", fn_disable: this.lab_should_disable},
      {name: t("progressdocScreen.items_header_teaching_mode"), field: "teaching_mode", editable: true},
      {name: t("progressdocScreen.items_header_comment"), field: "comment", editable: true},
      {name: t("progressdocScreen.items_header_docid"), field: "doc_id", width: 80},
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
    this.editedRowCache = {};
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
      result = {result, ...props.docProps}//props.docDetails["props"];
    }
    return result;
  }

  lab_should_disable = (progress_item) => {
    if (!progress_item) {return false;}
    if (!progress_item["theory_item_content"] && !progress_item["theory_item_hours"]) return false;
    if (progress_item["theory_item_content"].length === 0 && progress_item["theory_item_hours"] <= 0) return false;
    return true;
  }

  theory_should_disable = (progress_item) => {
    if (!progress_item) {return false;}
    if (!progress_item["labitem_content"] && !progress_item["labitem_hours"]) return false;
    if (progress_item["labitem_content"].length === 0 && progress_item["labitem_hours"] <= 0) return false;
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
    const { isOpen, department_id, isLabItemOpen } = this.state;
    if (nextProps.docProps !== docProps){
      console.log("shouldComponentUpdate, docProps");
      this.setState({
        isOpen: true,
      });
      return true;
    }
    if (nextProps.docItems != docItems) {
      console.log("shouldComponentUpdate, docItems");
      return false;
    }
    for (let index = 0; index < this.forms.length; index++) {
      let form = this.forms[index];
      if (this.state[form.id] !== nextState[form.id]) {
        console.log("shouldComponentUpdate, FORMs diff:"+form.id);
        return true;
      }
    }
    if (nextProps.docId !== docId) {
      console.log("shouldComponentUpdate, props diff: "+nextProps.docId+" "+docId);
      return true;
    } else if (nextState.isOpen !== isOpen 
      || nextState.department_id !== department_id || nextState.isLabItemOpen !== isLabItemOpen) {
      console.log("shouldComponentUpdate, nextState diff");
      return true;
    }
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
      this.setState({
        labs: event.data.lab_alloc,
        context: {
          doc_course_name: this.state.course_name,
          doc_short_name: this.state.short_name,
          doc_department_id: this.state.department_id,
          doc_lab_content: event.data.labitem_content,
        },
        isLabItemOpen: true,
      });
    }
  }

  onCellValueChanged = (params) => {
    let dest_col = params.colDef.field;
    console.log("onCellValueChanged: newValue:"+JSON.stringify(params.newValue)+" oldValue:"+params.oldValue+" ColRef:"+JSON.stringify(params.colDef));
    console.log("onCellValueChanged: cell obj:"+JSON.stringify(params.data[dest_col]));
    if (params.oldValue && params.newValue.length > 1 && params.newValue === params.oldValue) {
      // Compare value with no change
      return;
    }
    let column = params.column.colDef.field;
    params.column.colDef.cellStyle = { 'background-color': '#FED7E2' };
    params.api.refreshCells({
        force: true,
        columns: [column],
        rowNodes: [params.node]
    });
    if (!(params.rowIndex in this.editedRowCache)) {
      this.editedRowCache[params.rowIndex] = {};
    }
    this.editedRowCache[params.rowIndex]["id"] = params.data.id;
    this.editedRowCache[params.rowIndex][dest_col] = params.newValue;
    console.log(this.editedRowCache);
    //this.props.setRowChanged(this.props.selectedDataId, params.data["id"], dest_col, params.data[dest_col]);
  }

  onLabItemClosed = (event) => {
    this.setState({
      isLabItemOpen: false
    });
  }

  // TBD: Add Create-new-line button.
  // Add order to database for progress items display order.
  // Can modify row order
  onSave = () => {
    
  }

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
    const { isOpen, id, department_id, labs: labItem, context: docContext, isLabItemOpen } = this.state;
    const { t, title, color, btnText, isSaveable, tableTitle, docId, departments, docProps, docItems } = this.props;
    const { tableHeaders, btnRef, loadDocDetails, onClose, onSave, onFormChanged, onCellDoubleClicked, onLabItemClosed, onCellValueChanged } = this;
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
                pagePrevCaption={t("common.previous")}
                pageNextCaption={t("common.next")}
                initPageIndex={0}
                onCellValueChanged={onCellValueChanged}
                onCellDoubleClicked={onCellDoubleClicked}
                rowSelection="single"
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
              { isSaveable && 
                <Button variantColor="red" mr={3} onClick={onSave}>{t("common.save")}</Button>
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