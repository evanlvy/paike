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

import { actions as labActions, buildLabSchedId, getLabsByAllCenter, getShiXunByLabSched } from '../redux/modules/lab';
import { getShiXun } from '../redux/modules/kebiao';

import { SEMESTER_WEEK_COUNT } from './common/info';

const CENTER_LAB_COLOR = "blue";
const LAB_ITEM_COLOR = "gray.400";
class CenterLabScreen extends Component {
  constructor(props) {
    super (props);
    const { t } = props;
    this.state = {
      selectedLabIndex: 0,
      selectWeek: 1
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
  }

  componentDidMount() {
    this.loadData();
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { labsByCenter, shixunByLabSched, shixunByIds, location } = this.props;
    const { selectedLabIndex, selectWeek } = this.state;
    // console.log("shouldComponentUpdate, origin grd: "+JSON.stringify(location.state.grd)+", origin edu: "+JSON.stringify(location.state.edu));
    // console.log("shouldComponentUpdate, grd: "+JSON.stringify(nextProps.location.state.grd)+", edu: "+JSON.stringify(nextProps.location.state.edu));
    if (nextProps.location.state.center !== location.state.center) {
      this.resetData();
      console.log("shouldComponentUpdate, location state diff");
      return true;
    } else if (nextProps.labsByCenter !== labsByCenter || nextProps.shixunByLabSched !== shixunByLabSched || nextProps.shixunByIds !== shixunByIds) {
      console.log("shouldComponentUpdate, props diff");
      return true;
    } else if (nextState.selectedLabIndex !== selectedLabIndex || nextState.selectWeek !== selectWeek) {
      console.log("shouldComponentUpdate, state diff");
      return true;
    }
    return false;
  }

  componentDidUpdate() {
    this.loadData();
  }

  loadData = () => {
    if (!this.labList || this.labList.length === 0) { // only get subjects when it's empty
      const { selectWeek } = this.state;
      this.loadLabs(selectWeek);
    }
  }

  resetData = () => {
    console.log("reset shixun data");
    this.labList = null;
    this.selectedLab = null;
    this.tableData = null;
    this.setState({
      selectedLabIndex: 0,
      selectWeek: 1,
    });
  }

  loadLabs = (weekIndex) => {
    console.log("loadLabs");
    const { center } = this.props.location.state;
    this.props.fetchLabs(center.id, 3, weekIndex);
  }

  buildData = () => {
    this.buildSemester();
    this.buildLabs();
    this.buildKebiao();
  }

  buildSemester = () => {
    const { t } = this.props;
    const { semesterPages } = this;
    if (semesterPages.length === 0) {
      for (let i=0; i < SEMESTER_WEEK_COUNT; i++) {
        semesterPages.push({ name: t("kebiao.semester_week_template", {week_index: i+1}) });
      }
    }
  }

  buildLabs = () => {
    const { center } = this.props.location.state;
    const { t, labsByCenter } = this.props;
    const { selectedLabIndex } = this.state;
    const centerInfo = labsByCenter[center.id];
    if (centerInfo && centerInfo.labs) {
      this.labList = centerInfo.labs.map(lab => {
        return {...lab, color: LAB_ITEM_COLOR };
      });
      this.labList.sort((a, b) => {
        return a.title.localeCompare(b.title);
      });
      this.labList.splice(0, 0, {title: t("centerLabScreen.all_labs"), color: LAB_ITEM_COLOR})
      console.log("LabList: "+JSON.stringify(this.labList));
      if (selectedLabIndex > 0 && selectedLabIndex < this.labList.length) {
        this.selectedLab = this.labList[selectedLabIndex];
      } else {
        this.selectedLab = null;
      }
    }
    this.updateLabTitle();
  }

  updateLabTitle = () => {
    const { t } = this.props;
    const { center } = this.props.location.state;
    const { selectedLab } = this;
    if (selectedLab) {
      this.labTitle = t("subjectBoard.title_lab_template", {lab_name: selectedLab.title, center_info: center.name});
    } else {
      this.labTitle = t("subjectBoard.title_no_lab_template", {center_info: center.name});
    }
  }

  buildKebiao = () => {
    const { center } = this.props.location.state;
    const { t } = this.props;
    const { selectedLab } = this;
    if (selectedLab) {
      this.tableTitle = t("centerLabScreen.table_title_template", {lab_info: selectedLab.title});
      this.tableData = this.buildLabKebiaoTable(selectedLab.id);
    } else { // No selected lab, itt's table of the whole center
      this.tableTitle = t("centerLabScreen.table_title_template", {lab_info: center.name+t("centerLabScreen.all_labs")});
      this.tableData = this.buildCenterKebiaoTable();
    }
    this.updateTabTitles();
  }

  buildCenterKebiaoTable = () => {
    const { shixunByLabSched } = this.props;
    const { selectWeek } = this.state;
    const { labList, tableFieldNames, tableRowNames } = this;

    let resultList = [];
    if (!labList) {
      return resultList;
    }
    console.log("buildCenterKebiaoTable: "+JSON.stringify(shixunByLabSched));
    for (let labIndex=1; labIndex < labList.length; labIndex++) {
      const labInfo = labList[labIndex];
      const labSchedId = buildLabSchedId(labInfo.id, 3, selectWeek);
      const shixunInfo = shixunByLabSched.get(labSchedId);
      //console.log(`Get LabSchedId: ${labSchedId}, data: ${JSON.stringify(shixunInfo)}`);
      for (let i=1; i < tableFieldNames.length; i++) {
        const shixunInDay = shixunInfo ? shixunInfo.schedules[i-1] : null;
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

          let shixunHourList = shixunInDay ? shixunInDay[hourIndex] : [];
          if (shixunHourList && shixunHourList.length > 0) {
            names.push(labInfo.title);
          } else {
            shixunHourList = [];
          }
          let newInfo = resultList[j][tableFieldNames[i]];
          if (!newInfo) {
            newInfo = {title: "", data: []};
          }
          if (names.length > 0) {
            newInfo.title += " "+names.join(" ");
          }
          newInfo.data.push(...shixunHourList);
          resultList[j][tableFieldNames[i]] = newInfo;
        }
      }
    }
    //console.log("ResultList: "+JSON.stringify(resultList));
    return resultList;
  }

  buildShiXunName = (shixunId) => {
    const { shixunByIds } = this.props;
    const shixunInfo = shixunByIds.get(shixunId)
    return shixunInfo.labitem_name+" ("+shixunInfo.lab_teacher+")";
  }

  buildLabKebiaoTable = (labId) => {
    const { shixunByLabSched } = this.props;
    const { selectWeek } = this.state;
    const { tableFieldNames, tableRowNames } = this;

    const labSchedId = buildLabSchedId(labId, 3, selectWeek);
    console.log("Get shixunInfo of "+labSchedId);
    const shixunInfo = shixunByLabSched.get(labSchedId);
    let resultList = [];
    for (let i=1; i < tableFieldNames.length; i++) {
      const shixunInDay = shixunInfo ? shixunInfo.schedules[i-1] : null;
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
        const shixunHourList = shixunInDay ? shixunInDay[hourIndex] : [];
        if (shixunHourList && shixunHourList.length > 0) {
          shixunHourList.forEach(shixunId => {
            let name = this.buildShiXunName(shixunId);
            if (name) {
              names.push(name);
            }
          });
        }
        resultList[j][tableFieldNames[i]] = { titles: names, data: shixunHourList };
      }
    }
    //console.log("ResultList: "+JSON.stringify(resultList));
    return resultList;
  }

  updateTabTitles = () => {
    this.tabTitles = [];
    if (!this.labList) {
      return;
    }
    const { t } = this.props;
    const { selectedLab } = this;
    if (selectedLab) {
      this.tabTitles = [selectedLab.title];
    } else {
      this.tabTitles = [t("centerLabScreen.all_labs")];
    }
  }

  onLabClicked = (index) => {
    console.log(`onLabClicked ${this.labList[index].title}`);
    this.setState({
      selectedLabIndex: index
    });
  }

  onSemesterPageChanged = (index) => {
    const { semesterPages } = this;
    console.log("onSemesterPageChanged: "+semesterPages[index].name);
    const weekIndex = index+1;
    this.setState({
      selectWeek : weekIndex
    });
    this.loadLabs(weekIndex);
  }

  render() {
    const { t } = this.props;
    this.buildData();
    const { selectedLabIndex } = this.state;
    const { labTitle, labList, onLabClicked,
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
        color={CENTER_LAB_COLOR}
        headers={tableHeaders}
        data={tableData}
        pageNames={semesterPages}
        pagePrevCaption={t("kebiao.prev_semester_week")}
        pageNextCaption={t("kebiao.next_semester_week")}
        onResultPageIndexChanged={onSemesterPageChanged}
        pageInputCaption={[t("kebiao.input_semester_week_prefix"), t("kebiao.input_semester_week_suffix")]}/>);
    } else {
      pageTables[0] = (<Flex alignItems='center' justifyContent='center'><Text>{t("common.no_data")}</Text></Flex>);
    }

    return (
      <Flex width="100%" minHeight={750} direction="column" align="center">
        {
          labList && labList.length > 0 &&
          <SubjectBoard
            my={4}
            color={CENTER_LAB_COLOR}
            title={labTitle}
            subjects={labList}
            onSubjectClicked={onLabClicked}
            initSelectIndex={selectedLabIndex}
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
            color={CENTER_LAB_COLOR}
            titles={tabTitles}
            pages={pageTables} />
        }
      </Flex>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    labsByCenter: getLabsByAllCenter(state),
    shixunByLabSched: getShiXunByLabSched(state),
    shixunByIds:getShiXun(state),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    ...bindActionCreators(labActions, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(CenterLabScreen));
