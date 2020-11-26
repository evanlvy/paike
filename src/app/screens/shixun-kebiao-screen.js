/* @flow */

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

import { actions as jysActions, getAllJiaoyanshi } from '../redux/modules/jiaoyanshi';
import { actions as kebiaoActions, buildJysSchedId, getShiXunByJiaoyanshiSched } from '../redux/modules/kebiao';

const SHIXUNKEBIAO_COLOR = "green";
class ShiXunKeBiaoScreen extends Component {
  constructor(props) {
    super(props);
    const { t } = props;
    this.state = {
      selectedJysIndexList: [0],
      selectWeek: 5,
    };

    this.semesterPages = [
      {name: t("kebiao.semester_one_first")},
      {name: t("kebiao.semester_one_second")},
      {name: t("kebiao.semester_two_first")},
      {name: t("kebiao.semester_two_second")}
    ];
    this.tabTitles = [];
    this.tableHeaders = [
      {name: t("kebiao.shixun_sched_title"), field: "sched_name"},
      {name: t("kebiao.jys"), field: "jys"},
      //{name: t("kebiao.banji"), field: "banji"},
      //{name: t("kebiao.student_count"), field: "student_count"},
      {name: t("kebiao.shixun_content"), field: "shixun_name"},
      {name: t("kebiao.teacher"), field: "teacher"},
      //{name: t("kebiao.shixun_teacher"), field: "shixun_teacher"},
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
    this.curDataIndex = 0;

    this.tabsListRef = React.createRef();
  }

  componentDidMount() {
    this.loadData();
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { jysList, kebiaoByJysSched, location } = this.props;
    const { selectedJysIndexList, selectWeek } = this.state;
    // console.log("shouldComponentUpdate, origin grd: "+JSON.stringify(location.state.grd)+", origin edu: "+JSON.stringify(location.state.edu));
    // console.log("shouldComponentUpdate, grd: "+JSON.stringify(nextProps.location.state.grd)+", edu: "+JSON.stringify(nextProps.location.state.edu));
    if (nextProps.location.state.grd !== location.state.grd || nextProps.location.state.edu !== location.state.edu) {
      //this.resetData();
      console.log("shouldComponentUpdate, location state diff");
      return true;
    } else if (nextProps.jysList !== jysList || nextProps.kebiaoByJysSched !== kebiaoByJysSched) {
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
      const { selectWeek } = this.state;
      this.loadKebiao(selectWeek);
    }
  }

  buildData = () => {
    this.buildJysList();
    this.buildKebiao();
  }

  loadJysList = () => {
    console.log("loadJysList");
    this.props.fetchJiaoyanshi();
  }

  buildJysList = () => {
    if (this.jysData == null || this.jysData.length === 0) {
      const { jysList } = this.props;
      this.jysData = !jysList ? [] : jysList;
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
      this.jysTitle = t("subjectBoard.title_no_jys_template");
      return;
    }
    let jys_info = "";
    this.selectedJysList.forEach(jys => {
      jys_info += jys.name + " ";
    });
    this.jysTitle = t("subjectBoard.title_jys_template", {jys_info: jys_info.trim()});
    this.tabTitles = [jys_info];
    console.log(`updateTabTitles: ${JSON.stringify(this.tabTitles)}`);
    this.tableTitle = t("shixunKebiaoScreen.table_title_template", {jys_info: jys_info});
    console.log(`updateTableTitle: ${this.tableTitle}`);
  }

  buildKebiao = () => {
    const { kebiaoByJysSched } = this.props;
    if (!this.selectedJysList || this.selectedJysList.length === 0) {
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
    const { selectWeek } = this.state;
    const { weekdayNames, hourNames } = this;
    let result = {}
    jysList.forEach(jys => {
      const jysSchedId = buildJysSchedId(jys.id, 3, selectWeek);
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
            resultItem["shixun_name"] = kebiaoHour.labitem_name;
            let teacherInfo = "";
            kebiaoHour.theory_teachers.forEach(teacher => {
              teacherInfo += teacher.name+" ";
            });
            resultItem["teacher"] = teacherInfo.trim();
            resultItem["lab"] = kebiaoHour.lab_location;
            resultItem["note"] = "";
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
    console.log("loadKebiao");
    const jysIds = [];
    this.selectedJysList.forEach(jys => {
      jysIds.push(jys.id);
    });
    this.props.fetchShiXun(jysIds, 3, selectWeek);
    this.hasFetchKebiao = true;
  }

  onJysClicked = (index) => {
    console.log(`onJysClicked ${this.jysData[index].title}`);
    const { selectedJysIndexList: oldIndexList } = this.state;
    let newIndexList = [];
    oldIndexList.forEach(index_item => {
      if (index_item !== index) {
        newIndexList.push(index_item);
      }
    });
    if (newIndexList.length === oldIndexList.length) { // nothing removed, it's a checked click
      newIndexList.push(index);
    }

    this.setState({
      selectedJysIndexList: newIndexList
    });
    this.setJysSelectedIndexList(newIndexList);
    this.loadKebiao(this.state.selectWeek);
  }

  onSemesterPageChanged = (index) => {
    const { semesterPages } = this;
    console.log("onSemesterPageChanged: "+semesterPages[index].name);
    const weekIndex = 5+9*index;
    this.setState({
      selectWeek : weekIndex
    });
    this.loadKebiao(weekIndex);
  }

  render() {
    const { t } = this.props;
    const { selectedJysIndexList } = this.state;
    this.buildData();
    const { jysData, jysTitle,
      tabTitles, tableTitle, tableHeaders, tableData, semesterPages,
      onJysClicked, onTabChanged, onSemesterPageChanged } = this;
    const pageTables = [];
    if (tableData) {
      pageTables[0] = (<ResultTable
        height={450}
        titleHeight={50}
        colLineHeight={20}
        defaultColWidth={180}
        title={tableTitle}
        color={SHIXUNKEBIAO_COLOR}
        headers={tableHeaders}
        data={tableData}
        pageNames={semesterPages}
        pagePrevCaption={t("banjiKebiaoScreen.prev_semester_page")}
        pageNextCaption={t("banjiKebiaoScreen.next_semester_page")}
        onResultPageIndexChanged={onSemesterPageChanged} />);
    } else {
      pageTables[0] = (<Flex alignItems='center' justifyContent='center'><Text>{t("common.no_data")}</Text></Flex>);
    }
    return (
      <Flex width="100%" direction="column" justify="center" align="center">
        <SubjectBoard
          my={4}
          color={SHIXUNKEBIAO_COLOR}
          title={jysTitle}
          subjects={jysData}
          initSelectedIndexList={selectedJysIndexList}
          onSubjectClicked={onJysClicked}
          enableMultiSelect />
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
