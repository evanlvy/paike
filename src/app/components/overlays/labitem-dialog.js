import React, { Component } from 'react';
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { Trans, withTranslation } from 'react-i18next';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    FormControl,
    FormLabel,
    FormErrorMessage,
    FormHelperText,
    Flex,
    Input,
    Box,
    Select,
    Text,
    Tabs,
    TabPanels,
    TabPanel,
    Tab,
    TabList,
    Tooltip,
  } from "@chakra-ui/core"
import { MdSearch } from "react-icons/md"
import { actions as progressdocActions, getLabitemContent, getSearchedLabitemBriefs, getCreatedLabitem, parseImmutableLocs } from '../../redux/modules/progressdoc';

const DEFAULT_COLOR = "purple";
const CANCEL_COLOR = "gray";

class LabitemDialog extends Component {
  constructor(props) {
    super(props);
    const { t, color } = props;
    this.state = {
      isOpen: false,
      tabIndex: 0,
      depSelected: -1,
      selectedId: '',
      formValues: LabitemDialog.empty_object,
      //doc_labitem_brief: "",
    };
    this.color = color ? color : DEFAULT_COLOR;

    this.btnRef = React.createRef()
    this.edit_form = [
      {id: "description", label: t("labitemScreen.form_label_keyword"), minW: 280, isRequired: true},
      {id: "name", label: t("labitemScreen.form_label_name"), minW: 280, isRequired: true},
      //{id: "department_id", label: t("labitemScreen.form_label_department"), minW: 280, isRequired: false},
      {id: "max_team_headcount", label: t("labitemScreen.form_label_max_team_headcount"), maxW: 100, isRequired: false},
      {id: "teacher_count", label: t("labitemScreen.form_label_teacher_count"), maxW: 100, isRequired: false},
      {id: "labdivision_id", label: t("labitemScreen.form_label_labdivision_id"), maxW: 100, isRequired: false},
      {id: "locations", label: t("labitemScreen.form_label_labs"), minW: 280, isRequired: true},
    ];
  }

  static empty_object = {
    "id": -1,
    "description": "",
    "name": "",
    "department_id": -1,
    "max_team_headcount": 0,
    "teacher_count": 1,
    "labdivision_id": -1,
    "locations": "",
  };

  static empty_context = {
    course_name: "",
    short_name: "",
    content: "",
  };

  static getDerivedStateFromProps(props, state) {
    //console.log("getDerivedStateFromProps");
    let result = {isOpen: props.isOpen};
    if (!props.isOpen) {
      // Clear state when closed
      return { isOpen: false, selectedId: '', tabIndex: 0, formValues: LabitemDialog.empty_object};
    }
    if (!props.context) {
      result = {...result, ...LabitemDialog.empty_context};
    }

    let next_labitem_id = (!props.data)?-1:props.data.id;
    if (props.context && !state.doc_department_id) {
      // props.data can be empty for empty cell clicked!
      result = {...result, ...props.context};
      result["doc_lab_content"] = "";
    }
    // After labitem briefs received, select the labitem result when re-enter labitem dialog
    if (state.selectedId.length <= 0) {
      if (!state.formValues || (next_labitem_id !== state.formValues.id)) {
        result["formValues"] = Object.assign({},(!props.data)?LabitemDialog.empty_object:props.data);
        result["formValues"]['department_id'] = props.data.department_id;
        //result["formValues"] = Object.assign({}, props.data);
        result = {...result, ...props.context};
        result["doc_lab_content"] = '';
        result["tabIndex"] = 0;
        if (props.data && props.searchResult && (props.data.id in props.searchResult)){
          // Auto select current labitem from search result
          result["selectedId"] = props.data.id;
        } else {
          result["selectedId"] = '';  // Clear the selection
        }
        /*if (props.data.id > 0) {
          result["doc_labitem_brief"] = {[props.data.id]: "<"+props.data.description+">"+props.data.name+" "+(("locations" in result)?result["locations"]:"")}
        } else {
          result["doc_labitem_brief"] = {}
        }*/
        return result;
      }
    }

    if (props.imported && "id" in props.imported) {
      if (!state.formValues || props.imported.id !== state.formValues.id) {
        result["formValues"] = Object.assign({}, props.imported);  // Never use '=' to assign value here!
        if (props.imported.items) {
          result["formValues"]["locations"] = parseImmutableLocs(props.imported.items);
        }
        result['tabIndex'] = 1;
      }
    }

    return result;
  }

  componentDidUpdate(prevProps, prevState) {
    //console.log("LIFECYCLE: componentDidUpdate");
    if (prevProps.searchResult !== this.props.searchResult) {
      if (prevState.isSearching) {
        // Got the search API result! Change button loading state.
        this.setState({
          isSearching: false,
        });
      }
      if (prevState.selectedId.length <= 0 && this.props.data && (this.props.data.id in this.props.searchResult)) {
        // Select current labitem in case there's no selection!
        this.setState({
          selectedId: this.props.data.id,
        });
      }
    }
    if (prevProps.created !== this.props.created && this.props.created > 0) {
      // New items created successfully
      this.onLabItemCreated();
    }
  }

  onClose = (params=null) => {
    const { onClose:onCloseCallback } = this.props;
    this.props.clearSelectedLabitem();
    if (onCloseCallback != null) {
      onCloseCallback(params);
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { data, searchResult, imported, context } = this.props;
    //const { isOpen, department_id, items } = this.state;

    if (context && nextProps.context !== context && nextProps.context.doc_course_name !== context.doc_course_name) {
      // Doc course name changed, clear searched result!
      //if (!nextProps.imported || !("id" in nextProps.imported)) {
        //console.log("shouldComponentUpdate, clearSearchedLabitem!");
        //this.props.clearSearchedLabitem();
      //}
      return true;
    }
    if (nextProps.data !== data || nextProps.searchResult !== searchResult || nextProps.imported !== imported) {
      //console.log("shouldComponentUpdate, nextProp data diff");
      return true;
    }

    if (nextState !== this.state/*nextState.isOpen !== isOpen || nextState.items !== items || nextState.department_id !== department_id*/) {
      if (nextState.isSearching !== this.state.isSearching) {
        return false;
      }
      //console.log("shouldComponentUpdate, nextState diff");
      /*if (nextState.formValues.id !== this.state.formValues.id) {
        if (!nextProps.imported || !("id" in nextProps.imported)) {
          console.log("shouldComponentUpdate, clearSearchedLabitem!");
          this.props.clearSearchedLabitem();
        }
      }*/
      return true;
    }

    /*for (let index = 0; index < this.edit_form.length; index++) {
      let form = this.edit_form[index];
      if (this.state[form.id] !== nextState[form.id]) {
        console.log("shouldComponentUpdate, FORMs diff:"+form.id);
        return true;
      }
    }*/
    return false;
  }
  
  onFormChanged = (event) => {
    let newVal = event.target.value;
    if (event.target.id.endsWith("_hours")){
      // Keep numberic value, remove 0 from header
      newVal = newVal.replace(/[^0-9]/ig, "").replace(/\b(0+)/gi,"");
      if (newVal.length < 1) {
        newVal = "0";
      }
    } else {
      newVal = newVal.trim();
    }
    // Must keep the state id same with the form input id
    let formValues = this.state.formValues;
    formValues[event.target.id] = newVal;
    this.setState({
      formValues,
    });
  }
  
  onSearchChanged = (event) => {
    let newVal = event.target.value;
    if (event.target.id.endsWith("_hours")){
      // Keep numberic value, remove 0 from header
      newVal = newVal.replace(/[^0-9]/ig, "").replace(/\b(0+)/gi,"");
      if (newVal.length < 1) {
        newVal = "0";
      }
    } else {
      newVal = newVal.trim();
    }
    // Must keep the state id same with the form input id
    this.setState({
      [event.target.id] : newVal,
    });
  }

  onSearchResultSelected = (event) => {
    this.setState({
      selectedId : event.target.value,
    });
  }

  onSearch = () => {
    const { doc_department_id, doc_short_name, doc_course_name, doc_lab_content } = this.state;
    this.setState({
      isSearching: true,
      selectedId: '',
      //doc_labitem_brief: this.props.t("labitemScreen.search_placeholder")
    });
    this.props.searchLabitem(doc_course_name, doc_short_name, doc_lab_content, doc_department_id);
  }

  handleTabsChange = (index) => {
    this.setState({
      tabIndex : index,
    });
  }

  onLoadExisted = () => {
    let labitem_id = this.state.selectedId;
    if (labitem_id.length > 0) {
      this.props.fetchLabitem(labitem_id);
    }
    //this.setState({
    //  tabIndex: 1,
    //});
  }

  onReSelected = () => {
    const { context, searchResult } = this.props;
    let labitem_id = this.state.selectedId;
    if (labitem_id > 0 && context) {
      let lab_alloc = {id: labitem_id};
      lab_alloc.items = this.parseLocStrToObject(searchResult[labitem_id]);
      let param = {progressId:context.progressId, lab_alloc:lab_alloc}
      /*if (searchResult && labitem_id in searchResult) {
        let lab_arr = searchResult[labitem_id].split('#');
        if (lab_arr.length > 1) {
          // Get loc_array from Searchbox item
          let lab_str = lab_arr[lab_arr.length-1];
          param['lab_locs'] = lab_str.trim().split(" ");
          //labs.forEach((v, i) => param['lab_locs'][i] = {location:v});
        }
      }*/
      this.onClose(param);
    }
  }

  onLabItemCreated = () => {
    const { context, created } = this.props;
    const { formValues } = this.state;  // Reflect value of edit boxes
    let labitem_id = created;
    if (labitem_id > 0 && context && formValues) {
      let lab_alloc = {...formValues};
      lab_alloc.id = labitem_id;
      if (lab_alloc.locations.length > 0) {
        // Get loc_array from lab location edit box
        lab_alloc.items = this.parseLocStrToObject(formValues.locations);
        delete lab_alloc.locations;
      }
      this.onClose({progressId:context.progressId, lab_alloc:lab_alloc});
    }
    if (created > 0) {
      this.props.clearCreatedLabitem();
      this.onClose();
    }
  }
  
  onSaveEdited = () => {
    const { data:labItemProp, context } = this.props;
    const { formValues } = this.state;
    this.props.clearCreatedLabitem();
    // Always create a new labitem!
    let has_diff = false;
    let props_diff = Object.assign({}, formValues);  // Must have id prop
    props_diff['id'] = -1;
    // Remove props that never changed
    //let props_diff = {id: -1};
    for (let index = 0; index < this.edit_form.length; index++) {
      let form = this.edit_form[index];
      if (formValues[form.id] !== labItemProp[form.id]) {
        console.log("onSave: FORMs diff:"+form.id);
        //props_diff[form.id] = formValues[form.id];
        has_diff = true;
      }
    }
    //console.log(props_diff);
    if (has_diff) {
      // Remove lab items that should not be accepted by database.
      delete props_diff['items'];
      // Use location array to set to database instead.
      if ('locations' in props_diff) {
        props_diff['lab_locs'] = this.parseLocArray(props_diff['locations']);
        delete props_diff['locations'];
      }
      this.props.saveLabItem(context.progressId, -1, props_diff);
    }
  }

  parseLocArray = (loc) => {
    let loc_str = loc;
    if (loc_str.indexOf('#') >= 0) {
      // Is brief search result aaa # A101 A102
      let brief_array = loc_str.split('#');
      loc_str = brief_array[brief_array.length-1];
    }
    loc_str = loc_str.replace(',', ' ').replace('，', ' ').replace('.', ' ').replace('。', ' ');
    loc_str = loc_str.replace(/\s+/g, ' ').trim();
    return loc_str.split(' ');
  }

  parseLocStrToObject = (loc) => {
    let loc_array = this.parseLocArray(loc);
    if (loc_array.length <= 0) return null;
    let loc_obj = {};
    let fake_loc_id = 1;
    loc_array.forEach(element => {
      loc_obj[""+fake_loc_id++] = {location: element};
    });
    return loc_obj;
  }

  render() {
    const { isOpen, selectedId, isSearching, tabIndex, formValues:edit_source,
      doc_department_id, doc_short_name, doc_course_name, doc_lab_content } = this.state;
    const { t, title, isSaveable, departmentsDict, searchResult, data:labItemProp,  context:docContext } = this.props;
    return (
      <>
        <Modal
          isCentered
          onClose={this.onClose}
          finalFocusRef={this.btnRef}
          isOpen={isOpen}
          scrollBehavior="outside"
          motionPreset='slideInBottom'
          closeOnOverlayClick={false}
          closeOnEsc={false}
        >
          <ModalOverlay />
          <ModalContent maxW="50rem" borderRadius="md">
            <ModalHeader>{title}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text fontWeight='bold' mb='1rem'>
                {t("labitemScreen.cap_original_lab_content")}&#58;&nbsp;
                {(docContext && "doc_lab_content" in docContext)?docContext.doc_lab_content:t("labitemScreen.hint_no_lab_content")}
              </Text>
              <Text fontWeight='bold' mb='1rem'>
                {t("labitemScreen.cap_original_lab_locations")}&#58;&nbsp;
                {(!labItemProp || !labItemProp.locations)?t("labitemScreen.hint_no_lab_locations"):(labItemProp.locations+" [DBID:"+labItemProp.id)+"]"}
              </Text>
              <Box w='100%' borderWidth='2px' borderRadius='lg'>
              <Tabs isFitted index={tabIndex} onChange={this.handleTabsChange}>
                <TabList mb='1em'>
                  <Tab><Trans>labitemScreen.tab_select</Trans></Tab>
                  <Tab><Trans>labitemScreen.tab_edit</Trans></Tab>
                </TabList>
                <TabPanels>
                  <TabPanel>
                    <Text fontWeight='bold' ml="1rem" mb="2"><Trans>labitemScreen.cap_search_conditions</Trans>&#58;&nbsp;</Text>
                    <Box w='100%' borderWidth='1px' bg='yellow.50'>
                      <Text flex="0" fontWeight='bold' mx='1rem' mt="1rem"><Trans>labitemScreen.cap_search_by_course</Trans>&#58;&nbsp;</Text>
                      <Flex direction="row" alignItems="center" wrap="wrap" px={5} py={2}>
                        <Input flex="1" id="doc_course_name" value={doc_course_name} onChange={this.onSearchChanged} isDisabled={isSearching}
                                borderColor={(docContext && "doc_course_name" in docContext && doc_course_name!==docContext.doc_course_name)?"blue.500":"gray.200"}/>
                        <Text flex="0" fontWeight='bold' mx='1rem'><Trans>common.or</Trans></Text>
                        <Input flex="1" id="doc_short_name" value={doc_short_name} onChange={this.onSearchChanged} isDisabled={isSearching}
                                borderColor={(docContext && "doc_short_name" in docContext && doc_short_name!==docContext.doc_short_name)?"blue.500":"gray.200"}/>
                      </Flex>
                      <Text flex="0" fontWeight='bold' mx='1rem'><Trans>labitemScreen.cap_search_by_content</Trans>&#58;&nbsp;</Text>
                      <Flex direction="row" alignItems="center" wrap="wrap" px={5} py={2}>
                        <Input flex="1" id="doc_lab_content" value={doc_lab_content} onChange={this.onSearchChanged} isDisabled={isSearching}
                                placeholder = {t("labitemScreen.placeholder_search_lab_content")}
                                borderColor={(docContext && "doc_lab_content" in docContext && doc_lab_content!==docContext.doc_lab_content)?"blue.500":"gray.200"}/>
                      </Flex>
                      <Text flex="0" fontWeight='bold' mx='1rem'><Trans>labitemScreen.cap_search_by_department</Trans>&#58;&nbsp;</Text>
                      <Flex direction="row" alignItems="center" wrap="wrap" px={5} pt={2} pb={4}>
                        <Select flex="1" id="doc_department_id" variant="outline" value={doc_department_id} onChange={this.onSearchChanged} 
                        isDisabled={isSearching} placeholder={t("labitemScreen.search_placeholder")}
                              borderColor={(docContext && "doc_department_id" in docContext && doc_department_id!==docContext.doc_department_id)?"blue.500":"gray.200"}>
                            {
                            Object.keys(departmentsDict).map((dep_id) => (
                              <option key={dep_id} value={dep_id} >{departmentsDict[dep_id]}</option>
                            ))
                            }
                        </Select>
                        <Tooltip zIndex="tooltip" hasArrow label={t("labitemScreen.tooltip_search_item")}>
                          <Button flex="1" leftIcon={MdSearch} variantColor="blue" variant="solid" ml={5} minW="80" isLoading={isSearching} loadingText={t("common.search")} 
                          onClick={this.onSearch}>{t("common.search")}</Button>
                        </Tooltip>
                      </Flex>
                    </Box>
                    <Text fontWeight='bold' mx='1rem' mt='1rem'><Trans>labitemScreen.cap_search_result</Trans>&#58;&nbsp;</Text>
                    <Flex direction="row" alignItems="center" wrap="wrap" px={5} py={4}>
                      <Select id="search_result_selector" flex="1" isDisabled={isSearching} variant="outline" 
                      placeholder={t("labitemScreen.search_total_placeholder")+Object.keys(searchResult).length} 
                      value={selectedId} onChange={this.onSearchResultSelected}>
                        {
                          Object.entries(searchResult).map((item) => (
                            <option key={item[0]} value={item[0]} >{item[1]}</option>
                          ))
                        }
                      </Select>
                    </Flex>
                  </TabPanel>
                  <TabPanel>
                  {
                    edit_source.id &&
                    <Flex direction="row" alignItems="center" wrap="wrap" px={5} py={2}>
                      {
                        this.edit_form.map((form) => (
                          <FormControl key={form.id} isRequired={form.isRequired} minW={form.minW} maxW={form.maxW} m={2}>
                            <FormLabel><b>{form.label}</b></FormLabel>
                            <Input id={form.id} type={form.id} value={edit_source[form.id]} onChange={this.onFormChanged}
                              borderColor={(labItemProp && form.id in labItemProp && edit_source[form.id]!==labItemProp[form.id])?"red.500":"gray.200"}/>
                          </FormControl>
                        ))
                      }
                      {
                      departmentsDict &&
                      <FormControl key="department_id" isRequired minW={280} m={2}>
                        <FormLabel><b><Trans>progressdocScreen.form_label_departmentid</Trans></b></FormLabel>
                        <Select id="department_id" variant="outline" value={edit_source["department_id"]} onChange={this.onFormChanged}
                          borderColor={(labItemProp && "department_id" in labItemProp && edit_source["department_id"]!==labItemProp["department_id"])?"red.500":"gray.200"}>
                        {
                          Object.keys(departmentsDict).map((dep_id) => (
                            <option key={dep_id} value={dep_id} >{departmentsDict[dep_id]}</option>
                          ))
                        }
                        </Select>
                        <FormHelperText><Trans>progressdocScreen.form_helper_departmentid</Trans></FormHelperText>
                      </FormControl>
                      }
                    </Flex>
                  }
                  </TabPanel>
                </TabPanels>
              </Tabs>
              </Box>
            </ModalBody>
            <ModalFooter>
              { tabIndex === 0 &&
                <Tooltip zIndex="tooltip" hasArrow label={t("labitemScreen.tooltip_import_selection")}>
                  <Button variantColor="green" mr={3} isDisabled={selectedId.length<=0} onClick={this.onLoadExisted}>{t("labitemScreen.btn_import_labitem")}</Button>
                </Tooltip>
              }
              { isSaveable && 
                <Tooltip zIndex="tooltip" hasArrow label={t(tabIndex === 0?"labitemScreen.tooltip_confirm_selection":"labitemScreen.tooltip_confirm_create")}>
                  <Button variantColor="red" mr={3} onClick={tabIndex === 0?this.onReSelected:this.onSaveEdited}
                  isDisabled={(tabIndex === 0 && selectedId.length <= 0) || (tabIndex === 1 && (edit_source.description.length <= 0 || edit_source.locations.length <= 0 || edit_source.name.length <= 0))} >
                    {t(tabIndex === 0?"common.ok":"common.new")}</Button>
                </Tooltip>
              }
              <Button onClick={this.onClose}>{t("common.close")}</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    searchResult: getSearchedLabitemBriefs(state),
    imported: getLabitemContent(state),
    created: getCreatedLabitem(state),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    ...bindActionCreators(progressdocActions, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(LabitemDialog));