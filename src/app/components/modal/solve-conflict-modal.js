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

import { Alert } from '../alert/alert-dialog';
import { EditItemModal } from './edit-item-modal';
import { ChooseItemModal } from './choose-item-modal';
import { SchedTableModal } from './sched-table-modal';
import { EditableTable } from '../result-table/editable-table';

import { buildBanjiSchedId } from '../../redux/modules/kebiao';
import { buildLabSchedId } from '../../redux/modules/lab';
import { buildTeacherSchedId } from '../../redux/modules/teacher';

import { SEMESTER_WEEK_COUNT } from '../../screens/common/info';

const CHOOSE_SCHED_TITLE_BG = "orange.400";
const CHOOSE_LAB_TITLE_BG = "blue.500";

const SCHED_TABLE_TYPE_NONE = 0;
const SCHED_TABLE_TYPE_KEBIAO = 1;
const SCHED_TABLE_TYPE_LAB = 2;
class SolveConflictModalWrapped extends Component {
  constructor(props) {
    super(props);
    const { t } = props;
    this.state = {
      isOpen: false,
      selectItem: null,
      selectWeek: 0,
      schedTableTitle: "",
      schedTableTitleBg: CHOOSE_SCHED_TITLE_BG,
      enableSchedTableMultiSelect: false,
      schedTableMultiSelectRange: 1,
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
    this.schedTableType = SCHED_TABLE_TYPE_NONE;
    this.schedTableData = [];
    this.schedTableLoading = false;

    this.weekdayNames = [
      t("kebiao.sched_monday"), t("kebiao.sched_tuesday"), t("kebiao.sched_wednesday"),
      t("kebiao.sched_thursday"), t("kebiao.sched_friday"), t("kebiao.sched_saturday"), t("kebiao.sched_sunday")
    ];
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
    this.chooseTeacherModalRef = React.createRef();
    this.chooseLabModalRef = React.createRef();
    this.schedTableModalRef = React.createRef();
    this.doubleConfirmDialog = React.createRef();
  }

  showConflict = (weekIndex, selectItem, conflictList) => {
    if (!selectItem) {
      console.log("Can't show empty data in SolveConflictModal");
      return;
    }
    console.log("Solve conflict: "+JSON.stringify(selectItem));
    this.selectItemIndex = 0;
    if (conflictList) {
      this.selectItemIndex = conflictList.findIndex(item => item.data.id === selectItem.data.id);
      this.conflictList = conflictList;
    } else {
      this.conflictList = [selectItem];
    }
    this.setState({
      selectWeek: weekIndex,
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
    this.buildTeacherList();
    this.buildSchedTable();
  }

  checkLabFree = (labId) => {
    const { selectWeek, selectItem } = this.state;
    const { labSched } = this.props;
    const selectItemData = selectItem.data;
    if (labId === selectItemData.lab_id) {
      return true;
    }
    const labSchedId = buildLabSchedId(labId, 3, selectWeek);
    const labSchedInfo = labSched.get(labSchedId);
    if (labSchedInfo) {
      // console.log("labSchedInfo: "+JSON.stringify(labSchedInfo));
      // console.log("selectItemData: "+JSON.stringify(selectItemData));
      const schedInDay = labSchedInfo.schedules[selectItemData.day_in_week-1];
      return !(schedInDay && schedInDay[(selectItemData.index-1)/2] && schedInDay[(selectItemData.index-1)/2].length > 0);
    }
    return true;
  }

  buildLabList = () => {
    const { labs } = this.props;
    if (!labs || labs.length === 0) {
      return;
    }
    this.labList = labs.map(labInfo => {
        if (!this.checkLabFree(labInfo.id)) {
          labInfo.occupied = "";
        } else {
          labInfo.occupied = null;
        }
        return labInfo;
    });
    //console.log("LabList: "+JSON.stringify(this.labList));
  }

  checkTeacherFree = (teacherId) => {
    const { selectWeek, selectItem } = this.state;
    const { teacherSched } = this.props;
    const selectItemData = selectItem.data;
    if (teacherId === selectItemData.lab_teacher_id) {
      return true;
    }
    const teacherSchedId = buildTeacherSchedId(teacherId, 3, selectWeek);
    const teacherSchedInfo = teacherSched.get(teacherSchedId);
    if (teacherSchedInfo) {
      //console.log("teacher: "+teacherInfo.title+" schedInfo: "+JSON.stringify(teacherSchedInfo));
      const schedInDay = teacherSchedInfo.schedules[selectItemData.day_in_week-1];
      return !(schedInDay && schedInDay[(selectItemData.index-1)/2] && schedInDay[(selectItemData.index-1)/2].length > 0);
    }
    return true;
  }

  buildTeacherList = () => {
    const { teachers } = this.props;
    if (!teachers || teachers.length === 0) {
      return;
    }
    this.teacherList = teachers.map(teacherInfo => {
      if (!this.checkTeacherFree(teacherInfo.id)) {
        teacherInfo.occupied = "";
      } else {
        teacherInfo.occupied = null;
      }
      return teacherInfo;
    });
    //console.log("TeacherList: "+JSON.stringify(this.teacherList));
  }

  buildSchedTable = () => {
    const { schedTableType, selectLab } = this;
    const { selectItem } = this.state;
    console.log("buildSchedTable, type: "+schedTableType);
    switch(schedTableType) {
      case SCHED_TABLE_TYPE_KEBIAO:
        this.schedTableData = this.buildBanjiSchedTable(selectItem.data.class_id);
        break;
      case SCHED_TABLE_TYPE_LAB:
        this.schedTableData = this.buildLabSchedTable(selectLab);
        break;
      default:
        this.schedTableData = [];
        break;
    }
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
      case "time":
        this.onEditSched();
        break;
      case "shixun_teacher":
        this.onEditTeacher();
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
  // Alert Dialog
  showDoubleConfirmDialog = (onConfirmCb) => {
    const { t } = this.props;
    const title = t("solveConflictModal.confirm_conflict_title");
    const message= t("solveConflictModal.confirm_conflict_message");
    this.onDoubleConfirmResultCb = onConfirmCb;
    this.doubleConfirmDialog.current.show(title, message);
  }

  onDoubleConfirmResult = (confirm) => {
    if (this.onDoubleConfirmResultCb) {
      this.onDoubleConfirmResultCb(confirm);
    }
    return true;
  }

  // Edit Schedule
  onEditSched = () => {
    const { selectItem } = this.state;
    const { t } = this.props;

    console.log("onEditSched: "+JSON.stringify(selectItem));

    this.schedTableType = SCHED_TABLE_TYPE_KEBIAO;
    this.schedTableModalResultCb = this.onConfirmSchedChooseResult;
    this.schedTableModalBackRef = null;
    this.setState({
      schedTableTitle: t("chooseSchedModal.title_template", {banji_name: selectItem.banji}),
      schedTableTitleBg: CHOOSE_SCHED_TITLE_BG,
      enableSchedTableMultiSelect: true,
      schedTableMultiSelectRange: selectItem.data.hours/2,
      schedNavItemsInfo: {
        onNavItemChange: this.onSchedWeekChanged,
        titleTemplate: "kebiao.semester_week_template",
        prevCaption: t("kebiao.prev_semester_week"),
        nextCaption: t("kebiao.next_semester_week"),
        maxCount: SEMESTER_WEEK_COUNT
      }
    });
    if (this.schedTableModalRef.current) {
      this.schedTableModalRef.current.show(selectItem.data.week-1);
    }
  }

  buildKebiaoName = (kebiaoInfo) => {
    const { t } = this.props;
    if (kebiaoInfo.is_lab) {
      return t("chooseSchedModal.shiyan");
    } else {
      return t("chooseSchedModal.lilun");
    }
  }

  buildBanjiSchedTable = (banjiId) => {
    const { t, banjiSched } = this.props;
    const { selectWeek } = this.state;
    const { schedTableFieldNames, schedTableRowNames} = this;
    const banjiSchedId = buildBanjiSchedId(banjiId, 3, selectWeek);
    console.log("Get kebiaoInfo of "+banjiSchedId);
    const kebiaoInfo = banjiSched[banjiSchedId];
    this.schedTableLoading = !kebiaoInfo;
    //console.log("kebiaoInfo: "+JSON.stringify(kebiaoInfo));
    let resultList = [];
    for (let i=1; i < schedTableFieldNames.length; i++) {
      const kebiaoInDay = kebiaoInfo ? kebiaoInfo[i-1] : null;
      for (let j=0; j < schedTableRowNames.length; j++) {
        if (!resultList[j]) {
          resultList[j] = {};
          resultList[j][schedTableFieldNames[0]] = schedTableRowNames[j];
        }
        let names = [];
        let hourIndex = j;
        const kebiaoHourList = kebiaoInDay ? kebiaoInDay[hourIndex] : [];
        if (kebiaoHourList && kebiaoHourList.length > 0) {
          kebiaoHourList.forEach(kebiao => {
            let name = this.buildKebiaoName(kebiao);
            if (name) {
              names.push(name);
            }
          });
        } else {
          names.push(t("common.null"));
        }
        resultList[j][schedTableFieldNames[i]] = { titles: names, data: kebiaoHourList };
      }
    }
    //console.log("ResultList: "+JSON.stringify(resultList));
    return resultList;
  }

  onSchedWeekChanged = (weekIndex) => {
    //console.log("onSchedWeekChanged, index: "+weekIndex);
    this.setState({
      selectWeek: weekIndex+1
    });
    this.schedTableModalRef.current.resetSelection();
    const { onSchedWeekChange } = this.props;
    if (onSchedWeekChange) {
      onSchedWeekChange(weekIndex);
    }
  }

  onConfirmSchedChooseResult = (confirm, result) => {
    console.log("onConfirmSchedChooseResult, confirm: "+confirm+", result: "+JSON.stringify(result));
    this.schedTableType = SCHED_TABLE_TYPE_NONE;
    const { schedTableData, schedTableFieldNames} = this;
    if (confirm) {
      this.schedChooseResult = result;
      const schedData = schedTableData[result.hour_index][schedTableFieldNames[result.weekday_index+1]].data;
      if (schedData && schedData.length > 0) { // There is sched items in the chosen position
        this.showDoubleConfirmDialog(this.onDoubleConfirmSchedResult);
      } else {
        this.onDoubleConfirmSchedResult(true);
      }
    }
    return true;
  }

  onDoubleConfirmSchedResult = (confirm) => {
    console.log("onDoubleConfirmSchedResult, confirm: "+confirm);
    if (confirm) {
      const { schedChooseResult: result } = this;
      console.log("onDoubleConfirmSchedResult, result: "+JSON.stringify(result));
      const { selectWeek } = this.state;
      const { weekdayNames, schedTableRowNames } = this;
      let selItem = {...this.state.selectItem};
      const selectData = selItem.data;
      selItem.date = weekdayNames[result.weekday_index];
      selItem.time = schedTableRowNames[result.hour_index];
      selectData.week = selectWeek;
      selectData.index = result.hour_index*2+1;
      selectData.day_in_week = result.weekday_index+1;
      selectData.hours = result.range*2;
      this.setState({
        selectItem: selItem
      });
    }
  }

  // Edit Teacher
  onEditTeacher = () => {
    if (this.chooseTeacherModalRef.current) {
      this.chooseTeacherModalRef.current.show();
    }
  }

  onConfirmTeacherChooseResult = (confirm, index) => {
    console.log("onConfirmTeacherChooseResult, confirm: "+confirm+", index: "+index);
    if (confirm) {
      this.selectTeacher = this.teacherList[index];
      if (!this.checkTeacherFree(this.selectTeacher.id)) {
        this.showDoubleConfirmDialog(this.onDoubleConfirmTeacherResult);
      } else {
        this.onDoubleConfirmTeacherResult(true);
      }
    }
    return true;
  }

  onDoubleConfirmTeacherResult = (confirm) => {
    console.log("onDoubleConfirmTeacherResult, confirm: "+confirm);
    if (confirm) {
      const { selectTeacher } = this;
      let selItem = {...this.state.selectItem};
      const selectData = selItem.data;
      selItem.shixun_teacher = selectTeacher.title;
      selectData.lab_teacher = selectTeacher.title;
      selectData.lab_teacher_id = selectTeacher.id;
      this.setState({
        selectItem: selItem
      });
    }
  }

  // Edit Lab
  onEditLab = () => {
    if (this.chooseLabModalRef.current) {
      this.chooseLabModalRef.current.show();
    }
  }

  onLabSelect = (index) => {
    const { t, labs } = this.props;
    this.selectLab = labs[index];
    console.log("onLabSelect: "+this.selectLab.title);

    this.schedTableType = SCHED_TABLE_TYPE_LAB;
    this.schedTableModalResultCb = this.onConfirmLabChooseResult;
    this.schedTableModalBackRef = this.chooseLabModalRef;
    this.setState({
      schedTableTitle: t("chooseLabModal.title_labinfo_template", {lab_name: this.selectLab.title}),
      schedTableTitleBg: CHOOSE_LAB_TITLE_BG,
      enableSchedTableMultiSelect: false,
      schedTableMultiSelectRange: 1,
      schedNavItemsInfo: {}
    });
    if (this.schedTableModalRef.current) {
      this.schedTableModalRef.current.show();
      this.chooseLabModalRef.current.dismiss();
    }
  }

  buildShiXunName = (shixunId) => {
    const { kebiaoByIds } = this.props;
    const shixunInfo = kebiaoByIds.get(shixunId)
    return shixunInfo.labitem_name+" ("+shixunInfo.lab_teacher+")";
  }

  buildLabSchedTable = (lab) => {
    const { t, labSched } = this.props;
    const { schedTableFieldNames, schedTableRowNames } = this;
    const { selectWeek, selectItem } = this.state;
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
        const needDisabled = (selectConflictData.day_in_week !== i || (selectConflictData.index-1)/2 !== hourIndex);
        resultList[j][schedTableFieldNames[i]] = { titles: names, disabled: needDisabled, data: shixunHourList };
      }
    }
    console.log("ResultList: "+JSON.stringify(resultList));
    return resultList;
  }

  onConfirmLabChooseResult = (confirm) => {
    this.schedTableType = SCHED_TABLE_TYPE_NONE;
    if (confirm) {
      const { selectLab } = this;
      if (!this.checkLabFree(selectLab.id)) {
        this.showDoubleConfirmDialog(this.onDoubleConfirmLabResult);
      } else {
        this.onDoubleConfirmLabResult(true);
      }
    } else {
      if (this.schedTableModalBackRef) {
        this.schedTableModalBackRef.current.show();
      }
    }
    return true;
  }

  onDoubleConfirmLabResult = (confirm) => {
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
  }

  // Edit Remark
  onEditRemark = () => {
    const { selectItem } = this.state;
    if (this.editRemarkModalRef.current) {
      this.editRemarkModalRef.current.show(selectItem.note);
    }
  }

  onEditRemarkResult = (confirm, result) => {
    if (confirm) {
      console.log("onEditRemarkResult: "+result);
      const selItem = {...this.state.selectItem};
      selItem.note = result;
      selItem.data.comments = result;
      this.setState({
        selectItem: selItem
      })
    }
    return true;
  }

  render() {
    const { isOpen, selectItem, schedTableTitle, schedTableTitleBg, schedNavItemsInfo, enableSchedTableMultiSelect, schedTableMultiSelectRange } = this.state;
    const { t, curCenter, labs, labSched, banjiSched, teachers, teacherDepList, onTeacherDepartmentChange, onSchedWeekChange, onConflictChanged, ...other_props } = this.props;
    this.buildData();
    const { tableHeaders, selectItemIndex, conflictList, labList, teacherList, schedTableData, schedTableLoading,
      onCellClicked, onPrevConflict, onNextConflict, onDoubleConfirmResult,
      onEditRemarkResult, onLabSelect, onConfirmTeacherChooseResult, schedTableModalResultCb } = this;
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
        {
          teacherList && teacherList.length > 0 &&
          <ChooseItemModal
            ref={this.chooseTeacherModalRef}
            title={t("chooseTeacherModal.title_template", {shixun_name: selectItem.shixun_name})}
            items={teacherList}
            centers={teacherDepList}
            emptyColor="pink.400"
            checkIconColor="blue.500"
            withOK
            withCancel
            onCenterChanged={onTeacherDepartmentChange}
            onResult={onConfirmTeacherChooseResult} />
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
          loading={schedTableLoading}
          navItemsInfo={schedNavItemsInfo}
          tableData={schedTableData}
          multiSelect={enableSchedTableMultiSelect}
          multiSelectRange={schedTableMultiSelectRange}
          onResult={schedTableModalResultCb} />
        <Alert
          ref={this.doubleConfirmDialog}
          negativeBtnCaption={t("common.cancel")}
          onResult={onDoubleConfirmResult} />
      </Flex>
    );
  }
}

const SolveConflictModal = withTranslation("translation", {withRef: true})(SolveConflictModalWrapped);
export { SolveConflictModal };
