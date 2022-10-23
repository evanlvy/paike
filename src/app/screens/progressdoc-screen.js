/* @flow */

import React, { Component } from 'react';
import { bindActionCreators } from "redux";
import { connect, useSelector } from "react-redux";
import { withTranslation } from 'react-i18next';
import {
  Flex,
  Text,
  Box,
  Select,
  Icon,
  Button,
  ButtonGroup,
} from '@chakra-ui/core';
import {
  MdTune,
  MdEdit,
  MdAdd,
  MdDelete,
} from 'react-icons/md';

import {
  SubjectBoard,
  ResultTable,
} from '../components';

import { actions as authActions, getLoggedUser, getAccessLevel } from '../redux/modules/auth';
//import { actions as authActions, getDepartmentId } from '../redux/modules/auth';
import { actions as gradeActions, getSchoolYear, getStageList } from '../redux/modules/grade';
import { actions as jysActions, getColoredJysList } from '../redux/modules/jiaoyanshi';
import { actions as progressdocActions, getDocList } from '../redux/modules/progressdoc';
import { actions as appActions } from '../redux/modules/app';
import PromptDrawer from '../components/overlays/prompt-drawer';
import ProgressdocDialog from '../components/overlays/progressdoc-dialog';
import ButtonConfirmPopover from '../components/modal/button-confirm-popover';

const DEFAULT_COLOR = "purple";
const CANCEL_COLOR = "gray";
const SEMESTER_FIRST_HALF_MAX_WEEK = 9;
const SEMESTER_HALF_BIAS_WEEK = 6;
class ProgressdocScreen extends Component {
  constructor(props) {
    super(props);
    const { t, color, schoolYear, userInfo } = props;
    this.state = {
      selectStage: schoolYear,
      defaultTeacherId: -1,
      selectedJysIdList: [],  // Keep the latest selected Id, NOT index!
      selectedDocId: 0,
      isProgressDocOpen: false,
    };
    this.color = color ? color : DEFAULT_COLOR;
    this.defaultselectedJysIdList = [userInfo.departmentId];  //Keep default selected index!
    this.semesterPages = [];

    this.docListHeaders = [
      {name: t("progressdocScreen.list_header_id"), field: "id", width: 80},
      {name: t("progressdocScreen.list_header_name"), field: "course_name"},
      {name: t("progressdocScreen.list_header_short"), field: "short_name"},
      {name: t("progressdocScreen.list_header_description"), field: "description"},
      {name: t("progressdocScreen.list_header_hours_total"), field: "total_hours", width: 80},
      {name: t("progressdocScreen.list_header_hours_theory"), field: "theory_hours", width: 80},
      {name: t("progressdocScreen.list_header_hours_lab"), field: "lab_hours", width: 80},
      {name: t("progressdocScreen.list_header_hours_flex"), field: "flex_hours", width: 80},
      {name: t("progressdocScreen.list_header_textbook"), field: "textbook"},
      {name: t("progressdocScreen.list_header_exam"), field: "exam_type", width: 120},
      {name: t("progressdocScreen.list_header_comments"), field: "comments"},
      {name: t("progressdocScreen.list_header_classes"), field: "classes", dataType: "classes_id_name_obj"},
      {name: t("progressdocScreen.list_header_created"), field: "created_at"},
      {name: t("progressdocScreen.list_header_updated"), field: "updated_at"},
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
    this.tabsListRef = React.createRef();
    this.jysTitle = t("kebiao.jys");
    this.titleSelected = "";
    this.buildSemester();
    //this.buildData();
  }

  componentDidMount() {
    this.loadData();
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { schoolYear, jysList, stageList, docList } = this.props;
    const { selectedJysIdList, selectedDocId, isProgressDocOpen } = this.state;
    if (nextProps.schoolYear !== schoolYear || nextProps.jysList !== jysList || nextProps.docList !== docList) {
      console.log("shouldComponentUpdate, props diff");
      return true;
    } else if (nextProps.stageList !== stageList ) {
      console.log("shouldComponentUpdate, stageList diff");
      this.buildSemester();
      return true;
    } else if (nextState.selectedJysIdList !== selectedJysIdList) {
      console.log("shouldComponentUpdate, selected_jys diff");
      return true;
    } else if (nextState.selectedDocId != selectedDocId) {
      console.log("shouldComponentUpdate, selectedDocId diff");
      return true;
    } else if (nextState.isProgressDocOpen != isProgressDocOpen) {
      return true;
    }
    return false;
  }

  componentDidUpdate(prevProps, prevState) {
    console.log("LIFECYCLE: componentDidMount");
    // Disable Open button when changing department then lost row selection
    if (prevState.selectedJysIdList !== this.state.selectedJysIdList) {
      this.setState({
        selectedDocId: -1,
      });
    }
  }

  loadData = () => {
    if (!this.semesterPages || this.semesterPages.length === 0) {
      this.props.fetchStageList();
    }
    if (!this.jysData || this.jysData.length === 0) { // only get jys list when it's empty
      this.loadjysData();
    }
    if (this.state.selectedJysIdList && !this.hasFetchKebiao) {
      this.loadDocList(this.state.selectedJysIdList);
    }
  }
  
  buildSemester = () => {
    if (Object.keys(this.semesterPages).length <= 0) {
      this.semesterPages = {...this.props.stageList};
      console.log("buildSemester: stages: "+JSON.stringify(this.semesterPages));
    }
  }

  loadjysData = () => {
    console.log("loadjysData");
    this.props.fetchJiaoyanshi();
  }
  
  loadDocList = (jysIdList, stage_id=0) => {
    if (!jysIdList || jysIdList.length < 1) {
      console.error("JYS not selected yet");
      return;
    }
    let stage = stage_id;
    if (stage < 1) {
      stage = this.state.selectStage;
    }
    console.log("loadDocList, year: "+stage+" jysId:"+jysIdList[0]);
    this.props.fetchDocList(jysIdList[0], stage);
    this.hasFetchKebiao = true;
  }

  onJysIdsChanged = (jysIdList, namesSelected="") => {
    console.log(`onJysIdsChanged ${jysIdList}`);
    this.titleSelected = namesSelected;
    this.setState({
      selectedJysIdList: jysIdList
    });
    this.loadDocList(jysIdList);
  }

  onRowSelected = (rowId, docId) => {
    console.log(`onRowSelected: rowId=${rowId} docId=${docId}`);
    this.setState({
      selectedDocId: docId
    });
  }

  onSemesterPageChanged = (index) => {
    const { semesterPages } = this;
    console.log("onSemesterPageChanged: "+semesterPages[index].name);
    if (index < 0 || index >= semesterPages.length) {
      return;
    }
    let stageId = Object.keys(this.props.stageList)[index];
    this.loadDocList(this.state.selectedJysIdList, stageId);
  }

  onStageChanged = (event) => {
    let target_stage = event.target.value;
    this.setState({
      selectStage: target_stage
    });
    this.loadDocList(this.state.selectedJysIdList, target_stage);
  }

  onRowDoubleClicked = (rowId, docId) => {
    console.log(`onRowDoubleClicked: rowId=${rowId} docId=${docId}`);
    this.openProgressDocDialog(docId);
  }

  openProgressDocDialog = (docId) => {
    this.props.fetchDoc(docId);
    this.setState({
      selectedDocId: docId,
      isProgressDocOpen: true,
    });
  }

  onProgressDocClose = () => {
    this.props.closeDoc();
    this.setState({
      isProgressDocOpen: false,
      isNewDoc: false,
    });
  }

  onCreateDoc = (event) => {
    this.setState({
      isNewDoc: true,
      isProgressDocOpen: true,
    });
  }

  onDeleteDoc = (event) => {
    const { selectedDocId } = this.state;
    if (selectedDocId <= 0) {
      this.props.setToast({type:"warning", message:"toast.warn_no_row_selected"});
      return;
    }
    this.props.setToast({type:"warning", message:"toast.warn_no_row_selected"});
  }

  render() {
    const { t, jysList, docList, userInfo, accessLevel } = this.props;
    const { selectStage, selectedDocId, isProgressDocOpen, isNewDoc } = this.state;
    const { color, jysTitle, titleSelected, docListHeaders, semesterPages, onStageChanged, onJysIdsChanged, onRowSelected, onRowDoubleClicked } = this;
    let tableTitle = "";
    if (titleSelected && titleSelected.length > 0) {
      tableTitle =  t("progressdocScreen.doclist_table_title_template", {jys_name: titleSelected});
    } else {
      tableTitle = t("subjectBoard.title_no_jys_template");
    }

    return (
      <Flex width="100%" minHeight={750} direction="column" align="center" mb={5}>
        <Box borderWidth={1} borderColor={color+".200"} borderRadius="md" overflowY="hidden" minW={588} >
          <Flex direction="row" alignItems="center" px={5} py={2}>
            <Icon as={MdTune} color={color+".200"} size={12} />
            <Text mx={5} whiteSpace="break-spaces" flexWrap="true" minW={60}>{t("editRawplanScreen.hint_stageselector")}</Text>
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
            <PromptDrawer t={t} promptText={t("editRawplanScreen.prompt_text")}/>
          </Flex>
        </Box>
        <SubjectBoard t={t} my={4} color={color}
          title={jysTitle}
          subjects={jysList}
          initSelectIds={this.defaultselectedJysIdList}
          selectedIdsChanged={onJysIdsChanged}
          enableAutoTitle={true}
          enableSelect />
        {
          docList && 
          <ResultTable
            //minHeight={docList.length>3?800:180}
            autoShrinkDomHeight
            titleHeight={50}
            colLineHeight={20}
            defaultColWidth={180}
            title={tableTitle}
            color={color}
            headers={docListHeaders}
            data={docList}
            rowSelection="single"
            onRowSelected={onRowSelected}
            onRowDoubleClicked={onRowDoubleClicked}
          />
        }
        <ButtonGroup size="lg">
          <Button leftIcon={MdEdit} variantColor="blue" variant="solid" mt={3} isDisabled={selectedDocId<=0} 
            onClick={e => this.openProgressDocDialog(selectedDocId)}>
            {t("common.open")}
          </Button>
          <Button leftIcon={MdAdd} variantColor="green" variant="solid" mt={3} 
            onClick={this.onCreateDoc}>
            {t("common.new")}
          </Button>
          <ButtonConfirmPopover t={t} leftIcon={MdDelete} variantColor="red" variant="solid" mt={3} isDisabled={selectedDocId<=0} 
            onConfirm={this.onDeleteDoc} btnTitle={t("common.delete")} popText={t("progressdocScreen.warning_delete_doc")}/>
        </ButtonGroup>
        <ProgressdocDialog
          t={t}
          color={color}
          isOpen={isProgressDocOpen}
          onClose={this.onProgressDocClose}
          departments={jysList}
          title={t("progressdocScreen.doc_detail_title")}
          btnText={t("common.open")}
          userInfo={userInfo}
          accessLevel={accessLevel}
          isNewDoc={isNewDoc}
          isSaveable />
      </Flex>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    schoolYear: getSchoolYear(state),
    stageList: getStageList(state),
    jysList: getColoredJysList(state),
    docList: getDocList(state),
    userInfo: getLoggedUser(state),
    accessLevel: getAccessLevel(state),
    //defaultJys: getDepartmentId(state),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    ...bindActionCreators(jysActions, dispatch),
    ...bindActionCreators(gradeActions, dispatch),
    ...bindActionCreators(progressdocActions, dispatch),
    ...bindActionCreators(authActions, dispatch),
    ...bindActionCreators(appActions, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(ProgressdocScreen));
