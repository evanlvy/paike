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
  } from "@chakra-ui/core"
import { MdSearch } from "react-icons/md"
import { actions as progressdocActions, getLabitemContent, getSearchedLabitemBriefs } from '../../redux/modules/progressdoc';
import { isThisSecond } from 'date-fns';

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
      selectedId: -1,
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
    console.log("getDerivedStateFromProps");
    let result = {isOpen: props.isOpen};
    if (!props.context) {
      result = {...result, ...LabitemDialog.empty_context};
    }
    if (props.imported && "id" in props.imported) {
      if (!state.original || props.imported.id !== state.original.id) {
        result["original"] = Object.assign({}, props.imported);  // Never use '=' to assign value here!
        if (props.imported.items) {
          let short_names = props.imported.items.map(function (lab_info) {
            return lab_info.location;
          });
          result["original"]["locations"] = short_names.join(', ');
        }
      }
      return result;
    }

    let next_labitem_id = (!props.data)?-1:props.data.id;
    if (props.context && !state.doc_department_id) {
      // props.data can be empty for empty cell clicked!
      result = {...result, ...props.context};
      result["doc_lab_content"] = "";
    }
    // initialize the state with props by the same name id!
    if (!state.original || (next_labitem_id !== state.original.id)) {
      result["original"] = (!props.data)?LabitemDialog.empty_object:props.data;
      //result["original"] = Object.assign({}, props.data);
      if (props.data && props.data.items) {
        let short_names = props.data.items.map(function (lab_info) {
          return lab_info.location;
        });
        result["original"]["locations"] = short_names.join(', ');
        result["doc_locs"] = short_names.join(', ');
      }
      result = {...result, ...props.context};
      result["doc_lab_content"] = "";
      result["selectedId"] = -1;  // Clear the selection
      /*if (props.data.id > 0) {
        result["doc_labitem_brief"] = {[props.data.id]: "<"+props.data.description+">"+props.data.name+" "+(("locations" in result)?result["locations"]:"")}
      } else {
        result["doc_labitem_brief"] = {}
      }*/
    }
    return result;
  }

  componentDidUpdate(prevProps, prevState) {
    console.log("LIFECYCLE: componentDidUpdate");
    if (prevProps.searchResult !== this.props.searchResult && prevState.isSearching) {
      // Got the search API result! Change button loading state.
      this.setState({
        isSearching: false,
      });
    }
  }

  onClose = () => {
    this.setState({ isOpen: false });
    const { onClose:onCloseCallback } = this.props;
    if (onCloseCallback != null) {
      onCloseCallback();
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { data, searchResult, imported, context } = this.props;
    //const { isOpen, department_id, items } = this.state;

    if (nextProps.context !== context && context && nextProps.context.doc_course_name !== context.doc_course_name) {
      if (!nextProps.imported || !("id" in nextProps.imported)) {
        console.log("shouldComponentUpdate, clearSearchedLabitem!");
        this.props.clearSearchedLabitem();
      }
      return true;
    }
    if (nextProps.data !== data || nextProps.searchResult !== searchResult || nextProps.imported !== imported) {
      console.log("shouldComponentUpdate, nextProp data diff");
      return true;
    }

    if (nextState !== this.state/*nextState.isOpen !== isOpen || nextState.items !== items || nextState.department_id !== department_id*/) {
      if (nextState.isSearching !== this.state.isSearching) {
        return false;
      }
      console.log("shouldComponentUpdate, nextState diff");
      /*if (nextState.original.id !== this.state.original.id) {
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
    let original = this.state.original;
    original[event.target.id] = newVal;
    this.setState({
      original,
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
      selectedId: -1,
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
    if (labitem_id > 0) {
      this.props.fetchLabitem(labitem_id);
    }
    this.setState({
      tabIndex: 1,
    });
  }

  onReSelected = () => {
    let labitem_id = this.state.selectedId;
    if (labitem_id > 0) {

    }
  }
  
  onSaveEdited = () => {
    
  }

  render() {
    const { isOpen, selectedId, isSearching, tabIndex, original:edit_source,
      doc_department_id, doc_short_name, doc_course_name, doc_lab_content, doc_locs } = this.state;
    const { t, title, color, isSaveable, departments, searchResult, data:labItemProp,  context:docContext } = this.props;
    const { btnRef, onClose, onFormChanged, onSearchChanged, onSearch, onSearchResultSelected, handleTabsChange, onLoadExisted, onReSelected, onSaveEdited } = this;
    return (
      <>
        <Modal
          isCentered
          onClose={onClose}
          finalFocusRef={btnRef}
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
                {(!doc_locs)?t("labitemScreen.hint_no_lab_locations"):doc_locs}
              </Text>
              <Box w='100%' borderWidth='2px' borderRadius='lg'>
              <Tabs isFitted index={tabIndex} onChange={handleTabsChange}>
                <TabList mb='1em'>
                  <Tab><Trans>labitemScreen.tab_select</Trans></Tab>
                  <Tab><Trans>labitemScreen.tab_edit</Trans></Tab>
                </TabList>
                <TabPanels>
                  <TabPanel>
                    <Text fontWeight='bold' ml="1rem" mb="2"><Trans>labitemScreen.cap_search_conditions</Trans>&#58;&nbsp;</Text>
                    <Box w='100%' borderWidth='1px'>
                      <Text flex="0" fontWeight='bold' mx='1rem' mt="1rem"><Trans>labitemScreen.cap_search_by_course</Trans>&#58;&nbsp;</Text>
                      <Flex direction="row" alignItems="center" wrap="wrap" px={5} py={2}>
                        <Input flex="1" id="doc_course_name" value={doc_course_name} onChange={onSearchChanged} isDisabled={isSearching}
                                borderColor={(docContext && "doc_course_name" in docContext && doc_course_name!==docContext.doc_course_name)?"blue.500":"gray.200"}/>
                        <Text flex="0" fontWeight='bold' mx='1rem'><Trans>common.or</Trans></Text>
                        <Input flex="1" id="doc_short_name" value={doc_short_name} onChange={onSearchChanged} isDisabled={isSearching}
                                borderColor={(docContext && "doc_short_name" in docContext && doc_short_name!==docContext.doc_short_name)?"blue.500":"gray.200"}/>
                      </Flex>
                      <Text flex="0" fontWeight='bold' mx='1rem'><Trans>labitemScreen.cap_search_by_content</Trans>&#58;&nbsp;</Text>
                      <Flex direction="row" alignItems="center" wrap="wrap" px={5} py={2}>
                        <Input flex="1" id="doc_lab_content" value={doc_lab_content} onChange={onSearchChanged} isDisabled={isSearching}
                                placeholder = {t("labitemScreen.placeholder_search_lab_content")}
                                borderColor={(docContext && "doc_lab_content" in docContext && doc_lab_content!==docContext.doc_lab_content)?"blue.500":"gray.200"}/>
                      </Flex>
                      <Text flex="0" fontWeight='bold' mx='1rem'><Trans>labitemScreen.cap_search_by_department</Trans>&#58;&nbsp;</Text>
                      <Flex direction="row" alignItems="center" wrap="wrap" px={5} pt={2} pb={4}>
                        <Select flex="1" id="doc_department_id" variant="outline" value={doc_department_id} onChange={onSearchChanged} 
                        isDisabled={isSearching} placeholder={t("labitemScreen.search_placeholder")}
                              borderColor={(docContext && "doc_department_id" in docContext && doc_department_id!==docContext.doc_department_id)?"blue.500":"gray.200"}>
                            {
                              departments.map((dep) => (
                                <option key={dep.id} value={dep.id} >{dep.name}</option>
                              ))
                            }
                        </Select>
                        <Button flex="1" leftIcon={MdSearch} variantColor="blue" variant="solid" ml={5} minW="80" isLoading={isSearching} loadingText={t("common.search")} 
                        onClick={onSearch}>{t("common.search")}</Button>
                      </Flex>
                    </Box>
                    <Text fontWeight='bold' mx='1rem' mt='1rem'><Trans>labitemScreen.cap_search_result</Trans>&#58;&nbsp;</Text>
                    <Flex direction="row" alignItems="center" wrap="wrap" px={5} py={4}>
                      <Select id="search_result_selector" flex="1" isDisabled={isSearching} variant="outline" 
                      placeholder={t("labitemScreen.search_total_placeholder")+Object.keys(searchResult).length} 
                      value={selectedId} onChange={onSearchResultSelected}>
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
                        this.edit_form.map((form, index) => (
                          <FormControl key={form.id} isRequired={form.isRequired} minW={form.minW} maxW={form.maxW} m={2}>
                            <FormLabel><b>{form.label}</b></FormLabel>
                            <Input id={form.id} type={form.id} value={edit_source[form.id]} onChange={onFormChanged}
                              borderColor={(labItemProp && form.id in labItemProp && edit_source[form.id]!==labItemProp[form.id])?"red.500":"gray.200"}/>
                          </FormControl>
                        ))
                      }
                      {
                      departments &&
                      <FormControl key="department_id" isRequired minW={280} m={2}>
                        <FormLabel><b><Trans>progressdocScreen.form_label_departmentid</Trans></b></FormLabel>
                        <Select id="department_id" variant="outline" value={edit_source["department_id"]} onChange={onFormChanged}
                          borderColor={(labItemProp && "department_id" in labItemProp && edit_source["department_id"]!==labItemProp["department_id"])?"red.500":"gray.200"}>
                        {
                          departments.map((dep) => (
                            <option key={dep.id} value={dep.id} >{dep.name}</option>
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
                <Button variantColor="green" mr={3} isDisabled={selectedId.length<=0} onClick={onLoadExisted}>{t("labitemScreen.btn_import_labitem")}</Button>
              }
              { isSaveable && 
                <Button variantColor="red" mr={3} onClick={tabIndex === 0?onReSelected:onSaveEdited}
                isDisabled={(tabIndex === 0 && selectedId.length <= 0) || (tabIndex === 1 && (edit_source.description.length <= 0 || edit_source.locations.length <= 0 || edit_source.name.length <= 0))} >
                  {t(tabIndex === 0?"common.ok":"common.save")}</Button>
              }
              <Button onClick={onClose}>{t("common.close")}</Button>
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
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    ...bindActionCreators(progressdocActions, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(LabitemDialog));