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
import { actions as teacherActions, buildTeacherSchedId, getTeachersByAllJys, getKebiaoByTeacherSched, getTeachersBySelectedJys } from '../redux/modules/teacher';
import { getKebiao } from '../redux/modules/kebiao';

import { SEMESTER_WEEK_COUNT } from './common/info';

const JYS_KEBIAO_COLOR = "red";
const TEACHER_ITEM_COLOR = "pink.400";
class JysKebiaoScreen extends Component {
  constructor(props) {
    super (props);
    const { t, schoolWeek } = props;
    this.state = {
      selectedTeacherIds: [],
      defaultTeacherId: -1,
      selectedJysId: -1,
      selectWeek: schoolWeek ? schoolWeek : 1,
    };

    this.tabTitles = [];
    this.semesterPages = [];
    this.tableHeaders = [
      {name: t("kebiao.sched_title"), field: "sched_name"},
      {name: t("kebiao.sched_monday"), field: "monday"},
      {name: t("kebiao.sched_tuesday"), field: "tuesday"},
      {name: t("kebiao.sched_wednesday"), field: "wednesday"},
      {name: t("kebiao.sched_thursday"), field: "thursday"},
      {name: t("kebiao.sched_friday"), field: "friday"},
      {name: t("kebiao.sched_saturday"), field: "saturday"},
      {name: t("kebiao.sched_sunday"), field: "sunday"},
    ];
    this.tableData = null;
    this.tableFieldNames = [
      "sched_name", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"
    ];
    this.tableRowNames = [
      t("kebiao.sched_12")+t("kebiao.sched_unit"),
      t("kebiao.sched_34")+t("kebiao.sched_unit"),
      t("kebiao.sched_5")+t("kebiao.sched_unit"),
      t("kebiao.sched_67")+t("kebiao.sched_unit"),
      t("kebiao.sched_89")+t("kebiao.sched_unit"),
      t("kebiao.sched_1011")+t("kebiao.sched_unit"),
      t("kebiao.sched_1213")+t("kebiao.sched_unit"),
    ];

    this.tabsListRef = React.createRef();
    this.buildSemester();
  }

  static getDerivedStateFromProps(props) {
    let result = {};
    if (props.location.state.jys && props.location.state.jys.id) {
      result = {...result, ...{
        selectedJysId: props.location.state.jys.id
      }};
    }
    if (typeof props.location.state.teacherId === 'number') {
      result = {...result, ...{
        selectedTeacherIds: [props.location.state.teacherId],
        defaultTeacherId: props.location.state.teacherId
       }};
    }
    console.log("getDerivedStateFromProps, ret: "+JSON.stringify(result));
    return result;
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { schoolYear, schoolWeek, teachersBySelectedJys, kebiaoByTeacherSched, kebiaoByIds } = this.props;
    const { selectWeek, selectedJysId, selectedTeacherIds } = this.state;
    // console.log("shouldComponentUpdate, origin grd: "+JSON.stringify(location.state.grd)+", origin edu: "+JSON.stringify(location.state.edu));
    // console.log("shouldComponentUpdate, grd: "+JSON.stringify(nextProps.location.state.grd)+", edu: "+JSON.stringify(nextProps.location.state.edu));
    if (nextState.selectedJysId !== selectedJysId) {      
      console.log("shouldComponentUpdate, location state diff");
      return true;
    } else if (nextProps.schoolYear !== schoolYear || nextProps.schoolWeek !== schoolWeek || nextProps.teachersBySelectedJys !== teachersBySelectedJys
    || nextProps.kebiaoByTeacherSched !== kebiaoByTeacherSched || nextProps.kebiaoByIds !== kebiaoByIds) {
      console.log("shouldComponentUpdate, props diff");
      return true;
    } else if (nextState.selectWeek !== selectWeek || nextState.selectedTeacherIds !== selectedTeacherIds) {
      console.log("shouldComponentUpdate, week or teacher diff");
      //this.buildKebiao(nextState.selectedTeacherIds);
      return true;
    }
    return false;
  }

  componentDidMount() {
    this.loadTeachers(this.state.selectWeek, this.state.selectedJysId);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.selectedJysId !== this.state.selectedJysId) {
      this.resetData();
      this.loadTeachers(this.state.selectWeek, this.state.selectedJysId);
    }
    if (prevState.selectWeek !== this.state.selectWeek || prevState.selectedTeacherIds !== this.state.selectedTeacherIds) {
      this.buildKebiao(this.state.selectedTeacherIds);
    }
  }

  resetData = () => {
    console.log("reset shixun data");
    const { schoolWeek } = this.props;
    //this.teacherList = null;
    this.selectedTeacher = null;
    this.tableData = null;
    this.setState({
      //selectedTeacherIndex: 0,
      defaultTeacherId: -1,
      selectWeek: schoolWeek ? schoolWeek : 1,
    });
  }

  loadTeachers = (selectWeek, jysId=0) => {
    const { schoolYear, schoolWeek } = this.props;
    if (!schoolYear || !schoolWeek) {
      return;
    }
    const { jys } = this.props.location.state;
    let dest_jydId = jysId>0?jysId:jys.id;
    console.log("loadTeachers, jys: "+dest_jydId+" year: "+schoolYear+" week: "+selectWeek);
    this.props.fetchTeachersByJys(dest_jydId, schoolYear, selectWeek);
  }

  //buildData = () => {
    //this.buildSemester();
    //this.buildTeachers();
    //this.buildKebiao();
  //}

  buildSemester = () => {
    const { t } = this.props;
    const { semesterPages } = this;
    if (semesterPages.length === 0) {
      for (let i=0; i < SEMESTER_WEEK_COUNT; i++) {
        semesterPages.push({ name: t("kebiao.semester_week_template", {index: i+1}) });
      }
    }
  }

  buildTeachers = () => {/*
    const { jys } = this.props.location.state;
    const { t, teachersByJys } = this.props;
    const { selectedTeacherIndex } = this.state;
    const jysInfo = teachersByJys[jys.id];
    if (jysInfo && jysInfo.teachers) {
      this.teacherList = jysInfo.teachers.map(teacher => {
        return {...teacher, color: TEACHER_ITEM_COLOR };
      });
      this.teacherList.splice(0, 0, {title: t("jysKebiaoScreen.all_teachers"), color: TEACHER_ITEM_COLOR})
      console.log("TeacherList: "+JSON.stringify(this.teacherList));
      if (selectedTeacherIndex > 0 && selectedTeacherIndex < this.teacherList.length) {
        this.selectedTeacher = this.teacherList[selectedTeacherIndex];
      } else {
        this.selectedTeacher = null;
      }
    }
    this.updateTeacherTitle();*/
  }

  /*updateTeacherTitle = () => {
    const { t } = this.props;
    const { jys } = this.props.location.state;
    const { selectedTeacher } = this;
    if (selectedTeacher) {
      this.teacherTitle = t("subjectBoard.title_teacher_template", {teacher_name: selectedTeacher.title, jys_name: jys.name});
    } else {
      this.teacherTitle = t("subjectBoard.title_no_teacher_template", {jys_name: jys.name});
    }
  }*/

  buildKebiao = (selectedTeacherIds=[]) => {
    const { jys } = this.props.location.state;
    const { t, teachersBySelectedJys } = this.props;
    this.tableTitle = t("jysKebiaoScreen.table_title_template", {teacher_info: jys.name});
    if (selectedTeacherIds.length < 1) {
      // Select none teacher
      this.tableTitle += " "+t("jysKebiaoScreen.no_selection");
      this.tableData = [];
    }
    else if (selectedTeacherIds.length === teachersBySelectedJys.length){
      // Select all teachers
      this.tableData = this.buildJysKebiaoTable();
    }
    else {
      this.tableData = this.buildTeacherKebiaoTable(selectedTeacherIds[0]);
    }
    console.log("buildKebiao: tableData:"+JSON.stringify(this.tableData));
    //this.updateTabTitles();
  }

  buildJysKebiaoTable = () => {
    // Build kebiao with all teachers in this department
    const { teachersBySelectedJys, kebiaoByTeacherSched, schoolYear } = this.props;
    const { selectWeek } = this.state;
    const { tableFieldNames, tableRowNames } = this;
    let resultList = [];
    //console.log("buildJysKebiaoTable: "+JSON.stringify(kebiaoByTeacherSched));
    for (let teacherIndex=1; teacherIndex < teachersBySelectedJys.length; teacherIndex++) {
      const teacherInfo = teachersBySelectedJys[teacherIndex];
      const teacherSchedId = buildTeacherSchedId(teacherInfo.id, schoolYear, selectWeek);
      const kebiaoInfo = kebiaoByTeacherSched.get(teacherSchedId);
      //console.log(`Get TeacherSchedId: ${teacherSchedId}, data: ${JSON.stringify(kebiaoInfo)}`);
      for (let i=1; i < tableFieldNames.length; i++) {
        const kebiaoInDay = kebiaoInfo ? kebiaoInfo.schedules[i-1] : null;
        for (let j=0; j < tableRowNames.length; j++) {
          if (!resultList[j]) {
            resultList[j] = {};
            resultList[j][tableFieldNames[0]] = tableRowNames[j];
          }
          let names = [];
          let hourIndex = j;
          if (j === 2) { // all 5 are course "shizheng", always empty string
            resultList[j][tableFieldNames[i]] = "";
            continue;
          } else if (j > 2) {
            hourIndex = j-1;
          }

          let kebiaoHourList = kebiaoInDay ? kebiaoInDay[hourIndex] : [];
          if (kebiaoHourList && kebiaoHourList.length > 0) {
            names.push(teacherInfo.title+this.buildJysKebiaoName(kebiaoHourList[0]));
          } else {
            kebiaoHourList = [];
          }
          let newInfo = resultList[j][tableFieldNames[i]];
          if (!newInfo) {
            newInfo = {title: "", data: []};
          }
          if (names.length > 0) {
            newInfo.title += " "+names.join(" ");
          }
          newInfo.data.push(...kebiaoHourList);
          resultList[j][tableFieldNames[i]] = newInfo;
        }
      }
    }
    //console.log("ResultList: "+JSON.stringify(resultList));
    return resultList;
  }

  buildJysKebiaoName = (kebiaoId) => {
    const { kebiaoByIds } = this.props;
    const kebiaoInfo = kebiaoByIds.get(kebiaoId);
    //console.log("buildKebiaoName: "+JSON.stringify(kebiaoInfo));
    let kebiaoName = "";
    if (kebiaoInfo.is_lab && kebiaoInfo.lab_location) {
      kebiaoName += "("+kebiaoInfo.lab_location+")";
    }
    return kebiaoName;
  }

  buildTeacherKebiaoName = (kebiaoId) => {
    const { kebiaoByIds } = this.props;
    const kebiaoInfo = kebiaoByIds.get(kebiaoId);
    //console.log("buildKebiaoName: "+JSON.stringify(kebiaoInfo));
    let kebiaoName = kebiaoInfo.curriculum;
    if (kebiaoInfo.is_lab && kebiaoInfo.lab_location && kebiaoInfo.lab_location !== "") {
      kebiaoName += " "+kebiaoInfo.lab_location;
    }
    if (kebiaoInfo.class_name && kebiaoInfo.class_name !== "") {
      kebiaoName += " ("+kebiaoInfo.class_name+")";
    }
    return kebiaoName;
  }

  buildTeacherKebiaoTable = (teacherId) => {
    const { kebiaoByTeacherSched, schoolYear } = this.props;
    const { selectWeek } = this.state;
    const { tableFieldNames, tableRowNames } = this;

    const teacherSchedId = buildTeacherSchedId(teacherId, schoolYear, selectWeek);
    console.log("Get kebiao of "+teacherSchedId);
    const kebiaoInfo = kebiaoByTeacherSched.get(teacherSchedId);
    let resultList = [];
    for (let i=1; i < tableFieldNames.length; i++) {
      const kebiaoInDay = kebiaoInfo ? kebiaoInfo.schedules[i-1] : null;
      for (let j=0; j < tableRowNames.length; j++) {
        if (!resultList[j]) {
          resultList[j] = {};
          resultList[j][tableFieldNames[0]] = tableRowNames[j];
        }
        let names = [];
        let hourIndex = j;
        if (j === 2) { // all 5 are course "shizheng", always empty string
          resultList[j][tableFieldNames[i]] = "";
          continue;
        } else if (j > 2) {
          hourIndex = j-1;
        }
        const kebiaoHourList = kebiaoInDay ? kebiaoInDay[hourIndex] : [];
        if (kebiaoHourList && kebiaoHourList.length > 0) {
          kebiaoHourList.forEach(kebiaoId => {
            let name = this.buildTeacherKebiaoName(kebiaoId);
            if (name) {
              names.push(name);
            }
          });
        }
        resultList[j][tableFieldNames[i]] = { titles: names, data: kebiaoHourList };
      }
    }
    //console.log("ResultList: "+JSON.stringify(resultList));
    return resultList;
  }

  /*updateTabTitles = () => {
    this.tabTitles = [];
    if (!this.teacherList) {
      return;
    }
    const { t } = this.props;
    const { selectedTeacher } = this;
    if (selectedTeacher) {
      this.tabTitles = [selectedTeacher.title];
    } else {
      this.tabTitles = [t("jysKebiaoScreen.all_teachers")];
    }
  }*/

  /*onTeacherClicked = (index) => {
    console.log(`onTeacherClicked`);
    this.setState({
      selectedTeacherIndex: index
    });
  }*/

  selectedIdsChanged = (teacherIds) => {
    console.log(`selectedIdsChanged ${teacherIds}`);
    this.setState({
      selectedTeacherIds: teacherIds
    });
  }

  onSemesterPageChanged = (index) => {
    const { semesterPages } = this;
    console.log("onSemesterPageChanged: "+semesterPages[index].name);
    let week_idx = index+1;
    this.setState({
      selectWeek : week_idx
    });
    this.loadTeachers(week_idx);
  }

  render() {
    const { t, teachersBySelectedJys } = this.props;
    const { defaultTeacherId, selectedTeacherIds, selectWeek } = this.state;
    const { tabTitles, tableHeaders, tableTitle, tableData, semesterPages, selectedIdsChanged,
      onSemesterPageChanged } = this;
    //const pageTables = [];
    console.log("renderer: tableData:"+JSON.stringify(tableData));
    console.log("renderer: teacherData:"+JSON.stringify(teachersBySelectedJys));
    console.log("renderer: selectedTeacherIds:"+JSON.stringify(selectedTeacherIds));

    return (
      <Flex width="100%" minHeight={750} direction="column" align="center">
        {
          teachersBySelectedJys && teachersBySelectedJys.length > 0 &&
          <SubjectBoard
            my={4}
            t={t}
            color={JYS_KEBIAO_COLOR}
            title={t("menuBar.jiaoyanshi_kebiao_title")}
            subjects={teachersBySelectedJys}
            //onSubjectClicked={onTeacherClicked}
            selectedIdsChanged={selectedIdsChanged}
            //initSelectIndex={selectedTeacherIndex}
            initSelectId={defaultTeacherId}
            enableSelectAll
            enableAutoTitle
            enableSelect />
        }
        {
          tableData && 
          <ResultTable
            height={450}
            titleHeight={50}
            colLineHeight={20}
            defaultColWidth={180}
            title={tableTitle}
            color={JYS_KEBIAO_COLOR}
            headers={tableHeaders}
            data={tableData}
            pageNames={semesterPages}
            pagePrevCaption={t("kebiao.prev_semester_week")}
            pageNextCaption={t("kebiao.next_semester_week")}
            onResultPageIndexChanged={onSemesterPageChanged}
            initPageIndex={selectWeek-1}
            pageInputCaption={[t("kebiao.input_semester_week_prefix"), t("kebiao.input_semester_week_suffix")]}/>
        }
      </Flex>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    schoolYear: getSchoolYear(state),
    schoolWeek: getSchoolWeek(state),
    //teachersByJys: getTeachersByAllJys(state),
    teachersBySelectedJys: getTeachersBySelectedJys(state),
    kebiaoByTeacherSched: getKebiaoByTeacherSched(state),
    kebiaoByIds:getKebiao(state),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    ...bindActionCreators(teacherActions, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(JysKebiaoScreen));
