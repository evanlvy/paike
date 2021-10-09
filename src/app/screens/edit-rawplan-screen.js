/* @flow */

import React, { Component } from 'react';
import { bindActionCreators } from "redux";
import { connect, useSelector } from "react-redux";
import { withTranslation } from 'react-i18next';
import {
  Box,
  Flex,
  Button,
  Text,
  Select,
  Icon,
} from '@chakra-ui/core';
import {
  MdTune
} from 'react-icons/md';
import {
  //SubjectBoard,
  ResultTable,
} from '../components';

import { getSchoolYear, getSchoolWeek, getStageList } from '../redux/modules/grade';
import { actions as rawplanActions, getRawplanGroups, getSelectedGroup, getPlansByGroup, countRowChanged, getTeacherStatistics} from '../redux/modules/rawplan';
import { EditableTable } from '../components/result-table/editable-table';
import { SEMESTER_WEEK_COUNT } from './common/info';
import PromptDrawer from '../components/overlays/prompt-drawer';

const DEFAULT_COLOR = "red";
const CANCEL_COLOR = "gray";
const SEMESTER_FIRST_HALF_MAX_WEEK = 9;
const SEMESTER_HALF_BIAS_WEEK = 6;
class EditRawplanScreen extends Component {
  constructor(props) {
    super (props);
    const { t, schoolWeek, color, schoolYear } = props;
    let weekIdx = schoolWeek ? schoolWeek : 1;
    this.state = {
      selectStage: schoolYear,
      selectWeek: SEMESTER_HALF_BIAS_WEEK + ((weekIdx<=SEMESTER_FIRST_HALF_MAX_WEEK)?0:SEMESTER_FIRST_HALF_MAX_WEEK),
    };
    //this.tabTitles = [];
    this.color = color ? color : DEFAULT_COLOR;
    this.semesterPages = {};
    this.semiSemesterPages = [{name: t("kebiao.semester_first_half")}, {name: t("kebiao.semester_second_half")}];
    this.statisticsTableHeaders = [
      {name: t("editRawplanScreen.header_teacher"), field: "name", width: 120, sortable: true, filter: true},
      {name: t("editRawplanScreen.header_weektotal"), field: "total", width: 80, sortable: true},
      {name: t("editRawplanScreen.header_conflict"), field: "conflicted", width: 420, renderer: "slot_weekday_renderer", sortable: true, resizable: true},
      {name: t("editRawplanScreen.header_overtime"), field: "overtime", width: 400, renderer: "slot_weekday_renderer", sortable: true, resizable: true},
    ];
    this.plansTableHeaders = [
      {name: t("jwcKebiaoScreen.banji_sched_title"), field: "class_name"},
      {name: t("jwcKebiaoScreen.classroom"), field: "classroom", width: 60, editable: true},
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
    this.planTableRef = React.createRef();
    let selectedSubject = {grade: 0, degree: 0}; // All grades, All degrees
    this.selectedSubject = selectedSubject;
    this.buildData();
  }

  componentDidMount() {
    this.loadData();
  }

  shouldComponentUpdate(nextProps) {
    const { schoolYear, stageList, planRows, changedRows, statistics } = this.props;
    //const { selectedSubjectIndex } = this.state;
    // console.log("shouldComponentUpdate, origin grd: "+JSON.stringify(location.state.grd)+", origin edu: "+JSON.stringify(location.state.edu));
    // console.log("shouldComponentUpdate, grd: "+JSON.stringify(nextProps.location.state.grd)+", edu: "+JSON.stringify(nextProps.location.state.edu));
    if (nextProps.schoolYear !== schoolYear || nextProps.statistics !== statistics || nextProps.changedRows !== changedRows) {
      console.log("shouldComponentUpdate, props diff");
      return true;
    } else if (nextProps.stageList !== stageList) {
      console.log("shouldComponentUpdate, stageList diff");
      this.buildSemester();
      return true;
    } else if (nextProps.planRows !== planRows) {
      console.log("shouldComponentUpdate, planRows diff");
      return false;
    } /*else if (nextState.selectedSubjectIndex !== selectedSubjectIndex) {
      console.log("shouldComponentUpdate, state diff");
      return true;
    }*/
    return false;
  }

  loadData = () => {
    if (!this.semesterPages || this.semesterPages.length === 0) {
      this.props.fetchStageList();
    }
    this.loadKebiao(this.state.selectStage, this.state.selectWeek);
  }

  buildData = () => {
    this.buildSemester();
  }

  resetData = () => {
    console.log("reset raw plan data");
    const { schoolWeek } = this.props;
    let weekIdx = schoolWeek ? schoolWeek : 1;
    this.setState({
      selectWeek: SEMESTER_HALF_BIAS_WEEK + ((weekIdx<=SEMESTER_FIRST_HALF_MAX_WEEK)?0:SEMESTER_FIRST_HALF_MAX_WEEK),
    });
  }

  buildSemester = () => {
    if (Object.keys(this.semesterPages).length <= 0) {
      this.semesterPages = {...this.props.stageList};
      console.log("buildSemester: stages: "+JSON.stringify(this.semesterPages));
    }
  }

  loadKebiao = (stageId, weekIdx) => {
    let grade_id = this.selectedSubject.grade;
    let degree_id = this.selectedSubject.degree;
    console.log("loadKebiao, grade: "+grade_id+" degree: "+degree_id);
    this.props.fetchRawplan(stageId, weekIdx, degree_id, grade_id);  //stage, weekIdx, degreeId, gradeId
    this.setState({
      hasFetchKebiao: true
    });
  }

  onSemiSemesterChanged = (index) => {
    const { semiSemesterPages } = this;
    console.log("onSemiSemesterChanged: "+semiSemesterPages[index].name);
    let shixunSelectWeek = index*(SEMESTER_FIRST_HALF_MAX_WEEK)+SEMESTER_HALF_BIAS_WEEK;
    this.setState({
      selectWeek : shixunSelectWeek
    });
    this.loadKebiao(this.state.selectStage, shixunSelectWeek);
  }

  onStageChanged = (event) => {
    let target_stage = event.target.value;
    this.setState({
      selectStage: target_stage
    });
    this.loadKebiao(target_stage, this.state.selectWeek);
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
    console.log("onCellValueChanged: cell obj:"+JSON.stringify(params.data[dest_col]));
    if (params.oldValue && params.newValue.length > 1 && params.newValue === params.oldValue) {
      // Compare value with no change
      return;
    }
    /*if (!params.newValue || params.newValue.length < 1) {
      // Delete the old value from state
      this.props.setPlanItem(params.data["id"], dest_col, null);
      return;
    }*/
    //Dispatch action for the value change!
    this.props.setRowChanged(this.props.groupStageWeekId, params.data["id"], dest_col, params.data[dest_col]);
  }

  onCommit = () => {
    let row_ids = this.props.getChangedRowIds();
    console.log("onCommit: changes: "+row_ids);
    row_ids.forEach(element => {
      this.props.commitRow(element);
    });
    this.props.clearRowChanges();
  }

  onRevert = () => {
    this.props.reloadRows();
  }

  onConflictIndicatorClicked = (rowIndex, colKey) => {
    this.planTableRef.current.editCell(rowIndex, colKey);
  }

  render() {
    const { t, planRows, schoolWeek, changedRows, statistics } = this.props;
    const { selectStage } = this.state;
    const { onSemiSemesterChanged, onCellClicked, onCellValueChanged, onCommit, onRevert, planTableRef, onConflictIndicatorClicked,
      plansTableHeaders, semiSemesterPages, color, semesterPages, onStageChanged, statisticsTableHeaders } = this;
    //const pageTables = [];
    //console.log("render: plans "+JSON.stringify(planRows));
    //console.log("render: group_id: "+groupStageWeekId+ " changedRows:"+changedRows, "statistics: "+JSON.stringify(statistics));

    return (
      <Flex width="100%"  flex={1} direction="column" align="center" mb={5}>
        <Box borderWidth={1} borderColor={color+".200"} borderRadius="md" overflowY="hidden" minW={833}>
          <Flex direction="row" alignItems="center" px={5} py={2}>
            <Icon as={MdTune} color={color+".200"} size={12} />
            <Text mx={5} whiteSpace="break-spaces" flexWrap="true">{t("editRawplanScreen.hint_stageselector")}</Text>
            {
              (semesterPages && Object.keys(semesterPages).length > 0) &&
              <Select width="100%" variant="filled" value={selectStage} onChange={onStageChanged}>
              {
                Object.keys(semesterPages).map((stage_id) => (
                  <option key={stage_id} value={stage_id} >{semesterPages[stage_id]}</option>
                ))
              }
              </Select>
            }
            <Button mx={5} minW={20} variantColor="green" onClick={() => planTableRef.current.exportCsv()}>{t("editRawplanScreen.export")}</Button>
            <PromptDrawer t={t} promptText={t("editRawplanScreen.prompt_text")}></PromptDrawer>
          </Flex>
        </Box>
        {
          statistics &&
          <ResultTable
            margin="5"
            maxWidth={1000}
            minHeight={statistics.length>3?350:180}
            titleHeight={50}
            colLineHeight={20}
            defaultColWidth={150}
            title={t("editRawplanScreen.title_statistics")}
            color={color}
            headers={statisticsTableHeaders}
            data={statistics}
            onCellIndicatorClicked={onConflictIndicatorClicked}
            />
        }
        {
          planRows &&
          <EditableTable
            ref={planTableRef}
            flex={1}
            minHeight={950}
            titleHeight={50}
            colLineHeight={15}
            defaultColWidth={180}
            title={t("editRawplanScreen.title_jwcplan")}
            color={color}
            headers={plansTableHeaders}
            data={planRows}
            pageNames={semiSemesterPages}
            pagePrevCaption={t("common.previous")}
            pageNextCaption={t("common.next")}
            onResultPageIndexChanged={onSemiSemesterChanged}
            initPageIndex={schoolWeek<=SEMESTER_FIRST_HALF_MAX_WEEK?0:1}
            onCellValueChanged={onCellValueChanged}
            onCellClicked={onCellClicked}
            //pageInputCaption={[t("kebiao.input_semester_week_prefix"), t("kebiao.input_semester_week_suffix")]}
            />
        }
        {
          changedRows>0 &&
          <p>
            <Button margin="5" variantColor={color} onClick={onCommit}>{t("editRawplanScreen.commit")}</Button>
            <Button margin="5" variantColor={CANCEL_COLOR} onClick={onRevert}>{t("editRawplanScreen.revert")}</Button>
          </p>
        }
      </Flex>
    );
  }
}

const mapStateToProps = (state/*, props*/) => {
  //const { groupStageWeekId, groupList } = props;
  //console.log("mapStateToProps: "+groupStageWeekId + groupList);
  return {
    schoolYear: getSchoolYear(state),
    schoolWeek: getSchoolWeek(state),
    stageList: getStageList(state),
    groupStageWeekId: getSelectedGroup(state),
    planRows: getPlansByGroup(state),
    changedRows: countRowChanged(state),
    statistics: getTeacherStatistics(state),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    ...bindActionCreators(rawplanActions, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(EditRawplanScreen));
