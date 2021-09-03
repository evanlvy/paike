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
import { actions as teacherActions, buildTeacherSchedId, getTeachersByAllJys, getKebiaoByTeacherSched } from '../redux/modules/teacher';
import { getKebiao } from '../redux/modules/kebiao';

import { SEMESTER_WEEK_COUNT } from './common/info';

const JYS_KEBIAO_COLOR = "red";
const TEACHER_ITEM_COLOR = "pink.400";
class JysKebiaoScreen extends Component {
  constructor(props) {
    super (props);
    const { t, schoolWeek } = props;
    this.state = {
      selectedTeacherIndex: 0,
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
    this.jysSelectWeek = schoolWeek ? schoolWeek : 1;

    this.tabsListRef = React.createRef();
  }

  componentDidMount() {
    this.loadData();
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { schoolYear, schoolWeek, teachersByJys, kebiaoByTeacherSched, kebiaoByIds, location } = this.props;
    const { selectedTeacherIndex, selectWeek } = this.state;
    // console.log("shouldComponentUpdate, origin grd: "+JSON.stringify(location.state.grd)+", origin edu: "+JSON.stringify(location.state.edu));
    // console.log("shouldComponentUpdate, grd: "+JSON.stringify(nextProps.location.state.grd)+", edu: "+JSON.stringify(nextProps.location.state.edu));
    if (nextProps.location.state.jys !== location.state.jys) {
      this.resetData();
      console.log("shouldComponentUpdate, location state diff");
      return true;
    } else if (nextProps.schoolYear !== schoolYear || nextProps.schoolWeek !== schoolWeek
    || nextProps.teachersByJys !== teachersByJys || nextProps.kebiaoByTeacherSched !== kebiaoByTeacherSched || nextProps.kebiaoByIds !== kebiaoByIds) {
      console.log("shouldComponentUpdate, props diff");
      return true;
    } else if (nextState.selectedTeacherIndex !== selectedTeacherIndex || nextState.selectWeek !== selectWeek) {
      console.log("shouldComponentUpdate, state diff");
      return true;
    }
    return false;
  }

  loadData = () => {
    if (!this.teacherList || this.teacherList.length === 0) { // only get subjects when it's empty
      const { schoolWeek } = this.props;
      console.log("loadTeacherKebiao: schoolWeek: "+schoolWeek);
      this.jysSelectWeek = schoolWeek;
      this.loadTeachers(this.jysSelectWeek);
    }
  }

  resetData = () => {
    console.log("reset shixun data");
    const { schoolWeek } = this.props;
    this.teacherList = null;
    this.selectedTeacher = null;
    this.jysSelectWeek = schoolWeek ? schoolWeek : 1;
    this.tableData = null;
    this.setState({
      selectedTeacherIndex: 0,
      selectWeek: schoolWeek ? schoolWeek : 1,
    });
  }

  loadTeachers = (selectWeek) => {
    const { schoolYear, schoolWeek } = this.props;
    if (!schoolYear || !schoolWeek) {
      return;
    }
    console.log("loadTeachers, year: "+schoolYear+" week: "+selectWeek);
    const { jys } = this.props.location.state;
    this.props.fetchTeachersByJys(jys.id, schoolYear, selectWeek);
  }

  buildData = () => {
    this.buildSemester();
    this.buildTeachers();
    this.buildKebiao();
  }

  buildSemester = () => {
    const { t } = this.props;
    const { semesterPages } = this;
    if (semesterPages.length === 0) {
      for (let i=0; i < SEMESTER_WEEK_COUNT; i++) {
        semesterPages.push({ name: t("kebiao.semester_week_template", {index: i+1}) });
      }
    }
  }

  buildTeachers = () => {
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
    this.updateTeacherTitle();
  }

  updateTeacherTitle = () => {
    const { t } = this.props;
    const { jys } = this.props.location.state;
    const { selectedTeacher } = this;
    if (selectedTeacher) {
      this.teacherTitle = t("subjectBoard.title_teacher_template", {teacher_name: selectedTeacher.title, jys_name: jys.name});
    } else {
      this.teacherTitle = t("subjectBoard.title_no_teacher_template", {jys_name: jys.name});
    }
  }

  buildKebiao = () => {
    const { jys } = this.props.location.state;
    const { t } = this.props;
    const { selectedTeacher } = this;
    if (selectedTeacher) {
      this.tableTitle = t("jysKebiaoScreen.table_title_template", {teacher_info: jys.name+" "+selectedTeacher.title});
      this.tableData = this.buildTeacherKebiaoTable(selectedTeacher.id);
    } else { // No selected Teacher, it's table of the whole Jys
      this.tableTitle = t("jysKebiaoScreen.table_title_template", {teacher_info: jys.name});
      this.tableData = this.buildJysKebiaoTable();
    }
    this.updateTabTitles();
  }

  buildJysKebiaoTable = () => {
    const { kebiaoByTeacherSched, schoolYear } = this.props;
    const { jysSelectWeek } = this;
    const { teacherList, tableFieldNames, tableRowNames } = this;

    let resultList = [];
    if (!teacherList) {
      return resultList;
    }
    //console.log("buildJysKebiaoTable: "+JSON.stringify(kebiaoByTeacherSched));
    for (let teacherIndex=1; teacherIndex < teacherList.length; teacherIndex++) {
      const teacherInfo = teacherList[teacherIndex];
      const teacherSchedId = buildTeacherSchedId(teacherInfo.id, schoolYear, jysSelectWeek);
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
    const { jysSelectWeek } = this;
    const { tableFieldNames, tableRowNames } = this;

    const teacherSchedId = buildTeacherSchedId(teacherId, schoolYear, jysSelectWeek);
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

  updateTabTitles = () => {
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
  }

  onTeacherClicked = (index) => {
    console.log(`onTeacherClicked ${this.teacherList[index].title}`);
    this.setState({
      selectedTeacherIndex: index
    });
  }

  onSemesterPageChanged = (index) => {
    const { semesterPages } = this;
    console.log("onSemesterPageChanged: "+semesterPages[index].name);
    this.jysSelectWeek = index+1;
    this.setState({
      selectWeek : this.jysSelectWeek
    });
    this.loadTeachers(this.jysSelectWeek);
  }

  render() {
    const { t } = this.props;
    this.buildData();
    const { selectedTeacherIndex } = this.state;
    const { teacherTitle, teacherList, onTeacherClicked, jysSelectWeek,
      tabTitles, tableHeaders, tableTitle, tableData, semesterPages,
      onSemesterPageChanged } = this;
    const pageTables = [];
    if (tableData) {
      pageTables[0] = (<ResultTable
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
        initPageIndex={jysSelectWeek-1}
        pageInputCaption={[t("kebiao.input_semester_week_prefix"), t("kebiao.input_semester_week_suffix")]}/>);
    } else {
      pageTables[0] = (<Flex alignItems='center' justifyContent='center'><Text>{t("common.no_data")}</Text></Flex>);
    }

    return (
      <Flex width="100%" minHeight={750} direction="column" align="center">
        {
          teacherList && teacherList.length > 0 &&
          <SubjectBoard
            my={4}
            color={JYS_KEBIAO_COLOR}
            title={teacherTitle}
            subjects={teacherList}
            onSubjectClicked={onTeacherClicked}
            initSelectIndex={selectedTeacherIndex}
            enableSelect />
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

const mapStateToProps = (state) => {
  return {
    schoolYear: getSchoolYear(state),
    schoolWeek: getSchoolWeek(state),
    teachersByJys: getTeachersByAllJys(state),
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
