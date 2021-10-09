/* @flow */

import React, { Component } from 'react';
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { withTranslation } from 'react-i18next';
import {
  Flex,
  Text,
  Box,
} from '@chakra-ui/core';

import {
  SubjectBoard,
  ResultTable,
} from '../components';

import { getSchoolYear, getSchoolWeek } from '../redux/modules/grade';
import { actions as rawplanActions, getRawplanGroups, getSelectedGroup, getPlansByGroup, buildGroupStageWeekId} from '../redux/modules/rawplan';

import { SEMESTER_WEEK_COUNT } from './common/info';

const DEFAULT_COLOR = "red";
const TEACHER_ITEM_COLOR = "pink.400";
const SEMESTER_FIRST_HALF_MAX_WEEK = 9;
const SEMESTER_HALF_BIAS_WEEK = 6;
class JwcKebiaoScreen extends Component {
  constructor(props) {
    super (props);
    const { t, schoolWeek, color } = props;
    let weekIdx = schoolWeek ? schoolWeek : 1;
    this.state = {
      selectedGroupIndex: 0,
      selectedWeek: SEMESTER_HALF_BIAS_WEEK + ((weekIdx<=SEMESTER_FIRST_HALF_MAX_WEEK)?0:SEMESTER_FIRST_HALF_MAX_WEEK),
      selectedGrade: 0,
      selectedDegree: 0,
    };
    this.color = color ? color : DEFAULT_COLOR;
    this.groupTitle = t("jwcKebiaoScreen.class_group");
    //this.tabTitles = [];
    this.semesterPages = [{name: t("kebiao.semester_first_half")}, {name: t("kebiao.semester_second_half")}];
    this.tableHeaders = [
      {name: t("jwcKebiaoScreen.banji_sched_title"), field: "class_name"},
      {name: t("jwcKebiaoScreen.classroom"), field: "classroom", width: 65},
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
    ];
    this.tableData = null;
    this.tabsListRef = React.createRef();
  }

  componentDidMount() {
    this.loadData();
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { schoolYear, groupList, planRows, groupStageWeekId } = this.props;
    const { selectedGroupIndex, selectedGrade, selectedDegree } = this.state;
    if (nextProps.schoolYear !== schoolYear || nextProps.groupList !== groupList || nextProps.planRows !== planRows || nextProps.groupStageWeekId !== groupStageWeekId) {
      //console.log("shouldComponentUpdate, props diff");
      return true;
    } else if (nextState.selectedGrade !== selectedGrade || nextState.selectedDegree !== selectedDegree) {
      //console.log("shouldComponentUpdate, state diff");
      return true;
    } else if (nextState.selectedGroupIndex !== selectedGroupIndex) {
      // Group content changed, parse the list again to get proper grade and degree id.
      this.setSubjectSelectedIndex(nextState.selectedGroupIndex);
      return false;
    }
    return false;
  }

  componentDidUpdate(prevProps, prevState) {
    //console.log("LIFECYCLE: componentDidUpdate");
    if (this.props.groupStageWeekId !== this.getCurrentSelectionId(this.props, this.state)) {
      // Whatever stage, degree, grade, week differs with STATE, it goes here.
      if (prevProps.schoolYear !== this.props.schoolYear) {
        //console.log("LIFECYCLE: componentDidUpdate: LoadGroups");
        this.resetData();
        this.loadGroups();
      } else {
        //console.log("LIFECYCLE: componentDidUpdate: loadKebiao");
        this.loadKebiao(this.state.selectedWeek);
      }
    }
  }

  loadData = () => {
    const { groupList } = this.props;
    if (!groupList || groupList.length === 0) { // only get subjects when it's empty
      this.loadGroups();
    }
  }

  resetData = () => {
    console.log("reset raw plan data");
    this.tableData = null;
    // Decide if selections will be cleared when OFFICER change the stage selector.
    //const { schoolWeek } = this.props;
    //this.setState({
      //selectedGroupIndex: 0,
      //selectedWeek: schoolWeek ? schoolWeek : 1,  // Reset to 1st semi-semenster everytime stage changed.
    //});
    //this.props.clearSelectedGroup();
  }

  loadGroups = () => {
    const { schoolYear, schoolWeek } = this.props;
    if (!schoolYear || !schoolWeek) {
      return;
    }
    console.log("loadGroups of year: "+schoolYear);
    this.props.fetchGroups(schoolYear);
  }

  onSubjectSelected = (index_array) => {
    let index = index_array[0];
    this.setSubjectSelectedIndex(index);
    this.loadKebiao(this.state.selectedWeek);
  }

  setSubjectSelectedIndex = (index) => {
    const { groupList } = this.props;
    let group_info = null;
    if (groupList && index < groupList.length) {
      group_info = groupList[index];
    } else {
      group_info = null;
    }
    if (!group_info) {
      group_info = {degree: 0, grade: 0};
    }
    this.setState({
      selectedGroupIndex: index,
      selectedGrade: group_info.grade,
      selectedDegree: group_info.degree,
    });
  }

  getCurrentSelectionId = (props, state) => {
    const { schoolYear } = props;
    const { selectedGrade, selectedDegree, selectedWeek } = state;
    let ret = buildGroupStageWeekId(schoolYear, selectedWeek, selectedDegree, selectedGrade);
    console.log("getCurrentSelectionId: "+ret);
    return ret;
  }

  loadKebiao = (weekIdx) => {
    const { schoolYear } = this.props;
    const { selectedGrade, selectedDegree } = this.state;
    console.log("loadKebiao, grade: "+selectedGrade+" degree: "+selectedDegree);
    if (schoolYear < 1 || weekIdx < 0 || (selectedDegree === 0 && selectedGrade === 0)) {
      return;
    }
    this.props.fetchRawplan(schoolYear, weekIdx, selectedDegree, selectedGrade);  //stage, weekIdx, degreeId, gradeId
  }

  onSemesterPageChanged = (index) => {
    const { semesterPages } = this;
    console.log("onSemesterPageChanged: "+semesterPages[index].name);
    let shixunSelectWeek = index*(SEMESTER_FIRST_HALF_MAX_WEEK)+SEMESTER_HALF_BIAS_WEEK;
    this.setState({
      selectedWeek : shixunSelectWeek
    });
    this.loadKebiao(shixunSelectWeek);
  }

  render() {
    const { t, groupList, planRows, groupStageWeekId, schoolWeek } = this.props;
    const { selectedGroupIndex } = this.state;
    const { color, groupTitle, onSubjectSelected, onSemesterPageChanged, 
      tableTitle, tableHeaders, semesterPages } = this;
    //const pageTables = [];
    //console.log("render: plans "+JSON.stringify(planRows));
    console.log("render: group_id: "+groupStageWeekId);

    return (
      <Flex width="100%" direction="column" align="center" flex={1} mb={5}>
        {
          groupList && groupList.length > 0 &&
          <SubjectBoard
            my={4}
            color={color}
            title={groupTitle}
            subjects={groupList}
            initSelectIndex={selectedGroupIndex}
            selectionChanged={onSubjectSelected}
            t = {t}
            enableSelect={true}
            enableAutoTitle={true} />
        }
        {
          planRows &&
          <ResultTable
            flex={1}
            minHeight={planRows.length>13?950:450}
            titleHeight={50}
            colLineHeight={20}
            defaultColWidth={180}
            title={t("jwcKebiaoScreen.title")+" ["+groupStageWeekId+"]"}
            color={color}
            headers={tableHeaders}
            data={planRows}
            pageNames={semesterPages}
            pagePrevCaption={t("common.previous")}
            pageNextCaption={t("common.next")}
            onResultPageIndexChanged={onSemesterPageChanged}
            initPageIndex={schoolWeek<=SEMESTER_FIRST_HALF_MAX_WEEK?0:1}
            //pageInputCaption={[t("kebiao.input_semester_week_prefix"), t("kebiao.input_semester_week_suffix")]}
            />
        }
      </Flex>
    );
  }
}

const mapStateToProps = (state, props) => {
  const { groupStageWeekId } = props;
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
