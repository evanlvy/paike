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
  ResultTable,
} from '../components';

import { getSchoolYear, getSchoolWeek } from '../redux/modules/grade';
import { actions as rawplanActions, getRawplanGroups, getPlansByGroup } from '../redux/modules/rawplan';
import { actions as curriculumsActions, buildDataIdentifier, getSelectedDataId } from '../redux/modules/curriculums';

import { SEMESTER_WEEK_COUNT } from './common/info';

const DEFAULT_COLOR = "red";
class CurriculumsScreen extends Component {
  constructor(props) {
    super (props);
    const { t, color } = props;
    this.state = {
      selectedGroupIndex: 0,
      selectedGrade: 0,
      selectedDegree: 0,
      selectedDepartment: 0,
    };
    this.color = color ? color : DEFAULT_COLOR;
    this.groupTitle = t("jwcKebiaoScreen.class_group");
    //this.tabTitles = [];
    this.semesterPages = [];
    this.tableHeaders = [
      {name: t("curriculumsScreen.list_header_id"), field: "id", width: 80},
      {name: t("curriculumsScreen.list_header_name"), field: "name"},
      {name: t("curriculumsScreen.list_header_short"), field: "short_name"},
      {name: t("curriculumsScreen.list_header_description"), field: "description"},
      {name: t("curriculumsScreen.list_header_hours_total"), field: "total_times_of_term", width: 80},
      {name: t("curriculumsScreen.list_header_hours_theory"), field: "theory_times_of_term", width: 80},
      {name: t("curriculumsScreen.list_header_hours_lab"), field: "test_times_of_term", width: 80},
      {name: t("curriculumsScreen.list_header_class_name"), field: "class_name", width: 80},
      {name: t("curriculumsScreen.list_header_department_id"), field: "department_id"},
      {name: t("curriculumsScreen.list_header_major_id"), field: "major_id", width: 80},
      {name: t("curriculumsScreen.list_header_doc_id"), field: "doc_id", width: 80},
      {name: t("curriculumsScreen.list_header_teachers"), field: "teachers", renderer: "teachers_renderer"},
      {name: t("curriculumsScreen.list_header_priority"), field: "priority", width: 80},
      {name: t("curriculumsScreen.list_header_created"), field: "created_at"},
      {name: t("curriculumsScreen.list_header_updated"), field: "updated_at"},
    ];
    this.tableData = null;
    this.tabsListRef = React.createRef();
  }

  componentDidMount() {
    this.loadData();
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { schoolYear, groupList, dataRows, groupStageWeekId } = this.props;
    const { selectedGroupIndex, selectedGrade, selectedDegree } = this.state;
    if (nextProps.schoolYear !== schoolYear || nextProps.groupList !== groupList || nextProps.dataRows !== dataRows || nextProps.groupStageWeekId !== groupStageWeekId) {
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
    let ret = buildDataIdentifier(schoolYear, selectedWeek, selectedDegree, selectedGrade);
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
    this.props.fetchList(schoolYear, weekIdx, selectedDegree, selectedGrade);  //stage, weekIdx, degreeId, gradeId
  }

  onSemesterPageChanged = (index) => {
    /*
    const { semesterPages } = this;
    console.log("onSemesterPageChanged: "+semesterPages[index].name);
    let shixunSelectWeek = index*(SEMESTER_FIRST_HALF_MAX_WEEK)+SEMESTER_HALF_BIAS_WEEK;
    this.setState({
      selectedWeek : shixunSelectWeek
    });
    this.loadKebiao(shixunSelectWeek);*/
  }

  render() {
    const { t, groupList, dataRows, groupStageWeekId, schoolWeek } = this.props;
    const { selectedGroupIndex } = this.state;
    const { color, groupTitle, onSubjectSelected, onSemesterPageChanged, 
      tableTitle, tableHeaders, semesterPages } = this;
    //const pageTables = [];
    //console.log("render: plans "+JSON.stringify(dataRows));
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
          dataRows &&
          <ResultTable
            flex={1}
            minHeight={dataRows.length>13?950:450}
            titleHeight={50}
            colLineHeight={20}
            defaultColWidth={180}
            title={t("jwcKebiaoScreen.title")+" ["+groupStageWeekId+"]"}
            color={color}
            headers={tableHeaders}
            data={dataRows}
            pageNames={semesterPages}
            pagePrevCaption={t("common.previous")}
            pageNextCaption={t("common.next")}
            onResultPageIndexChanged={onSemesterPageChanged}
            //initPageIndex={schoolWeek<=SEMESTER_FIRST_HALF_MAX_WEEK?0:1}
            //pageInputCaption={[t("kebiao.input_semester_week_prefix"), t("kebiao.input_semester_week_suffix")]}
            />
        }
      </Flex>
    );
  }
}

const mapStateToProps = (state, props) => {
  const { selectedDataId } = props;
  return {
    schoolYear: getSchoolYear(state),
    schoolWeek: getSchoolWeek(state),
    groupList: getRawplanGroups(state),
    selectedDataId: getSelectedDataId(state),
    dataRows: getPlansByGroup(state, selectedDataId),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    ...bindActionCreators(rawplanActions, dispatch),
    ...bindActionCreators(curriculumsActions, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(CurriculumsScreen));
