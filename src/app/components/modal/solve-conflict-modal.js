import React, { Component } from 'react';
import { Trans, withTranslation } from 'react-i18next';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Flex,
  Button,
  Text,
  Icon,
} from "@chakra-ui/core";

import { EditableTable } from '../result-table/editable-table';

class SolveConflictModalWrapped extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false
    }

    this.tableHeaders = [
      {name: "日期", field: "date", editable: true},
      {name: "时间", field: "time", editable: true},
      {name: "教研室", field: "jiaoyanshi"},
      {name: "班级", field: "class"},
      {name: "人数", field: "persons_count"},
      {name: "实验内容", field: "content", width: 150},
      {name: "教师", field: "teacher"},
      {name: "带教老师", field: "assistant", editable: true},
      {name: "实验室", field: "room", editable: true},
      {name: "批次", field: "group", width: 150, editable: true},
      {name: "备注", field: "remark", editable: true},
    ];
    this.tableData = [
      {date: "周一", time: "3,4节", jiaoyanshi: "儿科护理\n教研室", class: "2018级\n护理3班", persons_count: "21人",
        content: "外科护理[急救考核]", teacher: "刘诗诗", assistant: "王佳", room: "E612",
        group: "第1组: 1-30号", remark: ""},
    ];
  }

  show = () => {
    this.setState({
      isOpen: true,
    })
  }

  dismiss = () => {
    this.setState({
      isOpen: false,
    })
  }

  onClose = () => {
    const { onClose: onCloseCallback } = this.props;
    this.dismiss();
    if (onCloseCallback != null) {
      onCloseCallback();
    }
  }

  onCellClicked = (event) => {
    //console.log("onCellClicked, row: "+event.rowIndex+" col: "+event.colDef.index+" field: "+event.colDef.field+" value: "+event.value);
    const { onChooseLab, onChooseTeacher, onSelectGroup, onEditRemark } = this.props;
    const { colDef } = event;
    if ( !colDef.editable ) {
      return;
    }
    switch (colDef.field) {
      case "date":
        break;
      case "assistant":
        if (onChooseTeacher != null) {
          onChooseTeacher();
        }
        break;
      case "time":
      case "room":
        if (onChooseLab != null) {
          onChooseLab();
        }
        break;
      case "group":
        if (onSelectGroup != null) {
          onSelectGroup();
        }
        break;
      case "remark":
        if (onEditRemark != null) {
          onEditRemark();
        }
        break;
      default:
        break;
    }
  }

  render() {
    const { isOpen } = this.state;
    const { tableHeaders, tableData, onCellClicked } = this;
    const { conflictList, onChooseLab, onChooseTeacher, onSelectGroup, onEditRemark, ...other_props } = this.props;
    return (
      <Modal isOpen={isOpen} onClose={this.onClose} {...other_props}>
        <ModalOverlay />
        <ModalContent minWidth={tableHeaders.length*100+103} >
          <ModalHeader display="flex" flexDirection="row" alignItems="center" backgroundColor="orange.500">
            <Icon name="warning-2" color="red.500" marginRight="2" />
            <Text width="100%"><Trans>solveConflictModal.title</Trans></Text>
            <Flex flexDirection="row" alignItems="center" marginRight="10">
              <Button><Trans>common.previous</Trans></Button>
              <Text marginX="2">(1/3)</Text>
              <Button><Trans>common.next</Trans></Button>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody padding={0}>
            <EditableTable
              width="100%"
              height={105}
              colLineHeight={20}
              defaultColWidth={100}
              headers={tableHeaders}
              data={tableData}
              onCellClicked={onCellClicked}/>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }
}

const SolveConflictModal = withTranslation("translation", {withRef: true})(SolveConflictModalWrapped);
export { SolveConflictModal };
