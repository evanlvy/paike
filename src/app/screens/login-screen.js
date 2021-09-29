/* @flow */

import React, { Component, useEffect } from 'react';
import { Redirect } from 'react-router-dom';
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import {
  Flex,
  Heading,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Button,
  Tabs, TabList, TabPanels, Tab, TabPanel,
  useToast,
} from '@chakra-ui/core';
import {
  Formik,
  Field
} from 'formik';
import { Trans, withTranslation } from 'react-i18next';

import { actions as authActions, getLoggedUser, getLoggedError, getAccessLevel, getStudentInfo } from '../redux/modules/auth';
import PropTypes from 'prop-types';

function Toast(props) {
  const toast = useToast();
  useEffect(() => {
    toast(props.params);
  }, []); // Passing in empty array so this will only get called on mount
  return null;
}

class WrappedLoginScreen extends Component {
  constructor(props) {
    super(props);
    this.oldToken = props.user.token;
    this.redirectToReferer = false;
    this.isNewRequest = false;
    this.state = {
      showError: false
    }
  }

  static contextTypes = {
    router: PropTypes.object.isRequired,
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { user, error, stuInfo } = this.props;
    const { showError } = this.state;

    if (nextProps.user !== user || nextProps.stuInfo !== stuInfo || nextProps.error !== error) {
      console.log("shouldComponentUpdate, props diff");
      return true;
    } else if (nextState.showError !== showError) {
      console.log("shouldComponentUpdate, state diff");
      return true;
    }
    return false;
  }

  componentDidUpdate() {
    console.log("componentDidUpdate");
    if (!this.redirectToReferer) {
      this.checkError();
      if (this.setSubmittingCb) {
        this.setSubmittingCb(false);
      }
    }
  }

  checkNeedRedirect = () => {
    const { user } = this.props;
    if (user.token && user.token !== this.oldToken) {
      this.oldToken = user.token;
      this.redirectToReferer = true;
    }
  }

  checkError = () => {
    const { error } = this.props;
    if (error.errorCode && this.isNewRequest && !this.state.showError) {
      console.log("checkError, error: "+error.message);
      this.setState({
        showError: true
      });
      this.isNewRequest = false;
    }
  }

  onLogin = (values, {setSubmitting}) => {
    const { user } = this.props;
    this.dismissAlert();
    if (user && user.token) {
      this.props.logout();
    }
    this.props.login(values.name, values.password);
    this.isNewRequest = true;
    this.setSubmittingCb = setSubmitting;
  }

  onStuLogin = (values, {setSubmitting}) => {
    const { user } = this.props;
    this.dismissAlert();
    if (user && user.token) {
      this.props.logout();
    }
    this.props.studentLogin(values.stunum);
    this.isNewRequest = true;
    this.setSubmittingCb = setSubmitting;
  }

  validateName = (value) => {
    const { t } = this.props;
    let error;
    if (!value) {
      error = t("loginScreen.username_error_empty");
    }
    return error;
  }

  validatePassword = (value) => {
    const { t } = this.props;
    let error;
    if (!value) {
      error = t("loginScreen.password_error_empty");
    }
    return error;
  }

  validateStunum = (value) => {
    const { t } = this.props;
    let error;
    let num = value;
    if (typeof num === "number") {
      num = num.toString();
    }
    if (typeof num === "string" && num.length < 8 && num.length > 0) {
      error = t("loginScreen.stunum_error_invalid");
    }
    return error;
  }

  dismissAlert = () => {
    this.setState({
      showError: false
    });
  }

  render() {
    const { from } = this.props.location.state || { from: { pathname: "/"}};
    this.checkNeedRedirect();
    if (this.redirectToReferer) {
      const { accessLevel, user, stuInfo } = this.props;
      let menu_params = {};
      if (accessLevel === "PROFESSOR") {
        menu_params =  {jys: {id: user.departmentId, name: user.departmentName}, teacherId: user.id};
        return <Redirect to={{
          pathname: '/jys',
          state: menu_params
        }}/>
      } else if (accessLevel === "STUDENT" && stuInfo) {
        menu_params =  {
          edu: {id: stuInfo.degree_id, name: stuInfo.degree_name}, 
          grd: {id: stuInfo.grade_id, name: stuInfo.grade_name},
          major: {id: stuInfo.major_id, name: stuInfo.major_name},
          clas: {idx: stuInfo.class_seq}
        };
        return <Redirect to={{
          pathname: '/kebiao/banji',
          state: menu_params
        }}/>
      }
      console.log("redirect to "+from.pathname);
      return <Redirect to={from.pathname} />;
    }
    const { t, error } = this.props;
    const { showError } = this.state;
    return (
      <Flex color="white" direction="column" bg="white" height="100vh" align="center" alignItems="center" justify="center">
        {
          showError &&
          <Toast params={{
            title: t("loginScreen.auth_failure"),
            description: t("loginScreen.error_code_template", {error_code: error.message}),
            status: "error",
            duration: 3000,
            isClosable: true,
          }}>
          </Toast>
        }
        <Flex direction="column" bg="gray.800" p={12} rounded={6}>
          <Heading mb={6}><Trans>loginScreen.title</Trans></Heading>
          <Tabs isFitted >
          <TabList mb="1em">
            <Tab><Trans>loginScreen.teacher</Trans></Tab>
            <Tab><Trans>loginScreen.student</Trans></Tab>
          </TabList>
          <TabPanels>
          <TabPanel>
          <Formik initialValues={{name: '', password: ''}}
            onSubmit={this.onLogin}>
            {(props) => (
              <form onSubmit={props.handleSubmit}>
                <Field name="name" validate={this.validateName}>
                  {({field, form}) => (
                    <FormControl isInvalid={form.errors.name && form.touched.name}>
                      <FormLabel mt={6} htmlFor="name"><Trans>loginScreen.username</Trans></FormLabel>
                      <Input variant="filled" type="text" {...field} id="name" placeholder={t("loginScreen.username_placeholder")} />
                      <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
                <Field name="password" validate={this.validatePassword}>
                  {({field, form}) => (
                    <FormControl isInvalid={form.errors.password && form.touched.password}>
                      <FormLabel mt={2} htmlFor="password"><Trans>loginScreen.password</Trans></FormLabel>
                      <Input variant="filled" type="password" {...field} id="password" placeholder={t("loginScreen.password_placeholder")} />
                      <FormErrorMessage>{form.errors.password}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
                <Button mt={6} width="100%" colorScheme="teal"
                  type="submit" variantColor="blue"
                  isLoading={props.isSubmitting}>
                  <Trans>loginScreen.signin</Trans>
                </Button>
              </form>
            )}
          </Formik>
          </TabPanel>
          <TabPanel>
          <Formik initialValues={{stunum: ''}}
            onSubmit={this.onStuLogin}>
            {(props) => (
              <form onSubmit={props.handleSubmit}>
                <Field name="stunum" validate={this.validateStunum}>
                  {({field, form}) => (
                    <FormControl isInvalid={form.touched.stunum && form.errors.stunum}>
                      <FormLabel htmlFor="stunum"><Trans>loginScreen.stunum</Trans></FormLabel>
                      <Input mb={4} variant="filled" type="number" {...field} id="stunum" placeholder={t("loginScreen.stunum_placeholder")} />
                      <FormErrorMessage>{form.errors.stunum}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
                <Button mt={6} width="100%" colorScheme="teal"
                  type="submit" variantColor="blue"
                  isLoading={props.isSubmitting}>
                  <Trans>loginScreen.signin</Trans>
                </Button>
              </form>
            )}  
          </Formik>
          </TabPanel>
          </TabPanels>
          </Tabs>
        </Flex>
      </Flex>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    user: getLoggedUser(state),
    error: getLoggedError(state),
    accessLevel: getAccessLevel(state),
    stuInfo: getStudentInfo(state),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    ...bindActionCreators(authActions, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(WrappedLoginScreen));
