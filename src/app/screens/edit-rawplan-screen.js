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
  ResultTable,
} from '../components';

import { getSchoolYear, getSchoolWeek } from '../redux/modules/grade';
import { actions as rawplanActions, getRawplanGroups, getSelectedGroup, getPlansByGroup} from '../redux/modules/rawplan';
import { EditableTable } from '../components/result-table/editable-table';
import { SEMESTER_WEEK_COUNT } from './common/info';

const JYS_KEBIAO_COLOR = "red";
const TEACHER_ITEM_COLOR = "pink.400";
const SEMESTER_FIRST_HALF_MAX_WEEK = 9;
const SEMESTER_HALF_BIAS_WEEK = 6;
class EditRawplanScreen extends Component {
  constructor(props) {
    super (props);
    const { t, schoolWeek } = props;
    let weekIdx = schoolWeek ? schoolWeek : 1;
    this.state = {
      selectedSubjectIndex: 0,
      selectWeek: SEMESTER_HALF_BIAS_WEEK + ((weekIdx<=SEMESTER_FIRST_HALF_MAX_WEEK)?0:SEMESTER_FIRST_HALF_MAX_WEEK),
    };
    this.groupTitle = t("jwcKebiaoScreen.class_group");
    //this.tabTitles = [];
    this.semesterPages = [{name: t("kebiao.semester_first_half")}, {name: t("kebiao.semester_second_half")}];
    this.tableHeaders = [
      {name: t("jwcKebiaoScreen.banji_sched_title"), field: "class"},
      {name: t("jwcKebiaoScreen.classroom"), field: "room", width: 50, editable: true},
      {name: t("jwcKebiaoScreen.mon_12"), field: "mon_12", renderer: "course_teacher_renderer", editable: true},
      {name: t("jwcKebiaoScreen.mon_34"), field: "mon_34", renderer: "course_teacher_renderer", editable: true},
      {name: t("jwcKebiaoScreen.mon_56"), field: "mon_56", renderer: "course_teacher_renderer", editable: true},
      {name: t("jwcKebiaoScreen.mon_78"), field: "mon_78", renderer: "course_teacher_renderer", editable: true},
      {name: t("jwcKebiaoScreen.tue_12"), field: "tue_12", renderer: "course_teacher_renderer", editable: true},
      {name: t("jwcKebiaoScreen.tue_34"), field: "tue_34", renderer: "course_teacher_renderer", editable: true},
      {name: t("jwcKebiaoScreen.tue_56"), field: "tue_56", renderer: "course_teacher_renderer", editable: true},
      {name: t("jwcKebiaoScreen.tue_78"), field: "tue_78", renderer: "course_teacher_renderer", editable: true},
      {name: t("jwcKebiaoScreen.wed_12"), field: "wed_12", renderer: "course_teacher_renderer", editable: true},
      {name: t("jwcKebiaoScreen.wed_34"), field: "wed_34", renderer: "course_teacher_renderer", editable: true},
      {name: t("jwcKebiaoScreen.wed_56"), field: "wed_56", renderer: "course_teacher_renderer", editable: true},
      {name: t("jwcKebiaoScreen.wed_78"), field: "wed_78", renderer: "course_teacher_renderer", editable: true},
      {name: t("jwcKebiaoScreen.thu_12"), field: "thu_12", renderer: "course_teacher_renderer", editable: true},
      {name: t("jwcKebiaoScreen.thu_34"), field: "thu_34", renderer: "course_teacher_renderer", editable: true},
      {name: t("jwcKebiaoScreen.thu_56"), field: "thu_56", renderer: "course_teacher_renderer", editable: true},
      {name: t("jwcKebiaoScreen.thu_78"), field: "thu_78", renderer: "course_teacher_renderer", editable: true},
      {name: t("jwcKebiaoScreen.fri_12"), field: "fri_12", renderer: "course_teacher_renderer", editable: true},
      {name: t("jwcKebiaoScreen.fri_34"), field: "fri_34", renderer: "course_teacher_renderer", editable: true},
      {name: t("jwcKebiaoScreen.fri_56"), field: "fri_56", renderer: "course_teacher_renderer", editable: true},
      {name: t("jwcKebiaoScreen.fri_78"), field: "fri_78", renderer: "course_teacher_renderer", editable: true},
    ];
    this.tableData = null;
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

  buildData = () => {
    this.buildGroups();
  }

  onSubjectClicked = (index) => {
    console.log(`onSubjectClicked ${this.groups[index].title}`);
    this.setState({
      selectedSubjectIndex: index,
    });
    this.setSubjectSelectedIndex(index);
    this.loadKebiao(this.state.selectWeek);
    //this.tabTitles.push(this.groups[index].name);
  }

  setSubjectSelectedIndex = (index) => {
    if (this.groups && index < this.groups.length) {
      this.selectedSubject = this.groups[index];
    } else {
      this.selectedSubject = null;
    }
  }

  loadKebiao = (weekIdx) => {
    const { schoolYear } = this.props;
    let grade_id = this.selectedSubject.grade;
    let degree_id = this.selectedSubject.degree;
    console.log("loadKebiao, grade: "+grade_id+" degree: "+degree_id);
    this.props.fetchRawplan(schoolYear, weekIdx, degree_id, grade_id);  //stage, weekIdx, degreeId, gradeId
    this.setState({
      hasFetchKebiao: true
    });
  }

  onSemesterPageChanged = (index) => {
    const { semesterPages } = this;
    console.log("onSemesterPageChanged: "+semesterPages[index].name);
    let shixunSelectWeek = index*(SEMESTER_FIRST_HALF_MAX_WEEK)+SEMESTER_HALF_BIAS_WEEK;
    this.setState({
      selectWeek : shixunSelectWeek
    });
    this.loadKebiao(shixunSelectWeek);
  }

  onCellClicked = (e) => {
    const { multiSelect, singleSelect } = this.props;
    if (multiSelect) {
      this.onMultiCellClicked(e);
    } else if (singleSelect) {
      this.onSingleCellClicked(e);
    }

    const { onCellClicked : onCellClickedCb } = this.props;
    if (onCellClickedCb) {
      onCellClickedCb(e);
    }
  }

  onCellValueChanged = (params) => {
    let dest_col = params.colDef.field;
    console.log("onCellValueChanged: newValue:"+JSON.stringify(params.newValue)+" oldValue:"+params.oldValue+" ColRef:"+JSON.stringify(params.colDef));
    console.log("onCellValueChanged: cell obj:"+JSON.stringify(params.data[dest_col]))
    if (!params.newValue || params.newValue.length < 1) {
      // Delete the old value from state
      return true;
    }
    if (params.oldValue && params.newValue.length > 1 && params.newValue === params.oldValue) {
      // Compare value with no change
      return;
    }
    //TODO: Dispatch action for the value change!

  }

  render() {
    const { t, groupList, planRows, groupStageWeekId, schoolWeek } = this.props;
    this.buildData();
    //const { selectedTeacherIndex } = this.state;
    const { groupTitle, onSubjectClicked, onSemesterPageChanged, onCellClicked, onCellValueChanged,
      tableTitle, tableHeaders, semesterPages } = this;
    //const pageTables = [];
    //console.log("render: plans "+JSON.stringify(planRows));
    console.log("render: group_id: "+groupStageWeekId);

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
          planRows && planRows.length > 0 &&
          <EditableTable
            height={450}
            titleHeight={50}
            colLineHeight={20}
            defaultColWidth={180}
            title={tableTitle}
            color={JYS_KEBIAO_COLOR}
            headers={tableHeaders}
            data={planRows}
            pageNames={semesterPages}
            pagePrevCaption={t("common.previous")}
            pageNextCaption={t("common.next")}
            //onResultPageIndexChanged={onSemesterPageChanged}
            initPageIndex={schoolWeek<=SEMESTER_FIRST_HALF_MAX_WEEK?0:1}
            onCellValueChanged={onCellValueChanged}
            onCellClicked={onCellClicked}
            //pageInputCaption={[t("kebiao.input_semester_week_prefix"), t("kebiao.input_semester_week_suffix")]}
            />
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

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(EditRawplanScreen));
