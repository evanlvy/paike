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
  CircularProgress,
  Checkbox,
} from '@chakra-ui/core';
import {
  MdTune,
  MdEdit,
  MdAdd,
  MdDelete,
  MdFilter,
} from 'react-icons/md';

import {
  SubjectBoard,
  ResultTable,
} from '../components';

import { actions as authActions, getLoggedUser, getAccessLevel } from '../redux/modules/auth';
import { actions as gradeActions, getSchoolYear, getStageList } from '../redux/modules/grade';
import { actions as jysActions, getColoredJysList } from '../redux/modules/jiaoyanshi';
import { actions as progressdocActions, getDocList, getFetchedDocId, getCreatedDocId, getSelectedGroup } from '../redux/modules/progressdoc';
import { actions as appActions } from '../redux/modules/app';
import { actions as teacherActions, searchedTeachers } from '../redux/modules/teacher'

import PromptDrawer from '../components/overlays/prompt-drawer';
import ProgressdocDialog from '../components/overlays/progressdoc-dialog';
import ButtonConfirmPopover from '../components/modal/button-confirm-popover';
import role from '../redux/modules/auth';

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
      isNewDoc: false,
      isLoading: false,
      rowSelected: 0,
      semesterPages: {},
      showMyProgress: true,
      filteredDocList: [],
    };
    this.color = color ? color : DEFAULT_COLOR;
    this.defaultselectedJysIdList = [userInfo.departmentId];  //Keep default selected index!

    this.docListHeaders = [
      {name: t("progressdocScreen.list_header_id"), field: "id", width: 80, sortable: true},
      {name: t("progressdocScreen.list_header_name"), field: "course_name", sortable: true},
      {name: t("progressdocScreen.list_header_short"), field: "short_name", sortable: true},
      {name: t("progressdocScreen.list_header_description"), field: "description"},
      {name: t("progressdocScreen.list_header_hours_total"), field: "total_hours", width: 80, sortable: true},
      {name: t("progressdocScreen.list_header_hours_theory"), field: "theory_hours", width: 80, sortable: true},
      {name: t("progressdocScreen.list_header_hours_lab"), field: "lab_hours", width: 80, sortable: true},
      {name: t("progressdocScreen.list_header_hours_flex"), field: "flex_hours", width: 80, sortable: true},
      {name: t("progressdocScreen.list_header_textbook"), field: "textbook"},
      {name: t("progressdocScreen.list_header_exam"), field: "exam_type", width: 120},
      {name: t("progressdocScreen.list_header_comments"), field: "comments"},
      {name: t("progressdocScreen.list_header_classes"), field: "classes", dataType: "classes_id_name_obj", sortable: true},
      {name: t("progressdocScreen.list_header_created"), field: "created_at", sortable: true},
      {name: t("progressdocScreen.list_header_updated"), field: "updated_at", sortable: true, sort: 'desc'},
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
    this.agGridRef = React.createRef();
    this.jysTitle = t("kebiao.jys");
    this.titleSelected = "";
  }

  componentDidMount() {
    this.loadData();
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { schoolYear, jysList, stageList, docList } = this.props;
    const { selectedJysIdList, selectedDocId, isProgressDocOpen, isLoading, rowSelected, semesterPages, showMyProgress, filteredDocList } = this.state;
    if (nextState.selectedDocId !== selectedDocId || nextState.isProgressDocOpen !== isProgressDocOpen || nextState.selectedJysIdList !== selectedJysIdList || nextState.isLoading !== isLoading || nextState.rowSelected !== rowSelected) {
      //console.log("shouldComponentUpdate, selected_jys diff");
      return true;
    } else if (nextProps.schoolYear !== schoolYear || nextProps.jysList !== jysList || nextProps.docList !== docList) {
      //console.log("shouldComponentUpdate, props diff");
      return true;
    } else if (nextProps.stageList !== stageList ) {
      return true;
    } else if (nextState.semesterPages !== semesterPages || nextState.showMyProgress !== showMyProgress || nextState.filteredDocList !== filteredDocList) {
      return true;
    }
    return false;
  }

  componentDidUpdate(prevProps, prevState) {
    //console.log("LIFECYCLE: componentDidUpdate");
    // Disable Open button when changing department then lost row selection
    if (prevState.selectedJysIdList !== this.state.selectedJysIdList) {
      // Department changed by user
      this.setState({
        selectedDocId: -1,
      });
      // Load teacher list
      const department_id = this.state.selectedJysIdList[0];
      if (department_id > 0) {
        this.props.searchTeachers(department_id);
      }
    }
    if (prevProps.fetchedDocId !== this.props.fetchedDocId) {
      if (this.props.fetchedDocId < 0 && this.state.isNewDoc === false) {
        this.setState({
          isProgressDocOpen: false,
        });
      }
    }
    if (prevProps.docList !== this.props.docList || prevState.showMyProgress !== this.state.showMyProgress) {
      // Perform doc list filter
      this.setState({
        isLoading: false,
        filteredDocList: this.state.showMyProgress?this.props.docList.filter(doc => doc.user_id === this.props.userInfo.id):this.props.docList
      });
      //console.log(this.state.filteredDocList);
    }
    if (prevState.isLoading !== this.state.isLoading) {
      // Trigger main-navigator to show circular progress bar!
      this.props.setSpinner(this.state.isLoading);
    }
    if (prevProps.stageList !== this.props.stageList) {
      const { t } = this.props;
      // Add special items to selector
      this.setState({semesterPages : {0: t("progressdocScreen.stage_none"), ...this.props.stageList, 99999: t("progressdocScreen.stage_all")}});
    }
    if (this.props.createdDocId > 0) {
      // New doc created! Switch to stage 0
      if (this.state.selectStage == 0 && this.props.selectedGroup.endsWith('_0')) {
        // Currently on stage_0 page
        const docId = this.props.createdDocId;
        // Wait for 800ms for data grid ready, otherwise getRowNode will return null if cells not rendered yet!
        setTimeout(() => {
          this.selectDoc(docId);
        }, 800);
        this.props.clearCreatedDoc();
      } else if (prevProps.createdDocId !== this.props.createdDocId) {
        this.setState({selectStage: 0, rowSelected: 0});
        this.loadDocList(this.state.selectedJysIdList, 0);  
      }
    }
  }

  componentWillUnmount() {
    this.setState = ()=>false;
  }

  // SelectDoc works only after onGridReady called!!!
  selectDoc = (docId) => {
    if (!this.agGridRef.current || docId <= 0) return;
    const api = this.agGridRef.current.gridApi;
    if (api) {
      let node = api.getRowNode(docId);
      if (node) {
        api.deselectAll();
        node.setSelected(true);
      }
    }
  }

  loadData = () => {
    if (!this.state.semesterPages || this.state.semesterPages.length === 0) {
      this.props.fetchStageList();
    }
    if (!this.jysDict || Object.keys(this.jysDict).length === 0) { // only get jys list when it's empty
      this.loadjysData();
    }
    if (this.state.selectedJysIdList && !this.hasFetchKebiao) {
      this.loadDocList(this.state.selectedJysIdList);
    }
  }

  loadjysData = () => {
    //console.log("loadjysData");
    this.props.fetchJiaoyanshi(false);
    this.jysDict = this.props.getJysDictByFaculty();
  }
  
  loadDocList = (jysIdList, stage_id=-1) => {
    if (!jysIdList || jysIdList.length < 1) {
      console.error("JYS not selected yet");
      return;
    }
    let stage = stage_id;
    if (stage < 0) {
      stage = this.state.selectStage;
    }
    console.log("loadDocList, year: "+stage+" jysId:"+jysIdList[0]);
    this.setState({isLoading: true});
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
    //console.log(`onRowSelected: rowId=${rowId} docId=${docId}`);
    this.setState({
      selectedDocId: docId
    });
  }

  onSemesterPageChanged = (index) => {
    const { semesterPages } = this.state;
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
      selectStage: target_stage,
      rowSelected: 0
    });
    this.loadDocList(this.state.selectedJysIdList, target_stage);
  }

  onRowDoubleClicked = (rowId, docId) => {
    //console.log(`onRowDoubleClicked: rowId=${rowId} docId=${docId}`);
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
    const { userInfo, accessLevel } = this.props;
    if (selectedDocId <= 0) {
      this.props.setToast({type:"warning", message:"toast.warn_no_row_selected"});
      return;
    }
    const api = this.agGridRef.current.gridApi;
    if (api) {
      let node = api.getRowNode(""+selectedDocId);
      if (!node) {
        this.props.setToast({type:"warning", message:"toast.warn_doc_delete_stopped_by_grid_fail"});
        return;
      }
      if (node.data.user_id !== userInfo.id || accessLevel < role.OFFICER) {
        this.props.setToast({type:"warning", message:"toast.warn_doc_delete_stopped_by_access_right"});
        return;
      }
      if ((node.data.classes && Object.keys(node.data.classes).length > 0) || (node.data.curriculums && node.data.curriculums > 0)){
        this.props.setToast({type:"warning", message:"toast.warn_doc_delete_stopped_by_reference"});
        return;
      } else {
        this.props.deleteDoc(selectedDocId);
        this.setState({rowSelected: 0});
      }
    }
  }

  onSelectionChanged = (params) => {
    const rowCount = params.api.getSelectedNodes().length;
    this.setState({
      rowSelected: rowCount
    });
  };

  render() {
    const { t, jysList, docList, userInfo, accessLevel, fetchedDocId, jysTeachers } = this.props;
    const { selectStage, selectedDocId, isProgressDocOpen, isNewDoc, isLoading, rowSelected, semesterPages, filteredDocList } = this.state;
    const { color, jysTitle, titleSelected, docListHeaders } = this;
    let tableTitle = "";
    if (titleSelected && titleSelected.length > 0) {
      tableTitle =  t("progressdocScreen.doclist_table_title_template", {jys_name: titleSelected});
    } else {
      tableTitle = t("subjectBoard.title_no_jys_template");
    }
    return (
      <Flex width="100%" height="100%" direction="column" align="center" mb={5}>
        <SubjectBoard t={t} my={4} color={color}
          title={jysTitle}
          subjects={jysList}
          initSelectIds={this.defaultselectedJysIdList}
          selectedIdsChanged={this.onJysIdsChanged}
          enableAutoTitle={true}
          enableSelect />
        <Box borderWidth={1} borderColor={color+".200"} borderRadius="md" overflowY="hidden" width="100%" my={4} >
          <Flex direction="row" justifyContent="flex-start" alignItems="center" px={5} py={2}>
            <Icon as={MdFilter} color={color+".200"} size={8} />
            <Text mx={5} minW={100} whiteSpace="break-spaces">{t("progressdocScreen.hint_stageselector")}</Text>
            {
              (semesterPages && Object.keys(semesterPages).length > 0) &&
              <Select minW={200} variant="filled" value={selectStage} onChange={this.onStageChanged}>
              {
                Object.keys(semesterPages).map((stage_id) => (
                  <option key={stage_id} value={stage_id} >{semesterPages[stage_id]}</option>
                ))
              }
              </Select>
            }
            <Checkbox mx={5} size='lg' colorScheme='orange' minW={100} defaultIsChecked defaultChecked onChange={(e) => this.setState({ showMyProgress: e.target.checked })}>{t("common.only_mine")}</Checkbox>
            <PromptDrawer t={t} promptText={t("editRawplanScreen.prompt_text")}/>
          </Flex>
        </Box>
        {
          !isLoading && docList && 
          <ResultTable
            ref={this.agGridRef}
            getRowNodeId={data => data.id}
            //minHeight={docList.length>3?800:180}
            maxHeight={950}
            titleHeight={50}
            colLineHeight={20}
            defaultColWidth={180}
            title={tableTitle}
            color={color}
            headers={docListHeaders}
            data={filteredDocList}
            rowSelection="single"
            onRowSelected={this.onRowSelected}
            onRowDoubleClicked={this.onRowDoubleClicked}
            onSelectionChanged={this.onSelectionChanged}
            //onGrid2Ready={this.onGrid2Ready}
          />
        }
        <ButtonGroup size="lg">
          <Button leftIcon={MdEdit} variantColor="blue" variant="solid" mt={3} isDisabled={rowSelected<1} 
            onClick={e => this.openProgressDocDialog(selectedDocId)}>
            {t("common.open")}
          </Button>
          <Button leftIcon={MdAdd} variantColor="green" variant="solid" mt={3} 
            onClick={this.onCreateDoc}>
            {t("common.new")}
          </Button>
          <ButtonConfirmPopover t={t} leftIcon={MdDelete} variantColor="red" variant="solid" mt={3} isDisabled={rowSelected<1} 
            onConfirm={this.onDeleteDoc} btnTitle={t("common.delete")} popText={t("progressdocScreen.warning_delete_doc")}/>
        </ButtonGroup>
        {
        isProgressDocOpen &&
        <ProgressdocDialog
          t={t}
          color={color}
          isOpen={isProgressDocOpen}
          onClose={this.onProgressDocClose}
          departmentsDict={this.jysDict}
          fetchedDocId={fetchedDocId}
          title={t("progressdocScreen.doc_detail_title")}
          btnText={t("common.open")}
          userInfo={userInfo}
          accessLevel={accessLevel}
          isNewDoc={isNewDoc}
          teachersDict={jysTeachers} />
        }
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
    fetchedDocId: getFetchedDocId(state),
    createdDocId: getCreatedDocId(state),
    selectedGroup: getSelectedGroup(state),
    jysTeachers: searchedTeachers(state),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    ...bindActionCreators(jysActions, dispatch),
    ...bindActionCreators(gradeActions, dispatch),
    ...bindActionCreators(progressdocActions, dispatch),
    ...bindActionCreators(authActions, dispatch),
    ...bindActionCreators(appActions, dispatch),
    ...bindActionCreators(teacherActions, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(withTranslation()(ProgressdocScreen));
