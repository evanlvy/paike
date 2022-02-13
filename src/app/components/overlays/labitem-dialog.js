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

const DEFAULT_COLOR = "purple";
const CANCEL_COLOR = "gray";

class LabitemDialog extends Component {
  constructor(props) {
    super(props);
    const { t, color } = props;
    this.state = {
      isOpen: false,
      depSelected: -1,
    };
    this.color = color ? color : DEFAULT_COLOR;

    this.btnRef = React.createRef()
    this.edit_form = [
      {id: "description", label: t("labitemScreen.form_label_keyword"), minW: 280, isRequired: true},
      {id: "name", label: t("labitemScreen.form_label_name"), minW: 280, isRequired: true},
      //{id: "department_id", label: t("labitemScreen.form_label_department"), minW: 280, isRequired: false},
      {id: "max_team_headcount", label: t("labitemScreen.form_label_max_team_headcount"), maxW: 100, isRequired: true},
      {id: "teacher_count", label: t("labitemScreen.form_label_teacher_count"), maxW: 100, isRequired: true},
      {id: "labdivision_id", label: t("labitemScreen.form_label_labdivision_id"), maxW: 100, isRequired: true},
      {id: "locations", label: t("labitemScreen.form_label_labs"), minW: 280, isRequired: true},
    ];
  }

  static empty_object = {
    "id": "-1",
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
    if (!props.data) {
      return {...result, ...LabitemDialog.empty_object};
    }
    
    // initialize the state with props by the same name id!
    if (props.data.id !== state.id) {
      if (props.data.items) {
        let short_names = props.data.items.map(function (lab_info) {
          return lab_info.location;
        });
        result["locations"] = short_names.join(', ');
      }
      result = {...result, ...props.data, ...props.context};
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

  loadData = (labitem_from_prop) => {
    let labitem_object = labitem_from_prop;
    if (!labitem_object) {
      const { labitem : labitem_prop } = this.props;
      labitem_object = labitem_prop;
    }
    if (!labitem_object) {
      labitem_object = LabitemDialog.empty_object;
    }

    this.setState({ 
      isOpen: true,
    });
  }

  onClose = () => {
    this.setState({ isOpen: false });
    const { onClose:onCloseCallback } = this.props;
    if (onCloseCallback != null) {
      onCloseCallback();
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { data, searchResult, labItem } = this.props;
    const { isOpen, department_id, items } = this.state;
    
    if (nextProps.data !== data || nextProps.searchResult !== searchResult || nextProps.labItem !== labItem) {
      console.log("shouldComponentUpdate, nextProp data diff");
      return true;
    }
    if (nextState.isOpen !== isOpen /*|| nextState.items !== items || nextState.department_id !== department_id*/) {
      console.log("shouldComponentUpdate, nextState diff");
      return true;
    }

    for (let index = 0; index < this.edit_form.length; index++) {
      let form = this.edit_form[index];
      if (this.state[form.id] !== nextState[form.id]) {
        console.log("shouldComponentUpdate, FORMs diff:"+form.id);
        return true;
      }
    }
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
    this.setState({
      [event.target.id] : newVal,
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

  onLabitemChanged = (event) => {

  }

  onConditionDepartmentChanged = (event) => {}

  onSearch = () => {
    this.setState({
      isSearching: true,
    });
    this.props.searchLabitem("生物化学", "", 5);
  }

  render() {
    const { isOpen, id:labitem_id, department_id, isSearching } = this.state;
    const { t, title, color, btnText, isSaveable, departments, searchResult, data:labItem,  context:docContext} = this.props;
    const { btnRef, onClose, onFormChanged, onSearchChanged, onSearch, onLabitemChanged, onConditionDepartmentChanged } = this;
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
                {t("labitemScreen.cap_lab_content")}&#58;&nbsp;
                {(docContext && "content" in docContext)?docContext.content:t("labitemScreen.hint_lab_content")}
              </Text>
              <Box w='100%' borderWidth='2px' borderRadius='lg'>
              <Tabs isFitted>
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
                        <Input flex="1" id="kw_bycoursename" value={this.state["course_name"]} onChange={onSearchChanged}
                                borderColor={(docContext && "course_name" in docContext && this.state.content!==docContext.course_name)?"blue.500":"gray.200"}/>
                        <Text flex="0" fontWeight='bold' mx='1rem'><Trans>common.or</Trans></Text>
                        <Input flex="1" id="kw_byshortname" value={this.state["short_name"]} onChange={onSearchChanged}
                                borderColor={(docContext && "short_name" in docContext && this.state.content!==docContext.short_name)?"blue.500":"gray.200"}/>
                      </Flex>
                      <Text flex="0" fontWeight='bold' mx='1rem'><Trans>labitemScreen.cap_search_by_content</Trans>&#58;&nbsp;</Text>
                      <Flex direction="row" alignItems="center" wrap="wrap" px={5} py={2}>
                        <Input flex="1" id="kw_bycontent" value={this.state["course_name"]} onChange={onSearchChanged}
                                borderColor={(docContext && "course_name" in docContext && this.state.content!==docContext.course_name)?"blue.500":"gray.200"}/>
                      </Flex>
                      <Text flex="0" fontWeight='bold' mx='1rem'><Trans>labitemScreen.cap_search_by_department</Trans>&#58;&nbsp;</Text>
                      <Flex direction="row" alignItems="center" wrap="wrap" px={5} pt={2} pb={4}>
                        <Select flex="1" id="department_selector" variant="outline" value={department_id} onChange={onLabitemChanged} placeholder={t("labitemScreen.search_placeholder")}
                              borderColor={(labItem && "department_id" in labItem && department_id!==labItem.department_id)?"blue.500":"gray.200"}>
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
                      <Select id="search_result_selector" flex="1" isDisabled={isSearching} variant="outline" placeholder={t("labitemScreen.search_placeholder")} 
                      value={labitem_id} onChange={onConditionDepartmentChanged}>
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
                    labitem_id &&
                    <Flex direction="row" alignItems="center" wrap="wrap" px={5} py={2}>
                      {
                        this.edit_form.map((form, index) => (
                          <FormControl key={form.id} isRequired={form.isRequired} minW={form.minW} maxW={form.maxW} m={2}>
                            <FormLabel><b>{form.label}</b></FormLabel>
                            <Input id={form.id} type={form.id} value={this.state[form.id]} onChange={onFormChanged}
                              borderColor={(labItem && form.id in labItem && this.state[form.id]!==labItem[form.id])?"blue.500":"gray.200"}/>
                          </FormControl>
                        ))
                      }
                      {
                      departments &&
                      <FormControl key="department_id" isRequired minW={280} m={2}>
                        <FormLabel><b><Trans>progressdocScreen.form_label_departmentid</Trans></b></FormLabel>
                        <Select id="department_id" variant="outline" value={department_id} onChange={onFormChanged}
                          borderColor={(labItem && "department_id" in labItem && department_id!==labItem.department_id)?"blue.500":"gray.200"}>
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
              { isSaveable && 
                <Button variantColor="red" mr={3}>{t("common.save")}</Button>
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
    labItem: getLabitemContent(state),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    ...bindActionCreators(progressdocActions, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(LabitemDialog));