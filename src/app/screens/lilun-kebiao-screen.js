/* @flow */

import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';

import {
  Flex
} from '@chakra-ui/core';

import {
  SubjectBoard,
  ResultTabList,
  ResultTable,
  SolveConflictModal,
} from '../components';

import { getEducationText } from '../models/grade';

const LILUNKEBIAO_COLOR = "orange";
class LiLunKeBiaoScreenWrapped extends Component {
  constructor(props) {
    super(props);
    this.state = {
      grade_info: ""
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

    this.conflictModal = React.createRef();
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
    console.log("initUI grade: "+grade_info);
    this.setState({
      grade_info: grade_info
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

  render() {
    const { t } = this.props;
    const { grade_info } = this.state;
    const { subjectsData, tabTitles, tableHeaders, tableData, onTabChanged, onKebiaoRowClicked } = this;
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
        <SolveConflictModal ref={this.conflictModal} isCentered />
      </Flex>
    );
  }
}
const LiLunKeBiaoScreen = withTranslation()(LiLunKeBiaoScreenWrapped)

export { LiLunKeBiaoScreen };
