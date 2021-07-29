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
import { actions as jysActions, getAllJiaoyanshi } from '../redux/modules/jiaoyanshi';
import { actions as kebiaoActions, buildJysSchedId, getShiXunByJiaoyanshiSched } from '../redux/modules/kebiao';

import { SEMESTER_WEEK_COUNT } from './common/info';

const SHIXUNKEBIAO_COLOR = "green";
class ShiXunKeBiaoScreen extends Component {
  constructor(props) {
    super(props);
    const { t, schoolWeek } = props;
    this.state = {
      selectedJysIndexList: [0],
      selectWeek: schoolWeek ? schoolWeek : 1,
    };

    this.semesterPages = [];

    this.tabTitles = [];
    this.tableHeaders = [
      {name: t("kebiao.shixun_sched_title"), field: "sched_name"},
      {name: t("kebiao.jys"), field: "jys"},
      {name: t("kebiao.banji"), field: "banji"},
      //{name: t("kebiao.student_count"), field: "student_count"},
      {name: t("kebiao.shixun_content"), field: "shixun_name"},
      {name: t("kebiao.teacher"), field: "teacher"},
      {name: t("kebiao.shixun_teacher"), field: "shixun_teacher"},
      {name: t("kebiao.lab"), field: "lab"},
      {name: t("kebiao.note"), field: "note"},
    ];

    this.weekdayNames = [
      t("kebiao.sched_monday"), t("kebiao.sched_tuesday"), t("kebiao.sched_wednesday"),
      t("kebiao.sched_thursday"), t("kebiao.sched_friday"), t("kebiao.sched_saturday"), t("kebiao.sched_sunday")
    ];
    this.hourNames = [
      t("kebiao.sched_12"), t("kebiao.sched_34"), t("kebiao.sched_67"),
      t("kebiao.sched_89"), t("kebiao.sched_1011"), t("kebiao.sched_1213")
    ];
    this.tableData = null;
    this.shixunSelectWeek = schoolWeek ? schoolWeek : 1;

    this.tabsListRef = React.createRef();
    this.jysTitle = t("kebiao.jys");
  }

  componentDidMount() {
    this.loadData();
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { schoolYear, schoolWeek, jysList, kebiaoByJysSched/*, location*/ } = this.props;
    const { selectedJysIndexList, selectWeek } = this.state;
    // console.log("shouldComponentUpdate, origin grd: "+JSON.stringify(location.state.grd)+", origin edu: "+JSON.stringify(location.state.edu));
    // console.log("shouldComponentUpdate, grd: "+JSON.stringify(nextProps.location.state.grd)+", edu: "+JSON.stringify(nextProps.location.state.edu));
    /*if (nextProps.location.state.grd !== location.state.grd || nextProps.location.state.edu !== location.state.edu) {
      //this.resetData();
      console.log("shouldComponentUpdate, location state diff");
      return true;
    } else */
    if (nextProps.schoolYear !== schoolYear || nextProps.schoolWeek !== schoolWeek
    || nextProps.jysList !== jysList || nextProps.kebiaoByJysSched !== kebiaoByJysSched) {
      console.log("shouldComponentUpdate, props diff");
      return true;
    } else if (nextState.selectedJysIndexList !== selectedJysIndexList || nextState.selectWeek !== selectWeek ) {
      console.log("shouldComponentUpdate, state diff");
      return true;
    }
    return false;
  }

  componentDidUpdate() {
    this.loadData();
  }

  loadData = () => {
    if (!this.jysData || this.jysData.length === 0) { // only get jys list when it's empty
      this.loadJysList();
    }
    if (this.selectedJysList && !this.hasFetchKebiao) {
      const { schoolWeek } = this.props;
      this.shixunSelectWeek = schoolWeek;
      console.log("loadKebiao: schoolWeek: "+this.shixunSelectWeek);
      this.loadKebiao(this.shixunSelectWeek);
    }
  }

  buildData = () => {
    this.buildSemester();
    this.buildJysList();
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

  loadJysList = () => {
    console.log("loadJysList");
    this.props.fetchJiaoyanshi();
  }

  buildJysList = () => {
    if (this.jysData == null || this.jysData.length === 0) {
      const { jysList } = this.props;
      this.jysData = !jysList ? [] : jysList;
      //this.jysData.unshift({title: t("shixunKebiaoScreen.all_departments"), color: "gray.400"});
      console.log("JYS Data: "+JSON.stringify(this.jysData));
      this.setJysSelectedIndexList(this.state.selectedJysIndexList);
    }
    this.updateTitles();
  }

  setJysSelectedIndexList = (indexList) => {
    this.selectedJysList = [];
    if (this.jysData && indexList && indexList.length > 0) {
      indexList.forEach(index => {
        if (index < this.jysData.length) {
          this.selectedJysList.push(this.jysData[index]);
        }
      });
    }
  }

  updateTitles = () => {
    const { t } = this.props;
    this.tabTitles = [];
    if (!this.selectedJysList || this.selectedJysList.length === 0) {
      this.tabTitles = [];
      //this.jysTitle = t("subjectBoard.title_no_jys_template");
      return;
    }
    let jys_info = "";
    this.selectedJysList.every((item, index) => {
      if (item.title != null) {
        jys_info += item.title + " ";
      }
      if (jys_info.length > 30){
        jys_info += "...";
        return false;
      }
      return true;
    });
    //this.jysTitle = t("subjectBoard.title_jys_template", {jys_info: jys_info.trim()});
    this.tabTitles = [jys_info];
    console.log(`updateTabTitles: ${JSON.stringify(this.tabTitles)}`);
    this.tableTitle = t("shixunKebiaoScreen.table_title_template", {jys_count: this.selectedJysList.length});
    console.log(`updateTableTitle: ${this.tableTitle}`);
    
  }

  buildKebiao = () => {
    const { kebiaoByJysSched, schoolYear, schoolWeek } = this.props;
    if (!this.selectedJysList || this.selectedJysList.length === 0 || !schoolYear || !schoolWeek) {
      return;
    }

    let kebiaoBySched = this.buildKebiaoBySched(this.selectedJysList, kebiaoByJysSched);
    if (kebiaoBySched) {
      this.tableData = this.buildKebiaoTableSched(kebiaoBySched);
    } else {
      this.tableData = [];
    }
    console.log("kebiaoTable: "+JSON.stringify(this.tableData));
  }

  buildKebiaoBySched = (jysList, kebiaoByJysSched) => {
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
    return result;
  }

  buildKebiaoTableSched = (kebiaoBySched) => {
    /*const fields_names = [
      "sched_name", "jys", "banji", "student_count", "shixun_name", "teacher", "shixun_teacher", "lab", "note"
    ];*/
    const { weekdayNames, hourNames } = this;
    let resultList = [];
    for (let i=0; i < weekdayNames.length; i++) {
      let weekday_name = weekdayNames[i];
      for (let j=0; j < hourNames.length; j++) {
        let sched_name = null;
        let hour_name = hourNames[j];
        const key = `${i}_${j}`;
        const kebiaoHourList = kebiaoBySched[key];
        if (kebiaoHourList && kebiaoHourList.length > 0) {
          kebiaoHourList.forEach(kebiaoHour => {
            let resultItem = {};
            if (!sched_name) {
              sched_name = weekday_name+hour_name;
              resultItem["sched_name"] = sched_name;
            } else {
              resultItem["sched_name"] = "";
            }
            resultItem["jys"] = kebiaoHour.jys.name;
            resultItem["banji"] = kebiaoHour.class_name;
            resultItem["shixun_name"] = kebiaoHour.labitem_name;
            let teacherInfo = "";
            kebiaoHour.theory_teachers.forEach(teacher => {
              teacherInfo += teacher.name+" ";
            });
            resultItem["teacher"] = teacherInfo.trim();
            resultItem["shixun_teacher"] = kebiaoHour.lab_teacher;
            resultItem["lab"] = kebiaoHour.lab_location;
            resultItem["note"] = kebiaoHour.comments;
            resultItem["data"] = kebiaoHour;
            resultList.push(resultItem);
          });
        }
      }
    }
    return resultList;

  }

  loadKebiao = (selectWeek) => {
    if (!this.selectedJysList) {
      console.error("JYS data not selected yet");
      return;
    }
    const { schoolYear } = this.props;
    console.log("loadShiXunKebiao, year: "+schoolYear+" week: "+selectWeek);
    const jysIds = [];
    this.selectedJysList.forEach(jys => {
      jysIds.push(jys.id);
    });
    this.props.fetchShiXun(jysIds, schoolYear, selectWeek);
    this.hasFetchKebiao = true;
  }

  /*onJysClicked = (index) => {
    console.log(`onJysClicked ${this.jysData[index].title}`);
    const { selectedJysIndexList: oldIndexList,  } = this.state;
    let newIndexList = [];
    if (index === 0) {
      if (oldIndexList.includes(0)) {
        // Uncheck ALL
        newIndexList = [];
      }
      else {
        // Check ALL
        newIndexList = [...Array(this.jysData.length).keys()];
      }
      console.log(`onJysClicked newlist: ${newIndexList}`);
    }
    else {
      // Remove clicked item
      oldIndexList.forEach(index_item => {
        if (index_item !== index) {
          newIndexList.push(index_item);
        }
      });
      // Add clicked item or not
      if (newIndexList.length === oldIndexList.length) { // nothing removed, it's a checked click
        newIndexList.push(index);
      }
    }

    this.setState({
      selectedJysIndexList: newIndexList
    });
    this.setJysSelectedIndexList(newIndexList);
    this.loadKebiao(this.shixunSelectWeek);
  }*/

  onJysChanged = (jysList) => {
    console.log(`onJysChanged ${jysList}`);
    this.setState({
      selectedJysIndexList: jysList
    });
    this.setJysSelectedIndexList(jysList);
    this.loadKebiao(this.shixunSelectWeek);
  }

  onSemesterPageChanged = (index) => {
    const { semesterPages } = this;
    console.log("onSemesterPageChanged: "+semesterPages[index].name);
    this.shixunSelectWeek = index+1;
    this.setState({
      selectWeek : this.shixunSelectWeek
    });
    this.loadKebiao(this.shixunSelectWeek);
  }

  render() {
    const { t } = this.props;
    const { selectedJysIndexList } = this.state;
    this.buildData();
    const { jysData, jysTitle, shixunSelectWeek,
      tabTitles, tableTitle, tableHeaders, tableData, semesterPages,
      /*onJysClicked,*/ onJysChanged, onTabChanged, onSemesterPageChanged } = this;
    const pageTables = [];
    if (tableData) {
      pageTables[0] = (<ResultTable
        height={450/*window.innerHeight*/}
        titleHeight={50}
        colLineHeight={20}
        defaultColWidth={180}
        title={tableTitle}
        color={SHIXUNKEBIAO_COLOR}
        headers={tableHeaders}
        data={tableData}
        pageNames={semesterPages}
        pagePrevCaption={t("kebiao.prev_semester_week")}
        pageNextCaption={t("kebiao.next_semester_week")}
        onResultPageIndexChanged={onSemesterPageChanged}
        initPageIndex={shixunSelectWeek-1}
        pageInputCaption={[t("kebiao.input_semester_week_prefix"), t("kebiao.input_semester_week_suffix")]} />);
    } else {
      pageTables[0] = (<Flex alignItems='center' justifyContent='center'><Text>{t("common.no_data")}</Text></Flex>);
    }
    return (
      <Flex width="100%" minHeight={750} direction="column" align="center">
        <SubjectBoard
          my={4}
          color={SHIXUNKEBIAO_COLOR}
          title={jysTitle}
          subjects={jysData}
          initSelectedIndexList={selectedJysIndexList}
          //onSubjectClicked={onJysClicked}
          selectionChanged={onJysChanged}
          t={t}
          enableMultiSelect
          enableSelectAll
          autoTitle />
        {
          tabTitles && tabTitles.length > 0 &&
          <ResultTabList
            ref={this.tabsListRef}
            my={4}
            width="100%"
            maxWidth={1444}
            tabHeight={50}
            color={SHIXUNKEBIAO_COLOR}
            titles={tabTitles}
            onTabChange={onTabChanged}
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
    jysList: getAllJiaoyanshi(state),
    kebiaoByJysSched: getShiXunByJiaoyanshiSched(state),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    ...bindActionCreators(jysActions, dispatch),
    ...bindActionCreators(kebiaoActions, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(ShiXunKeBiaoScreen));
