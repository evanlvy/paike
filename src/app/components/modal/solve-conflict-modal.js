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

import { EditItemModal } from './edit-item-modal';
import { ChooseItemModal } from './choose-item-modal';
import { SchedTableModal } from './sched-table-modal';
import { EditableTable } from '../result-table/editable-table';

import { buildLabSchedId } from '../../redux/modules/lab';

const CHOOSE_TIME_TITLE_BG = "orange.400";
const CHOOSE_LAB_TITLE_BG = "blue.500";

class SolveConflictModalWrapped extends Component {
  constructor(props) {
    super(props);
    const { t } = props;
    this.state = {
      isOpen: false,
      selectItem: null,
      schedTableTitle: "",
      schedTableTitleBg: CHOOSE_TIME_TITLE_BG,
      schedTableData: [],
    }

    this.tableHeaders = [
      {name: t("kebiao.date"), field: "date", editable: true},
      {name: t("kebiao.time"), field: "time", editable: true},
      {name: t("kebiao.jys"), field: "jys"},
      {name: t("kebiao.banji"), field: "banji"},
      //{name: t("kebiao.student_count"), field: "student_count"},
      {name: t("kebiao.shixun_content"), field: "shixun_name", width: 150},
      {name: t("kebiao.teacher"), field: "teacher"},
      {name: t("kebiao.shixun_teacher"), field: "shixun_teacher", editable: true},
      {name: t("kebiao.lab"), field: "lab", editable: true},
      {name: t("kebiao.note"), field: "note", editable: true},
    ];

    this.conflictList = [];
    this.labList = [];

    this.schedTableFieldNames = [
      "sched_name", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"
    ];
    this.schedTableRowNames = [
      t("kebiao.sched_12")+t("kebiao.sched_unit"),
      t("kebiao.sched_34")+t("kebiao.sched_unit"),
      t("kebiao.sched_67")+t("kebiao.sched_unit"),
      t("kebiao.sched_89")+t("kebiao.sched_unit"),
      t("kebiao.sched_1011")+t("kebiao.sched_unit"),
      t("kebiao.sched_1213")+t("kebiao.sched_unit"),
    ];

    this.editRemarkModalRef = React.createRef();
    this.chooseLabModalRef = React.createRef();
    this.schedTableModalRef = React.createRef();
  }

  showConflict = (weekIndex, selectItem, conflictList) => {
    if (!selectItem) {
      console.log("Can't show empty data in SolveConflictModal");
      return;
    }
    console.log("Solve conflict: "+JSON.stringify(selectItem));
    this.selectWeek = weekIndex;
    this.selectItemIndex = 0;
    if (conflictList) {
      this.selectItemIndex = conflictList.findIndex(item => item.data.id === selectItem.data.id);
      this.conflictList = conflictList;
    } else {
      this.conflictList = [selectItem];
    }
    this.setState({
      selectItem: selectItem
    });
    this.show();
  }

  show = () => {
    this.setState({
      isOpen: true,
    });
  }

  dismiss = () => {
    this.setState({
      isOpen: false,
    })
  }

  close = (confirm, result) => {
    const { onResult } = this.props;
    if (onResult != null) {
      if (!onResult(confirm, result)) {
        return;
      }
    }
    this.dismiss();
  }

  onClose = () => {
    this.close(false);
  }

  onCancelBtnClicked = () => {
    this.close(false);
  }

  onOKBtnClicked = () => {
    this.close(true, this.state.selectItem);
  }

  buildData = () => {
    this.buildLabList();
  }

  buildLabList = () => {
    const { selectWeek } = this;
    const { selectItem } = this.state;
    const { labs, labSched } = this.props;
    if (!labs || labs.length === 0) {
      return;
    }
    this.labList = labs.map(labInfo => {
        const labSchedId = buildLabSchedId(labInfo.id, 3, selectWeek);
        const labSchedInfo = labSched.get(labSchedId);
        if (labSchedInfo) {
          const selectItemData = selectItem.data;
          // console.log("labSchedInfo: "+JSON.stringify(labSchedInfo));
          // console.log("selectItemData: "+JSON.stringify(selectItemData));
          const schedInDay = labSchedInfo.schedules[selectItemData.week_day_index];
          if (schedInDay && schedInDay[selectItemData.hour_index] && schedInDay[selectItemData.hour_index].length > 0) {
            labInfo.occupied = "";
          }
        }
        return labInfo;
    });
    //console.log("LabList: "+JSON.stringify(this.labList));
  }

  // Event
  onCellClicked = (e) => {
    //console.log("onCellClicked, row: "+event.rowIndex+" col: "+event.colDef.index+" field: "+event.colDef.field+" value: "+event.value);
    const { colDef } = e.event;
    if ( !colDef.editable ) {
      return;
    }
    switch (colDef.field) {
      case "date":
        break;
      case "shixun_teacher":
        break;
      case "time":
        break;
      case "lab":
        this.onEditLab();
        break;
      case "note":
        this.onEditRemark();
        break;
      default:
        break;
    }
  }

  onPrevConflict = () => {
    const { onConflictChanged } = this.props;
    if (this.selectItemIndex > 0) {
      this.selectItemIndex--;
      const selItem = this.conflictList[this.selectItemIndex];
      this.setState({
        selectItem: selItem
      });
      if (onConflictChanged) {
        onConflictChanged(selItem);
      }
    }
  }

  onNextConflict = () => {
    const { onConflictChanged } = this.props;
    if (this.selectItemIndex < this.conflictList.length-1) {
      this.selectItemIndex++;
      const selItem = this.conflictList[this.selectItemIndex];
      this.setState({
        selectItem: selItem
      });
      if (onConflictChanged) {
        onConflictChanged(selItem);
      }
    }
  }

  // Edit Lab
  onEditLab = () => {
    this.chooseLabModalRef.current.show();
  }

  onLabSelect = (index) => {
    const { t, labs } = this.props;
    this.selectLab = labs[index];
    console.log("onLabSelect: "+this.selectLab.title);
    const labSchedTable = this.buildLabSchedTable(this.selectLab);

    this.setState({
      schedTableTitle: t("chooseLabModal.title_labinfo_template", {lab_name: this.selectLab.title}),
      schedTableTitleBg: CHOOSE_LAB_TITLE_BG,
      schedTableData: labSchedTable
    });
    this.schedTableModalRef.current.show();
    this.schedTableModalResultCb = this.onConfirmLabChooseResult;
    this.schedTableModalBackRef = this.chooseLabModalRef;
    this.chooseLabModalRef.current.dismiss();
  }

  buildShiXunName = (shixunId) => {
    const { shixunByIds } = this.props;
    const shixunInfo = shixunByIds.get(shixunId)
    return shixunInfo.labitem_name+" ("+shixunInfo.lab_teacher+")";
  }

  buildLabSchedTable = (lab) => {
    const { t, labSched } = this.props;
    const { selectWeek, schedTableFieldNames, schedTableRowNames} = this;
    const { selectItem } = this.state;
    const selectConflictData = selectItem.data;
    const labSchedId = buildLabSchedId(lab.id, 3, selectWeek);
    console.log("Get shixunInfo of "+labSchedId);
    const shixunInfo = labSched.get(labSchedId);
    let resultList = [];
    for (let i=1; i < schedTableFieldNames.length; i++) {
      const shixunInDay = shixunInfo ? shixunInfo.schedules[i-1] : null;
      for (let j=0; j < schedTableRowNames.length; j++) {
        if (!resultList[j]) {
          resultList[j] = {};
          resultList[j][schedTableFieldNames[0]] = schedTableRowNames[j];
        }
        let names = [];
        let hourIndex = j;
        const shixunHourList = shixunInDay ? shixunInDay[hourIndex] : [];
        if (shixunHourList && shixunHourList.length > 0) {
          shixunHourList.forEach(shixunId => {
            let name = this.buildShiXunName(shixunId);
            if (name) {
              names.push(name);
            }
          });
        } else {
          names.push(t("common.null"));
        }
        const needDisabled = (selectConflictData.week_day_index !== i-1 || selectConflictData.hour_index !== hourIndex);
        resultList[j][schedTableFieldNames[i]] = { titles: names, disabled: needDisabled, data: shixunHourList };
      }
    }
    console.log("ResultList: "+JSON.stringify(resultList));
    return resultList;
  }

  onConfirmLabChooseResult = (confirm) => {
    if (confirm) {
      let selItem = {...this.state.selectItem};
      const { selectLab } = this;
      const selectData = selItem.data;
      selItem.lab = selectLab.title;
      selectData.lab_location = selectLab.title;
      selectData.lab_id = selectLab.id;
      this.setState({
        selectItem: selItem
      });
    } else {
      if (this.schedTableModalBackRef) {
        this.schedTableModalBackRef.current.show();
      }
    }
    return true;
  }

  // Edit Remark
  onEditRemark = () => {
    const { selectItem } = this.state;
    this.editRemarkModalRef.current.show(selectItem.note);
  }

  onEditRemarkResult = (confirm, result) => {
    if (confirm) {
      console.log("onEditRemarkResult: "+result);
      const selItem = {...this.state.selectItem};
      selItem.note = result;
      this.setState({
        selectItem: selItem
      })
    }
    return true;
  }

  render() {
    const { isOpen, selectItem, schedTableTitle, schedTableTitleBg, schedTableData } = this.state;
    const { t, curCenter, labs, labSched, banjiSched, onConflictChanged, ...other_props } = this.props;
    this.buildData();
    const { tableHeaders, selectItemIndex, conflictList, labList,
      onCellClicked, onPrevConflict, onNextConflict,
      onEditRemarkResult, onLabSelect, schedTableModalResultCb } = this;
    const tableData = [selectItem];
    //console.log("Conflict Select Item: "+JSON.stringify(selectItem));
    return (
      <Flex width="100%" height="100%" align="center" justify="center">
        <Modal isOpen={isOpen} onClose={this.onClose} {...other_props}>
          <ModalOverlay />
          <ModalContent minWidth={tableHeaders.length*100+103} >
            <ModalHeader display="flex" flexDirection="row" alignItems="center" backgroundColor="orange.300">
              <Icon name="warning-2" color="red.500" marginRight="2" />
              <Text width="100%"><Trans>solveConflictModal.title</Trans></Text>
              <Flex flexDirection="row" alignItems="center" marginRight="10">
                <Button disabled={selectItemIndex <= 0} onClick={onPrevConflict}><Trans>common.previous</Trans></Button>
                <Text marginX="2">{"("+(selectItemIndex+1)+"/"+conflictList.length+")"}</Text>
                <Button disabled={selectItemIndex >= conflictList.length-1} onClick={onNextConflict}><Trans>common.next</Trans></Button>
              </Flex>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody padding={0}>
              <Flex width="100%" direction="column">
                <EditableTable
                  width="100%"
                  height={150}
                  colLineHeight={20}
                  defaultColWidth={110}
                  headers={tableHeaders}
                  data={tableData}
                  onCellClicked={onCellClicked}/>
                <Flex m="2" alignItems="center">
                  <Flex flex="1" />
                  <Button onClick={this.onCancelBtnClicked} mr="5" variantColor="gray" width="100px" height="44px"><Trans>common.cancel</Trans></Button>
                  <Button onClick={this.onOKBtnClicked} variantColor="green" width="100px" height="44px"><Trans>common.ok</Trans></Button>
                </Flex>
              </Flex>
            </ModalBody>
          </ModalContent>
        </Modal>
        {
          labList && labList.length > 0 &&
          <ChooseItemModal
            ref={this.chooseLabModalRef}
            title={t("chooseLabModal.title_template", {center_name: curCenter.title})}
            items={labList}
            checkIconColor="red.500"
            withOK={false}
            onItemSelect={onLabSelect} />
        }
        <EditItemModal
          ref={this.editRemarkModalRef}
          title={t("solveConflictModal.remark")}
          placeholder={t("solveConflictModal.remark_placeholder")}
          titleBgColor="orange.300"
          onResult={onEditRemarkResult} />
        <SchedTableModal
          ref={this.schedTableModalRef}
          minWidth={this.schedTableFieldNames.length*100+103}
          titleBgColor={schedTableTitleBg}
          withCancel
          title={schedTableTitle}
          tableData={schedTableData}
          onResult={schedTableModalResultCb} />
      </Flex>
    );
  }
}

const SolveConflictModal = withTranslation("translation", {withRef: true})(SolveConflictModalWrapped);
export { SolveConflictModal };
