import React, { Component } from 'react';
import { bindActionCreators } from "redux";
import { connect, useSelector } from "react-redux";
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
  } from "@chakra-ui/core"
import { MdEdit } from "react-icons/md"

import { EditableTable } from '../result-table/editable-table';
import { actions as progressdocActions, getDocContents, getSelectedDocId } from '../../redux/modules/progressdoc';

const DEFAULT_COLOR = "purple";
const CANCEL_COLOR = "gray";

class ProgressdocDialog extends Component {
  constructor(props) {
    super(props);
    const { t, color, schoolYear } = props;
    this.state = {
      isOpen: false,
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
      {name: t("progressdocScreen.items_header_labitem_id"), field: "labitem_id", width: 80},
      {name: t("progressdocScreen.items_header_teaching_mode"), field: "teaching_mode", editable: true},
      {name: t("progressdocScreen.items_header_comment"), field: "comment", editable: true},
      {name: t("progressdocScreen.items_header_docid"), field: "doc_id", width: 80},
    ];
    this.btnRef = React.createRef()
    this.forms = [
      {id: "course_name", label: t("progressdocScreen.form_label_coursename"), minW: 280, isRequired: true},
      {id: "short_name", label: t("progressdocScreen.form_label_shortname"), minW: 280, isRequired: true},
      {id: "description", label: t("progressdocScreen.form_label_description"), minW: 280, isRequired: false},
      {id: "department_id", label: t("progressdocScreen.form_label_departmentid"), maxW: 100, isRequired: true},
      {id: "total_hours", label: t("progressdocScreen.form_label_totalhours"), maxW: 100, isRequired: true},
      {id: "theory_hours", label: t("progressdocScreen.form_label_theoryhours"), maxW: 100, isRequired: true},
      {id: "lab_hours", label: t("progressdocScreen.form_label_labhours"), maxW: 100, isRequired: true},
      {id: "flex_hours", label: t("progressdocScreen.form_label_flexhours"), maxW: 100, isRequired: true},
      {id: "textbook", label: t("progressdocScreen.form_label_textbook"), minW: 280, isRequired: true},
      {id: "exam_type", label: t("progressdocScreen.form_label_examtype"), minW: 280, isRequired: true},
      {id: "comments", label: t("progressdocScreen.form_label_comments"), minW: 280, isRequired: false},
    ];
  }
  loadData = (doc_from_prop) => {
    let doc_object = doc_from_prop;
    if (!doc_object) {
      const { docDetails } = this.props;
      doc_object = docDetails;
    }
    let form_object = null;
    if (doc_object) {
      form_object = doc_object["props"];
    }
    if (!form_object || form_object === null) {
      form_object = {
        "id": "",
        "course_name": "",
        "short_name": "",
        "description": "",
        "department_id": "",
        "total_hours": "",
        "theory_hours": "",
        "lab_hours": "",
        "flex_hours": "",
        "textbook": "",
        "exam_type": "",
      };
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
      formObject: form_object,
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
    const { isOpen, progressItems, formObject } = this.state;
    if (nextProps.docDetails !== docDetails){
      console.log("shouldComponentUpdate, docDetails diff: isdefined? next="+!nextProps.docDetails+" cur="+!docDetails);
      this.loadData(nextProps.docDetails);
      return false;
    }
    if (nextProps.docId !== docId) {
      console.log("shouldComponentUpdate, props diff: "+nextProps.docId+" "+docId);
      return true;
    } else if (nextState.isOpen !== isOpen || nextState.progressItems !== progressItems || nextState.formObject !== formObject) {
      console.log("shouldComponentUpdate, nextState diff");
      return true;
    }
    return false;
  }
  
  render() {
    const { isOpen, progressItems, formObject } = this.state;
    const { t, title, color, btnText, isSaveable, tableTitle, docId,
      tablePages, onPageChanged, onCellClicked, onCellValueChanged } = this.props;
    const { tableHeaders, btnRef, loadDocDetails, onClose } = this;
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
          scrollBehavior="outside"
          closeOnOverlayClick={false}
          closeOnEsc={false}
        >
          <ModalOverlay />
          <ModalContent maxW="100rem">
            <ModalHeader>{title}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
            {
              formObject &&
              <Flex direction="row" alignItems="center" wrap="wrap" px={5} py={2}>
                {
                  this.forms.map((form, index) => (
                    <FormControl id={form.id} isRequired={form.isRequired} minW={form.minW} maxW={form.maxW} m={2}>
                      <FormLabel><b>{form.label}</b></FormLabel>
                      <Input type={form.id} defaultValue={formObject[form.id]}/>
                    </FormControl>
                  ))
                }
              </Flex>
            }
            {
              progressItems &&
              <EditableTable 
                flex={1}
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
                onCellClicked={onCellClicked}
                rowSelection="single"
                //pageInputCaption={[t("kebiao.input_semester_week_prefix"), t("kebiao.input_semester_week_suffix")]}
                />
            }
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