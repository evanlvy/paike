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
import { actions as progressdocActions, getDocContents, getSelectedDocId } from '../../redux/modules/progressdoc';

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
      {name: t("progressdocScreen.items_header_theory"), field: "theory_item_content", editable: true, width: 380},
      {name: t("progressdocScreen.items_header_theoryhours"), field: "theory_item_hours", editable: true, width: 80},
      {name: t("progressdocScreen.items_header_labitem"), field: "labitem_content", editable: true, width: 380},
      {name: t("progressdocScreen.items_header_labhours"), field: "labitem_hours", editable: true, width: 80},
      {name: t("progressdocScreen.items_header_labs"), field: "lab_alloc", width: 100, dataType: "lab_list"},
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
  }

  static getDerivedStateFromProps(props, state) {
    if (!props.docDetails) return null;
    // initialize the state with props by the same name id!
    if (props.docDetails.props.id !== state.id) {
      return props.docDetails["props"];
    }
    return null;
  }

  loadData = (doc_from_prop) => {
    let doc_object = doc_from_prop;
    if (!doc_object) {
      const { docDetails } = this.props;
      doc_object = docDetails;
    }

    let progress_items = null;
    let progress_items_array = null;
    if (doc_object) {
      progress_items = doc_object["items"];
    }
    if (!progress_items || progress_items === null) {
      progress_items_array = [{
        "id": "-1",
        "week_idx": 1,
        "chapter_name": "",
        "theory_item_content": "",
        "theory_item_hours": 0,
        "labitem_content": "",
        "labitem_hours": 0,
        "teaching_mode": "",
        "stage_bias": 0,
        "comment": "",
        "labitem_id": -1,
        "doc_id": -1,
      }];
    }
    else {
      progress_items_array = Object.keys(progress_items).map((key) => {
        let item_obj = progress_items[key]
        return Object.defineProperty(item_obj, 'id', {value: key})
      });
    }
    this.setState({ 
      isOpen: true,
      progressItems: progress_items_array,
    });
  }

  onClose = () => {
    this.setState({ isOpen: false });
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
    const { docId, docDetails } = this.props;
    const { isOpen, progressItems, department_id, isLabItemOpen } = this.state;
    if (nextProps.docDetails !== docDetails){
      console.log("shouldComponentUpdate, docDetails diff: isdefined? next="+!nextProps.docDetails+" cur="+!docDetails);
      this.loadData(nextProps.docDetails);
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
    } else if (nextState.isOpen !== isOpen || nextState.progressItems !== progressItems 
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
    if (event) {
      this.setState({
        labItem: event.data.lab_alloc,
        isLabItemOpen: true
      });
    }
  }

  onLabItemClosed = (event) => {
    this.setState({
      isLabItemOpen: false
    });
  }

  render() {
    const { isOpen, progressItems, id, department_id, labItem, isLabItemOpen } = this.state;
    const { t, title, color, btnText, isSaveable, tableTitle, docId, departments,
      tablePages, onPageChanged, onCellValueChanged } = this.props;
    const { tableHeaders, btnRef, loadDocDetails, onClose, onFormChanged, onCellDoubleClicked, onLabItemClosed } = this;
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
          <ModalContent maxW="100rem">
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
                        borderColor={this.state[form.id]!==this.props.docDetails.props[form.id]?"blue.500":"gray.200"}/>
                    </FormControl>
                  ))
                }
                {
                departments &&
                <FormControl key="department_id" isRequired minW={280} m={2}>
                  <FormLabel><b>{t("progressdocScreen.form_label_departmentid")}</b></FormLabel>
                  <Select id="department_id" variant="outline" value={department_id} onChange={onFormChanged}
                    borderColor={department_id!==this.props.docDetails.props.department_id?"blue.500":"gray.200"}>
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
              progressItems &&
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
                data={progressItems}
                pageNames={tablePages}
                pagePrevCaption={t("common.previous")}
                pageNextCaption={t("common.next")}
                onResultPageIndexChanged={onPageChanged}
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
                  isOpen={isLabItemOpen}
                  onClose={onLabItemClosed}
                  departments={departments}
                  title={t("labitemScreen.form_title")}
                  isSaveable />
            </ModalBody>
            <ModalFooter>
              { isSaveable && 
                <Button variantColor="red" mr={3}>{t("common.save")}</Button>
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
    docDetails: getDocContents(state),
    prevDocId: getSelectedDocId(state),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    ...bindActionCreators(progressdocActions, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(ProgressdocDialog));