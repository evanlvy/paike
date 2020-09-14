/* @flow */

import React, { Component } from 'react';
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { withTranslation } from 'react-i18next';

import {
  Flex,
} from '@chakra-ui/core';

import {
  SubjectBoard,
  ResultTabList,
  ResultTable,
  SolveConflictModal,
  DatePickerModal,
  ChooseItemModal,
  EditItemModal,
  SelectItemModal,
  Alert,
} from '../components';

import { actions as authActions, getLoggedUser } from '../redux/modules/auth';
import { getEducationText } from '../models/grade';

const LILUNKEBIAO_COLOR = "orange";
class LiLunKeBiaoScreenWrapped extends Component {
  constructor(props) {
    super(props);
    this.state = {
      grade_info: "",
      labs: []
    };

    this.subjectsData = [
      {title: "护理", color: "red.400"},
      {title: "助产", color: "green.200"},
      {title: "临床医学", color: "blue.400"},
      {title: "临床医学\n病理", color: "orange.300"},
      {title: "全科医学", color: "cyan.500"},
      {title: "卫生信息\n管理", color: "blue.200"},
      {title: "医学影像", color: "green.100"},
      {title: "影像技术", color: "green.300"},
      {title: "放射治疗\n技术", color: "blue.400"},
      {title: "医学美容", color: "purple.500"},
    ];
    this.tabTitles = [
      "第一学期1-9周",
      "第一学期10-18周",
      "第二学期1-9周",
      "第二学期10-18周",
    ];
    this.tableHeaders = [
      {name: "班级\\星期", field: "class_name"},
      {name: "周一 1,2", field: "monday_12"},
      {name: "3,4", field: "monday_34"},
      {name: "6,7", field: "monday_67"},
      {name: "8,9", field: "monday_89"},
      {name: "周二 1,2", field: "tuesday_12"},
      {name: "3,4", field: "tuesday_34"},
      {name: "6,7", field: "tuesday_67"},
      {name: "8,9", field: "tuesday_89"},
      {name: "周三 1,2", field: "wednesday_12"},
      {name: "3,4", field: "wednesday_34"},
      {name: "6,7", field: "wednesday_67"},
      {name: "8,9", field: "wednesday_89"},
      {name: "周四 1,2", field: "thursday_12"},
      {name: "3,4", field: "thursday_34"},
      {name: "6,7", field: "thursday_67"},
      {name: "8,9", field: "thursday_89"},
      {name: "周五 1,2", field: "friday_12"},
      {name: "3,4", field: "friday_34"},
      {name: "6,7", field: "friday_67"},
      {name: "8,9", field: "friday_89"},
    ];
    this.tableData = [
      {class_name: {title: "护理1班 B101"}, monday_12: "护理伦理学 陈红", monday_34: "社区护理学 曾丽", monday_67: "自习", monday_89: "自习",
        tuesday_12: "护理管理学 刘诗诗", tuesday_34: "老年护理学 张英", tuesday_67: "自习", tuesday_89: "自习",
        wednesday_12: "自习", wednesday_34: "自习", wednesday_67: "内科护理学 黄丽", wednesday_89: "自习",
        thursday_12: "老年护理学 张英", thursday_34: "遗传与优生 刘芳", thursday_67: "自习", thursday_89: "自习",
        friday_12: "社区护理学 吴琼", friday_34: "护理伦理学 陈红", friday_67: "自习", friday_89: "自习" },
      {class_name: {title: "护理2班 A110", array: ["组1：1-20号", "组2：21-40号"]}, monday_12: "遗传与优生 刘芳", monday_34: "护理管理学 刘诗诗", monday_67: "内科护理学 黄丽", monday_89: "自习",
        tuesday_12: "护理伦理学 陈红", tuesday_34: "内科护理学 曹琴", tuesday_67: "自习", tuesday_89: "自习",
        wednesday_12: "老年护理学 张英", wednesday_34: "自习", wednesday_67: "社区护理学 吴琼", wednesday_89: "自习",
        thursday_12: "护理管理学 刘诗诗", thursday_34: "自习", thursday_67: "自习", thursday_89: "自习",
        friday_12: "内科护理学 杨欣", friday_34: "护理管理学 刘诗诗", friday_67: "自习", friday_89: "护理管理学 刘诗诗" },
      {class_name: {title: "助产班 B102", array: ["组1：1-30号", "组2：31-50号"], onItemClicked: this.onClassItemClicked}, monday_12: "内科护理学 曹琴", monday_34: "助产技术 杨新", monday_67: "遗传与优生 刘芳", monday_89: "自习",
        tuesday_12: "妇婴保健 吴懿", tuesday_34: "内科护理学 曹琴", tuesday_67: "自习", tuesday_89: "自习",
        wednesday_12: "社区护理学 曾丽", wednesday_34: "自习", wednesday_67: "内科护理学 曹琴", wednesday_89: "自习",
        thursday_12: "护理伦理学 陈红", thursday_34: "自习", thursday_67: "自习", thursday_89: "自习",
        friday_12: "护理管理学 刘诗诗", friday_34: "遗传与优生 刘芳", friday_67: "助产技术 杨新", friday_89: "自习" },
    ];
    this.selTabIndex = 0;

    this.labCenters = [
      {name: "基础分中心", labs:[{title: "E201"}, {title: "E211", occupied: "张倩"}, {title: "E212", occupied: "莫迪"}, {title: "E213", occupied: "苏畅"}, {title: "E214", occupied: "张磊"}, {title: "E212", occupied: "莫迪"}, {title: "E218"}, {title: "E214", occupied: "张磊"}]},
      {name: "护理分中心", labs:[{title: "E201"}, {title: "E211", occupied: "张倩"}, {title: "E212", occupied: "莫迪"}, {title: "E213", occupied: "苏畅"}, {title: "E214", occupied: "张磊"}, {title: "E212", occupied: "莫迪"}, {title: "E318"}, {title: "E214", occupied: "张磊"}]},
      {name: "影像分中心", labs:[{title: "E201"}, {title: "E211", occupied: "张倩"}, {title: "E212", occupied: "莫迪"}, {title: "E213", occupied: "苏畅"}, {title: "E214", occupied: "张磊"}, {title: "E212", occupied: "莫迪"}, {title: "E418"}, {title: "E214", occupied: "张磊"}]},
      {name: "临床分中心", labs:[{title: "E201"}, {title: "E211", occupied: "张倩"}, {title: "E212", occupied: "莫迪"}, {title: "E213", occupied: "苏畅"}, {title: "E214", occupied: "张磊"}, {title: "E212", occupied: "莫迪"}, {title: "E118"}, {title: "E214", occupied: "张磊"}]},
      {name: "药学分中心", labs:[{title: "E201"}, {title: "E211", occupied: "张倩"}, {title: "E212", occupied: "莫迪"}, {title: "E213", occupied: "苏畅"}, {title: "E214", occupied: "张磊"}, {title: "E212", occupied: "莫迪"}, {title: "E518"}, {title: "E214", occupied: "张磊"}]},
      {name: "医疗技术分中心", labs:[{title: "E201"}, {title: "E211", occupied: "张倩"}, {title: "E212", occupied: "莫迪"}, {title: "E213", occupied: "苏畅"}, {title: "E214", occupied: "张磊"}, {title: "E212", occupied: "莫迪"}, {title: "E618"}, {title: "E214", occupied: "张磊"}]},
      {name: "社科部", labs:[{title: "E201"}, {title: "E211", occupied: "张倩"}, {title: "E212", occupied: "莫迪"}, {title: "E213", occupied: "苏畅"}, {title: "E214", occupied: "张磊"}, {title: "E212", occupied: "莫迪"}, {title: "B118"}, {title: "E214", occupied: "张磊"}]},
    ];
    this.labTimeSegments = [
      { name: "1,2节" },
      { name: "3,4节" },
      { name: "6,7节" },
      { name: "8,9节" },
    ];

    this.teachers = [
      {title: "王欣"}, {title: "张倩", occupied: "E211"}, {title: "莫迪", occupied: "E212"}, {title: "苏畅", occupied: "E213"}, {title: "张磊", occupied: "E214"}, {title: "邱丽"}, {title: "周佳", occupied: "F301"}, {title: "刘燕", occupied: "F302"}
    ];

    this.groups = [
      {name: "第一批 1-30号"}, {name: "第二批 31-60号"}, {name: "第三批 61-80号"}
    ]

    this.conflictModal = React.createRef();
    this.chooseDateModal = React.createRef();
    this.chooseLabModal = React.createRef();
    this.chooseTeacherModal = React.createRef();
    this.editRemarkModal = React.createRef();
    this.selectGroupModal = React.createRef();
    this.confirmConflictDialog = React.createRef();
  }

  componentDidMount() {
    console.log("LiLunKeBiaoScreen componentDidMount");
    this.initUI();
  }

  componentDidUpdate(prevProps) {
    console.log("LiLunKeBiaoScreen componentDidUpdate "+prevProps.location.key+" -> "+this.props.location.key);
    if (prevProps.location.key !== this.props.location.key) {
      this.initUI();
    }
  }

  initUI = () => {
    const { t } = this.props;
    const { edu, grd } = this.props.location.state;
    const grade_info = getEducationText(t, edu) + t("grade.grade_template", {grade: grd});
    console.log("initUI grade: "+grade_info+" labs: "+this.labCenters[0].labs.length);
    this.setState({
      grade_info: grade_info,
      labs: this.labCenters[0].labs,
    })
  }

  onTabChanged = (index) => {
    const { tabTitles } = this;
    console.log("onTabChanged: "+tabTitles[index]);
    this.selTabIndex = index;
  }

  onClassItemClicked = (index) => {
    console.log("onClassItemClicked, index: "+index);
  }

  onKebiaoRowClicked = (index) => {
    console.log("onKebiaoRowClicked, index: "+index);
    if (index === 2) {
      this.conflictModal.current.show();
    }
  }

  // Choose Date
  onChooseDate = () => {
    this.chooseDateModal.current.show();
  }

  onChooseDateResult = (newDate) => {
    console.log("onChooseDateResult, date: "+newDate);
    return true;
  }

  // Choose Lab
  onChooseLab = () => {
    this.chooseLabModal.current.show();
  }

  onChooseLabCenterChanged = (index) => {
    this.setState({
      labs: this.labCenters[index].labs
    })
  }

  onChooseLabTimeSegChanged = (index) => {
    console.log("onChooseLabTimeSegChanged index: "+index);
  }

  onChooseLabResult = (confirm, labIndex) => {
    const { t } = this.props;
    if (confirm) {
      console.log("onChooseLabResult: "+JSON.stringify(this.state.labs[labIndex]));
      this.showConfirmConflictDialog(t("solveConflictModal.confirm_conflict_title"), t("solveConflictModal.confirm_conflict_message"));
    }
    return true;
  }
  // Choose Teacher
  onChooseTeacher = () => {
    this.chooseTeacherModal.current.show();
  }

  onChooseTeacherCenterChanged = (index) => {
    console.log("onChooseTeacherCenterChanged, center: "+this.labCenters[index].name);
  }

  onChooseTeacherResult = (confirm, index) => {
    if (confirm) {
      console.log("onChooseTeacherResult: "+JSON.stringify(this.teachers[index]));
    }
    return true;
  }
  // Edit Remark
  onEditRemark = () => {
    console.log("onEditRemark");
    this.editRemarkModal.current.show();
  }

  onEditRemarkResult =  (confirm, result) => {
    if (confirm) {
      console.log("onEditRemarkResult: "+result);
    }
    return true;
  }
  // Select Group
  onSelectGroup = () => {
    console.log("onSelectGroup");
    this.selectGroupModal.current.show();
  }

  onSelectGroupResult = (confirm, index) => {
    if (confirm) {
      console.log("onEditRemarkResult: "+JSON.stringify(this.groups[index]));
    }
    return true;
  }

  // Alert Dialog
  showConfirmConflictDialog = (title, message) => {
    this.confirmConflictDialog.current.show(title, message);
  }

  onConfirmConflict = (confirmed) => {
    console.log("onConfirmConflict, confirmed: "+confirmed);
    return true;
  }

  render() {
    const { t } = this.props;
    const { grade_info, labs } = this.state;
    const { teachers, groups, subjectsData, tabTitles, tableHeaders, tableData, labCenters, labTimeSegments,
      onTabChanged, onKebiaoRowClicked, onChooseDate, onChooseLab, onChooseTeacher, onEditRemark, onSelectGroup,
      onChooseLabCenterChanged, onChooseLabTimeSegChanged, onChooseLabResult,
      onChooseTeacherCenterChanged, onChooseTeacherResult,
      onEditRemarkResult, onSelectGroupResult, onChooseDateResult, onConfirmConflict } = this;
    const pageTables = [];
    for (let i=0; i < tabTitles.length; i++) {
      pageTables[i] = (<ResultTable
        height={400}
        titleHeight={50}
        colLineHeight={20}
        defaultColWidth={100}
        title={t("lilunKebiaoScreen.title_template", {grade_info: grade_info, semester_info: this.tabTitles[i]})}
        color={LILUNKEBIAO_COLOR}
        headers={tableHeaders}
        data={tableData}
        onRowClicked={onKebiaoRowClicked} />);
    }
    let curClass = this.tableData[2].class_name.title;
    return (
      <Flex width="100%" direction="column" justify="center" align="center">
        <SubjectBoard
          my={4}
          color={LILUNKEBIAO_COLOR}
          title={t("subjectBoard.title_template", {grade_info: grade_info})}
          subjects={ subjectsData }/>
        <ResultTabList
          my={4}
          width="100%"
          tabHeight={50}
          color={LILUNKEBIAO_COLOR}
          titles={tabTitles}
          onChange={onTabChanged}
          pages={pageTables} />
        <SolveConflictModal
          ref={this.conflictModal}
          isCentered
          onChooseDate={onChooseDate}
          onChooseLab={onChooseLab}
          onChooseTeacher={onChooseTeacher}
          onEditRemark={onEditRemark}
          onSelectGroup={onSelectGroup} />
        <DatePickerModal
          ref={this.chooseDateModal}
          title={t("solveConflictModal.choose_date")}
          titleBgColor="orange.500"
          onResult={onChooseDateResult} />
        <ChooseItemModal
          ref={this.chooseLabModal}
          centers={labCenters}
          items={labs}
          checkIconColor="red.500"
          occupiedSuffix={t("chooseLabModal.occupied_suffix")}
          timeSegments={labTimeSegments}
          onCenterChanged={onChooseLabCenterChanged}
          onTimeSegChanged={onChooseLabTimeSegChanged}
          onResult={onChooseLabResult} />
        <ChooseItemModal
          ref={this.chooseTeacherModal}
          centers={labCenters}
          items={teachers}
          emptyColor="pink.200"
          occupiedSuffix={t("chooseLabModal.occupied_suffix")}
          onCenterChanged={onChooseTeacherCenterChanged}
          onResult={onChooseTeacherResult} />
        <EditItemModal
          ref={this.editRemarkModal}
          title={t("solveConflictModal.remark")}
          placeholder={t("solveConflictModal.remark_placeholder")}
          titleBgColor="orange.500"
          onResult={onEditRemarkResult} />
        <SelectItemModal
          ref={this.selectGroupModal}
          title={t("solveConflictModal.group")+"["+curClass+"]"}
          titleBgColor="orange.500"
          choices={groups}
          onResult={onSelectGroupResult} />
        <Alert
          ref={this.confirmConflictDialog}
          negativeBtnCaption={t("common.cancel")}
          onResult={onConfirmConflict}/>
      </Flex>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    user: getLoggedUser(state)
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    ...bindActionCreators(authActions, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(LiLunKeBiaoScreenWrapped));
