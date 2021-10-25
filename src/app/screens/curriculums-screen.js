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
  EditableTable,
} from '../components';

import { getSchoolYear } from '../redux/modules/grade';
import { getDepartmentId } from '../redux/modules/auth';
import { actions as gradeActions, getGradeDegreeGroups } from '../redux/modules/grade';
import { actions as curriculumsActions, buildDataIdentifier, getSelectedDataId, getCurriculumList } from '../redux/modules/curriculums';

const DEFAULT_COLOR = "red";
class CurriculumsScreen extends Component {
  constructor(props) {
    super (props);
    const { t, color, userDepartmentId } = props;
    this.state = {
      selectedGroupIndex: 0,
      selectedGrade: 0,
      selectedDegree: 0,
      selectedDepartment: userDepartmentId,
    };
    this.color = color ? color : DEFAULT_COLOR;
    this.groupTitle = t("jwcKebiaoScreen.class_group");
    //this.tabTitles = [];
    this.semesterPages = [];
    this.tableHeaders = [
      {name: t("curriculumsScreen.list_header_id"), field: "id", width: 80},
      {name: t("curriculumsScreen.list_header_class_name"), field: "class_name", width: 180},
      {name: t("curriculumsScreen.list_header_major_id"), field: "major_id", width: 80},
      {name: t("curriculumsScreen.list_header_name"), field: "name", editable: true},
      {name: t("curriculumsScreen.list_header_short"), field: "short_name", editable: true},
      {name: t("curriculumsScreen.list_header_description"), field: "description", editable: true},
      {name: t("curriculumsScreen.list_header_hours_total"), field: "total_times_of_term", editable: true, width: 80},
      {name: t("curriculumsScreen.list_header_hours_theory"), field: "theory_times_of_term", editable: true, width: 80},
      {name: t("curriculumsScreen.list_header_hours_lab"), field: "test_times_of_term", editable: true, width: 80},
      {name: t("curriculumsScreen.list_header_department_id"), field: "department_id", editable: true},
      {name: t("curriculumsScreen.list_header_doc_id"), field: "doc_id", width: 80},
      {name: t("curriculumsScreen.list_header_teachers"), field: "teachers", dataType: "teacher_obj_array", editable: true},
      {name: t("curriculumsScreen.list_header_priority"), field: "priority", width: 80},
      {name: t("curriculumsScreen.list_header_created"), field: "created_at"},
      {name: t("curriculumsScreen.list_header_updated"), field: "updated_at"},
    ];
    this.tableData = null;
    this.tabsListRef = React.createRef();
  }

  componentDidMount() {
    const { groupList } = this.props;
    if (!groupList || groupList.length === 0) { // only get subjects when it's empty
      this.loadGroups();
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { schoolYear, groupList, dataRows, selectedDataId } = this.props;
    const { selectedGroupIndex, selectedGrade, selectedDegree } = this.state;
    if (nextState.selectedGroupIndex !== selectedGroupIndex || nextProps.groupList !== groupList) {
      // Group content changed, parse the list again to get proper grade and degree id.
      this.setSubjectSelectedIndex(nextProps, nextState.selectedGroupIndex);
      console.log("LIFECYCLE: shouldComponentUpdate: setSubjectSelectedIndex");
      return true;
    }
    if (nextProps.groupList !== groupList || nextProps.dataRows !== dataRows || nextProps.selectedDataId !== selectedDataId) {
      console.log("LIFECYCLE: shouldComponentUpdate, props diff");
      return true;
    }
    if (selectedDataId !== this.getCurrentSelectionId(nextProps, nextState)) {
      // Whatever stage, degree, grade, department differs with STATE, it goes here.
      if (nextProps.schoolYear !== schoolYear) {
        console.log("LIFECYCLE: componentDidUpdate: LoadGroups");
        this.resetData();
        this.loadGroups(nextProps.schoolYear);
      } else {
        console.log("LIFECYCLE: componentDidUpdate: loadKebiao");
        this.loadKebiao(nextProps, nextState);
      }
    }
    console.log("LIFECYCLE: shouldComponentUpdate: return false");
    return false;
  }

  componentDidUpdate(prevProps, prevState) {
    console.log("LIFECYCLE: componentDidUpdate");
    /*
    if (this.props.selectedDataId !== this.getCurrentSelectionId(this.props, this.state)) {
      // Whatever stage, degree, grade, department differs with STATE, it goes here.
      if (prevProps.schoolYear !== this.props.schoolYear) {
        console.log("LIFECYCLE: componentDidUpdate: LoadGroups");
        this.resetData();
        this.loadGroups();
      } else {
        console.log("LIFECYCLE: componentDidUpdate: loadKebiao");
        this.loadKebiao();
      }
    }*/
  }

  resetData = () => {
    console.log("reset raw plan data");
    this.tableData = null;
    // Decide if selections will be cleared when OFFICER change the stage selector.
    this.setState({
      //selectedGroupIndex: 0,
      selectedGrade: 0,
      selectedDegree: 0,
    });
    //this.props.clearSelectedGroup();
  }

  loadGroups = (stage=0) => {
    if (stage <= 0) {
      stage = this.props.schoolYear;
      if (!stage) {
        return;
      }
    }
    console.log("loadGroups of year: "+stage);
    this.props.fetchGroups(stage);
  }

  onSubjectSelected = (index_array) => {
    let index = index_array[0];
    this.setSubjectSelectedIndex(this.props, index);
    this.loadKebiao();
  }

  setSubjectSelectedIndex = (props, index) => {
    const { groupList } = props;
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
    const { selectedGrade, selectedDegree, selectedDepartment } = state;
    let ret = buildDataIdentifier(schoolYear, selectedDepartment, selectedDegree, selectedGrade);
    console.log("getCurrentSelectionId: "+ret);
    return ret;
  }

  loadKebiao = (props=this.props, state=this.state) => {
    const { schoolYear } = props;
    const { selectedGrade, selectedDegree, selectedDepartment } = state;
    console.log("loadKebiao, grade: "+selectedGrade+" degree: "+selectedDegree);
    if (schoolYear < 1 || selectedDepartment < 1 || (selectedDegree === 0 && selectedGrade === 0)) {
      console.log("loadKebiao: Ignore!");
      return;
    }
    this.props.fetchList(schoolYear, selectedDepartment, selectedDegree, selectedGrade);
  }

  onSemesterPageChanged = (index) => {

  }

  render() {
    const { t, groupList, dataRows, selectedDataId } = this.props;
    const { selectedGroupIndex } = this.state;
    const { color, groupTitle, onSubjectSelected, onSemesterPageChanged, 
      tableTitle, tableHeaders, semesterPages } = this;
    //const pageTables = [];
    console.log("render: plans "+JSON.stringify(dataRows));
    console.log("render: group_id: "+selectedDataId);

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
          <EditableTable
            flex={1}
            minHeight={dataRows.length>13?950:450}
            titleHeight={50}
            colLineHeight={20}
            defaultColWidth={180}
            title={t("curriculumsScreen.table_title")+" ["+selectedDataId+"]"}
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

const mapStateToProps = (state) => {
  return {
    schoolYear: getSchoolYear(state),
    groupList: getGradeDegreeGroups(state),
    selectedDataId: getSelectedDataId(state),
    dataRows: getCurriculumList(state),
    userDepartmentId: getDepartmentId(state),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    ...bindActionCreators(gradeActions, dispatch),
    ...bindActionCreators(curriculumsActions, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(CurriculumsScreen));
