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
              <FormControl id="course_name" isRequired minW={280} m={2}>
                <FormLabel><b>{t("progressdocScreen.form_label_coursename")}</b></FormLabel>
                <Input type="course_name" value={formObject["course_name"]}/>
              </FormControl>
              <FormControl id="short_name" isRequired minW={280} m={2}>
                <FormLabel><b>{t("progressdocScreen.form_label_shortname")}</b></FormLabel>
                <Input type="short_name" value={formObject["short_name"]}/>
              </FormControl>
              <FormControl id="description" minW={280} m={2}>
                <FormLabel><b>{t("progressdocScreen.form_label_description")}</b></FormLabel>
                <Input type="description" value={formObject["description"]}/>
              </FormControl>
              <FormControl id="department_id" isRequired maxW={100} m={2}>
                <FormLabel><b>{t("progressdocScreen.form_label_departmentid")}</b></FormLabel>
                <Input type="department_id" value={formObject["department_id"]}/>
              </FormControl>
              <FormControl id="total_hours" isRequired maxW={100} m={2}>
                <FormLabel><b>{t("progressdocScreen.form_label_totalhours")}</b></FormLabel>
                <Input type="total_hours" value={formObject["total_hours"]}/>
              </FormControl>
              <FormControl id="theory_hours" isRequired maxW={100} m={2}>
                <FormLabel><b>{t("progressdocScreen.form_label_theoryhours")}</b></FormLabel>
                <Input type="theory_hours" value={formObject["theory_hours"]}/>
              </FormControl>
              <FormControl id="lab_hours" isRequired maxW={100} m={2}>
                <FormLabel><b>{t("progressdocScreen.form_label_labhours")}</b></FormLabel>
                <Input type="lab_hours" value={formObject["lab_hours"]}/>
              </FormControl>
              <FormControl id="flex_hours" maxW={100} m={2}>
                <FormLabel><b>{t("progressdocScreen.form_label_flexhours")}</b></FormLabel>
                <Input type="flex_hours" value={formObject["flex_hours"]}/>
              </FormControl>
              <FormControl id="textbook" isRequired minW={280} m={2}>
                <FormLabel><b>{t("progressdocScreen.form_label_textbook")}</b></FormLabel>
                <Input type="textbook" value={formObject["textbook"]}/>
              </FormControl>
              <FormControl id="exam_type" isRequired minW={280} m={2}>
                <FormLabel><b>{t("progressdocScreen.form_label_examtype")}</b></FormLabel>
                <Input type="exam_type" value={formObject["exam_type"]}/>
              </FormControl>
              <FormControl id="comments" minW={280} m={2}>
                <FormLabel><b>{t("progressdocScreen.form_label_comments")}</b></FormLabel>
                <Input type="comments" value={formObject["comments"]}/>
              </FormControl>
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