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
import { actions as progressdocActions, getDocContents, getSelectedDocId } from '../../redux/modules/progressdoc';

const DEFAULT_COLOR = "purple";
const CANCEL_COLOR = "gray";

class LabitemDialog extends Component {
  constructor(props) {
    super(props);
    const { t, color } = props;
    this.state = {
      isOpen: false,
      depSelected: -1,
    };
    this.color = color ? color : DEFAULT_COLOR;

    this.btnRef = React.createRef()
    this.forms = [
      {id: "description", label: t("labitemScreen.form_label_keyword"), minW: 280, isRequired: true},
      {id: "name", label: t("labitemScreen.form_label_name"), minW: 280, isRequired: true},
      //{id: "department_id", label: t("labitemScreen.form_label_department"), minW: 280, isRequired: false},
      {id: "max_team_headcount", label: t("labitemScreen.form_label_max_team_headcount"), maxW: 100, isRequired: true},
      {id: "teacher_count", label: t("labitemScreen.form_label_teacher_count"), maxW: 100, isRequired: true},
      {id: "labdivision_id", label: t("labitemScreen.form_label_labdivision_id"), maxW: 100, isRequired: true},
    ];
  }

  static getDerivedStateFromProps(props, state) {
    console.log("getDerivedStateFromProps");
    let result = {isOpen: props.isOpen};
    if (!props.data) return result;
    // initialize the state with props by the same name id!
    if (props.data.id !== state.id) {
      result = {...result, ...props.data};
    }
    return result;
  }

  loadData = (labitem_from_prop) => {
    let labitem_object = labitem_from_prop;
    if (!labitem_object) {
      const { labitem : labitem_prop } = this.props;
      labitem_object = labitem_prop;
    }
    if (!labitem_object) {
      labitem_object = {
        "id": "-1",
        "description": "",
        "name": "",
        "department_id": -1,
        "max_team_headcount": 0,
        "teacher_count": 1,
        "labdivision_id": -1,
      };
    }

    this.setState({ 
      isOpen: true,
    });
  }

  onClose = () => {
    this.setState({ isOpen: false });
    const { onClose:onCloseCallback } = this.props;
    if (onCloseCallback != null) {
      onCloseCallback();
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { data } = this.props;
    const { isOpen, department_id, items } = this.state;
    
    if (nextProps.data !== data) {
      console.log("shouldComponentUpdate, nextProp data diff");
      return true;
    }
    if (nextState.isOpen !== isOpen /*|| nextState.items !== items || nextState.department_id !== department_id*/) {
      console.log("shouldComponentUpdate, nextState diff");
      return true;
    }

    for (let index = 0; index < this.forms.length; index++) {
      let form = this.forms[index];
      if (this.state[form.id] !== nextState[form.id]) {
        console.log("shouldComponentUpdate, FORMs diff:"+form.id);
        return true;
      }
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


  render() {
    const { isOpen, items, id, department_id } = this.state;
    const { t, title, color, btnText, isSaveable, departments } = this.props;
    const { btnRef, onClose, onFormChanged } = this;
    return (
      <>
        <Modal
          isCentered
          onClose={onClose}
          finalFocusRef={btnRef}
          isOpen={isOpen}
          scrollBehavior="outside"
          motionPreset='slideInBottom'
          closeOnOverlayClick={false}
          closeOnEsc={false}
        >
          <ModalOverlay />
          <ModalContent maxW="50rem" borderRadius="md">
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

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(LabitemDialog));