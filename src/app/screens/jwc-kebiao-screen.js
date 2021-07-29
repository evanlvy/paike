/* @flow */

import React, { Component } from 'react';
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { withTranslation } from 'react-i18next';
import {
  Flex,
  Text,
} from '@chakra-ui/core';

import {
  SubjectBoard,
  ResultTabList,
  ResultTable,
} from '../components';

import { getSchoolYear, getSchoolWeek } from '../redux/modules/grade';
import { actions as rawplanActions, getRawplanGroups, getSelectedGroup, getPlansByGroup} from '../redux/modules/rawplan';

import { SEMESTER_WEEK_COUNT } from './common/info';

const JYS_KEBIAO_COLOR = "red";
const TEACHER_ITEM_COLOR = "pink.400";
class JwcKebiaoScreen extends Component {
  constructor(props) {
    super (props);
    const { t, schoolWeek } = props;
    this.state = {
      selectedSubjectIndex: 0,
      selectWeek: schoolWeek ? schoolWeek : 1,
    };
    this.groupTitle = t("jwcKebiaoScreen.class_group");
    this.tabTitles = [];
    
    this.semesterPages = [];
    
    this.tableHeaders = [
      {name: t("jwcKebiaoScreen.banji_sched_title"), field: "class"},
      {name: t("jwcKebiaoScreen.classroom"), field: "room"},
      {name: t("jwcKebiaoScreen.mon_12"), field: "mon_12", renderer: "course_teacher_renderer"},
      {name: t("jwcKebiaoScreen.mon_34"), field: "mon_34", renderer: "course_teacher_renderer"},
      {name: t("jwcKebiaoScreen.mon_56"), field: "mon_56", renderer: "course_teacher_renderer"},
      {name: t("jwcKebiaoScreen.mon_78"), field: "mon_78", renderer: "course_teacher_renderer"},
      {name: t("jwcKebiaoScreen.tue_12"), field: "tue_12", renderer: "course_teacher_renderer"},
      {name: t("jwcKebiaoScreen.tue_34"), field: "tue_34", renderer: "course_teacher_renderer"},
      {name: t("jwcKebiaoScreen.tue_56"), field: "tue_56", renderer: "course_teacher_renderer"},
      {name: t("jwcKebiaoScreen.tue_78"), field: "tue_78", renderer: "course_teacher_renderer"},
      {name: t("jwcKebiaoScreen.wed_12"), field: "wed_12", renderer: "course_teacher_renderer"},
      {name: t("jwcKebiaoScreen.wed_34"), field: "wed_34", renderer: "course_teacher_renderer"},
      {name: t("jwcKebiaoScreen.wed_56"), field: "wed_56", renderer: "course_teacher_renderer"},
      {name: t("jwcKebiaoScreen.wed_78"), field: "wed_78", renderer: "course_teacher_renderer"},
      {name: t("jwcKebiaoScreen.thu_12"), field: "thu_12", renderer: "course_teacher_renderer"},
      {name: t("jwcKebiaoScreen.thu_34"), field: "thu_34", renderer: "course_teacher_renderer"},
      {name: t("jwcKebiaoScreen.thu_56"), field: "thu_56", renderer: "course_teacher_renderer"},
      {name: t("jwcKebiaoScreen.thu_78"), field: "thu_78", renderer: "course_teacher_renderer"},
      {name: t("jwcKebiaoScreen.fri_12"), field: "fri_12", renderer: "course_teacher_renderer"},
      {name: t("jwcKebiaoScreen.fri_34"), field: "fri_34", renderer: "course_teacher_renderer"},
      {name: t("jwcKebiaoScreen.fri_56"), field: "fri_56", renderer: "course_teacher_renderer"},
      {name: t("jwcKebiaoScreen.fri_78"), field: "fri_78", renderer: "course_teacher_renderer"},
      /*{name: "slots", field: "slots", children: [
        {name: t("jwcKebiaoScreen.mon_12"), field: "mon_12", children: [
          {name: "course", field: "course"},
          {name: "teacher", field: "teacher"},
        ],},
        {name: t("jwcKebiaoScreen.mon_34"), field: "mon_34", children: [
          {name: "course", field: "course"},
          {name: "teacher", field: "teacher"},
        ],},
        {name: t("jwcKebiaoScreen.mon_56"), field: "mon_56", children: [
          {name: "course", field: "course"},
          {name: "teacher", field: "teacher"},
        ],},
        {name: t("jwcKebiaoScreen.mon_78"), field: "mon_78", children: [
          {name: "course", field: "course"},
          {name: "teacher", field: "teacher"},
        ],},
        {name: t("jwcKebiaoScreen.tue_12"), field: "tue_12", children: [
          {name: "course", field: "course"},
          {name: "teacher", field: "teacher"},
        ],},
        {name: t("jwcKebiaoScreen.tue_34"), field: "tue_34", children: [
          {name: "course", field: "course"},
          {name: "teacher", field: "teacher"},
        ],},
        {name: t("jwcKebiaoScreen.tue_56"), field: "tue_56", children: [
          {name: "course", field: "course"},
          {name: "teacher", field: "teacher"},
        ],},
        {name: t("jwcKebiaoScreen.tue_78"), field: "tue_78", children: [
          {name: "course", field: "course"},
          {name: "teacher", field: "teacher"},
        ],},
        {name: t("jwcKebiaoScreen.wed_12"), field: "wed_12", children: [
          {name: "course", field: "course"},
          {name: "teacher", field: "teacher"},
        ],},
        {name: t("jwcKebiaoScreen.wed_34"), field: "wed_34", children: [
          {name: "course", field: "course"},
          {name: "teacher", field: "teacher"},
        ],},
        {name: t("jwcKebiaoScreen.wed_56"), field: "wed_56", children: [
          {name: "course", field: "course"},
          {name: "teacher", field: "teacher"},
        ],},
        {name: t("jwcKebiaoScreen.wed_78"), field: "wed_78", children: [
          {name: "course", field: "course"},
          {name: "teacher", field: "teacher"},
        ],},
        {name: t("jwcKebiaoScreen.thu_12"), field: "thu_12", children: [
          {name: "course", field: "course"},
          {name: "teacher", field: "teacher"},
        ],},
        {name: t("jwcKebiaoScreen.thu_34"), field: "thu_34", children: [
          {name: "course", field: "course"},
          {name: "teacher", field: "teacher"},
        ],},
        {name: t("jwcKebiaoScreen.thu_56"), field: "thu_56", children: [
          {name: "course", field: "course"},
          {name: "teacher", field: "teacher"},
        ],},
        {name: t("jwcKebiaoScreen.thu_78"), field: "thu_78", children: [
          {name: "course", field: "course"},
          {name: "teacher", field: "teacher"},
        ],},
        {name: t("jwcKebiaoScreen.fri_12"), field: "fri_12", children: [
          {name: "course", field: "course"},
          {name: "teacher", field: "teacher"},
        ],},
        {name: t("jwcKebiaoScreen.fri_34"), field: "fri_34", children: [
          {name: "course", field: "course"},
          {name: "teacher", field: "teacher"},
        ],},
        {name: t("jwcKebiaoScreen.fri_56"), field: "fri_56", children: [
          {name: "course", field: "course"},
          {name: "teacher", field: "teacher"},
        ],},
        {name: t("jwcKebiaoScreen.fri_78"), field: "fri_78", children: [
          {name: "course", field: "course"},
          {name: "teacher", field: "teacher"},
        ],},
      ],},*/
    ];

    this.tableData = null;
    /*this.tableRowNames = [
      t("kebiao.sched_12")+t("kebiao.sched_unit"),
      t("kebiao.sched_34")+t("kebiao.sched_unit"),
      t("kebiao.sched_5")+t("kebiao.sched_unit"),
      t("kebiao.sched_67")+t("kebiao.sched_unit"),
      t("kebiao.sched_89")+t("kebiao.sched_unit"),
      t("kebiao.sched_1011")+t("kebiao.sched_unit"),
      t("kebiao.sched_1213")+t("kebiao.sched_unit"),
    ];*/
    this.jysSelectWeek = schoolWeek ? schoolWeek : 1;

    this.tabsListRef = React.createRef();
    
  }

  componentDidMount() {
    this.loadData();
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { schoolYear, groupList, planRows, groupStageWeekId } = this.props;
    const { selectedSubjectIndex } = this.state;
    // console.log("shouldComponentUpdate, origin grd: "+JSON.stringify(location.state.grd)+", origin edu: "+JSON.stringify(location.state.edu));
    // console.log("shouldComponentUpdate, grd: "+JSON.stringify(nextProps.location.state.grd)+", edu: "+JSON.stringify(nextProps.location.state.edu));
    if (nextProps.schoolYear !== schoolYear || nextProps.groupList !== groupList || nextProps.planRows !== planRows || nextProps.groupStageWeekId !== groupStageWeekId) {
      console.log("shouldComponentUpdate, props diff");
      return true;
    } else if (nextState.selectedSubjectIndex !== selectedSubjectIndex) {
      console.log("shouldComponentUpdate, state diff");
      return true;
    }
    return false;
  }

  componentDidUpdate() {
    this.loadData();
  }

  loadData = () => {
    if (!this.groups || this.groups.length === 0) { // only get subjects when it's empty
      this.loadGroups();
    }
  }

  resetData = () => {
    console.log("reset raw plan data");
    const { schoolWeek } = this.props;
    this.tableData = null;
    this.setState({
      selectedSubjectIndex: 0,
      selectWeek: schoolWeek ? schoolWeek : 1,
    });
  }

  loadGroups = () => {
    const { schoolYear, schoolWeek } = this.props;
    if (!schoolYear || !schoolWeek) {
      return;
    }
    console.log("loadGroups of year: "+schoolYear);
    this.props.fetchRawplanGroups(schoolYear);
  }

  buildGroups = () => {
    if (!this.groups || this.groups.length === 0) {
      const { groupList } = this.props;
      this.groups = !groupList ? [] : groupList;
      console.log("Groups Data: "+JSON.stringify(this.groups));
      if (!this.state.selectedSubjectIndex) {
        this.state.selectedSubjectIndex = 0;
      }
    }
  }

  buildKebiao = () => {

  }

  buildKebiaoBySched = (jysList, kebiaoByJysSched) => {
    /*
    const { schoolYear } = this.props;
    const { shixunSelectWeek, weekdayNames, hourNames } = this;
    let result = {}
    jysList.forEach(jys => {
      const jysSchedId = buildJysSchedId(jys.id, schoolYear, shixunSelectWeek);
      console.log("Get kebiaoInfo of "+jysSchedId);
      const kebiaoInWeek = kebiaoByJysSched[jysSchedId];
      if (kebiaoInWeek) {
        for (let i=0; i < weekdayNames.length; i++) {
          const kebiaoInDay = kebiaoInWeek[i];
          if (!kebiaoInDay) {
            continue;
          }
          for (let j=0; j < hourNames.length; j++) {
            const kebiaoHourList = kebiaoInDay[j];
            if (!kebiaoHourList || kebiaoHourList.length === 0) {
              continue;
            }
            const key = `${i}_${j}`;
            if (!result[key]) {
              result[key] = [];
            }
            kebiaoHourList.forEach(kebiaoHour => {
              kebiaoHour["jys"] = {...jys};
              result[key].push(kebiaoHour);
            });
          }
        }
      }
    });
    //console.log("buildKebiaoBySched: "+JSON.stringify(result));
    return result;*/
  }


  buildData = () => {
    this.buildGroups();
    this.buildKebiao();
  }

  onSubjectClicked = (index) => {
    console.log(`onSubjectClicked ${this.groups[index].title}`);
    this.setState({
      selectedSubjectIndex: index,
    });
    this.setSubjectSelectedIndex(index);
    this.loadKebiao(index);
    this.tabTitles.push(this.groups[index].name);
  }

  setSubjectSelectedIndex = (index) => {
    if (this.groups && index < this.groups.length) {
      this.selectedSubject = this.groups[index];
    } else {
      this.selectedSubject = null;
    }
  }

  loadKebiao = () => {
    const { schoolYear, schoolWeek } = this.props;
    let grade_id = this.selectedSubject.grade;
    let degree_id = this.selectedSubject.degree;
    console.log("loadKebiao, grade: "+grade_id+" degree: "+degree_id);
    this.props.fetchRawplan(schoolYear, schoolWeek, degree_id, grade_id);  //stage, weekIdx, degreeId, gradeId
    this.setState({
      hasFetchKebiao: true
    });
  }

  render() {
    const { t, groupList, planRows, groupStageWeekId } = this.props;
    this.buildData();
    //const { selectedTeacherIndex } = this.state;
    const { groupTitle, onSubjectClicked,
      tabTitles, tableTitle, tableHeaders, semesterPages } = this;
    const pageTables = [];
    console.log("render: plans "+JSON.stringify(planRows));
    console.log("render: group_id: "+groupStageWeekId);
    if (planRows) {
      pageTables[0] = (<ResultTable
        height={450}
        titleHeight={50}
        colLineHeight={20}
        defaultColWidth={180}
        title={tableTitle}
        color={JYS_KEBIAO_COLOR}
        headers={tableHeaders}
        data={planRows}
        pageNames={semesterPages}
        pagePrevCaption={t("kebiao.prev_semester_week")}
        pageNextCaption={t("kebiao.next_semester_week")}
        // onResultPageIndexChanged={onSemesterPageChanged}
        // initPageIndex={jysSelectWeek-1}
        pageInputCaption={[t("kebiao.input_semester_week_prefix"), t("kebiao.input_semester_week_suffix")]}/>);
    } else {
      pageTables[0] = (<Flex alignItems='center' justifyContent='center'><Text>{t("common.no_data")}</Text></Flex>);
    }

    return (
      <Flex width="100%" minHeight={750} direction="column" align="center">
        {
          groupList && groupList.length > 0 &&
          <SubjectBoard
            my={4}
            color={JYS_KEBIAO_COLOR}
            title={groupTitle}
            subjects={groupList}
            onSubjectClicked={onSubjectClicked}
            t = {t}
            enableSelect
            autoTitle />
        }
        {
          tabTitles && tabTitles.length > 0 &&
          <ResultTabList
            ref={this.tabsListRef}
            my={4}
            width="100%"
            maxWidth={1444}
            tabHeight={50}
            color={JYS_KEBIAO_COLOR}
            titles={tabTitles}
            pages={pageTables} />
        }
      </Flex>
    );
  }
}

const mapStateToProps = (state, props) => {
  const { groupStageWeekId, groupList } = props;
  console.log("mapStateToProps: "+groupStageWeekId + groupList);
  return {
    schoolYear: getSchoolYear(state),
    schoolWeek: getSchoolWeek(state),
    groupList: getRawplanGroups(state),
    groupStageWeekId: getSelectedGroup(state),
    planRows: getPlansByGroup(state, groupStageWeekId),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    ...bindActionCreators(rawplanActions, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(JwcKebiaoScreen));
