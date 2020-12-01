/* @flow */

import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import {
  Flex,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton
} from '@chakra-ui/core';
import {
  Formik,
  Field
} from 'formik';
import { Trans, withTranslation } from 'react-i18next';

import { actions as authActions, getLoggedUser, getLoggedError } from '../redux/modules/auth';

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

  shouldComponentUpdate(nextProps, nextState) {
    const { user, error } = this.props;
    const { showError } = this.state;

    if (nextProps.user !== user || nextProps.error !== error) {
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
    if (user && user.token) {
      this.props.logout();
    }
    this.props.login(values.name, values.password);
    this.isNewRequest = true;
    this.dismissAlert();
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

  dismissAlert = () => {
    this.setState({
      showError: false
    });
  }

  render() {
    const { from } = this.props.location.state || { from: { pathname: "/"}};
    this.checkNeedRedirect();
    if (this.redirectToReferer) {
      console.log("redirect to "+from.pathname);
      return <Redirect to={from.pathname} />;
    }
    const { t, error } = this.props;
    const { showError } = this.state;
    return (
      <Flex direction="column" bg="green.50" height="100vh" align="center" justify="center">
        {
          showError &&
          <Alert status="error" >
            <AlertIcon />
            <AlertTitle mr={2}>{t("loginScreen.auth_failure")}</AlertTitle>
            <AlertDescription>{t("loginScreen.error_code_template", {error_code: error.errorCode})}</AlertDescription>
            <CloseButton onClick={this.dismissAlert}/>
          </Alert>
        }
        <Formik initialValues={{name: '', password: ''}}
          onSubmit={this.onLogin}>
          {(props) => (
            <form onSubmit={props.handleSubmit}>
              <Field name="name" validate={this.validateName}>
                {({field, form}) => (
                  <FormControl isInvalid={form.errors.name && form.touched.name}>
                    <FormLabel htmlFor="name"><Trans>loginScreen.username</Trans></FormLabel>
                    <Input width="30em" type="text" {...field} id="name" placeholder={t("loginScreen.username_placeholder")} />
                    <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
              <Field name="password" validate={this.validatePassword}>
                {({field, form}) => (
                  <FormControl isInvalid={form.errors.password && form.touched.password}>
                    <FormLabel htmlFor="password"><Trans>loginScreen.password</Trans></FormLabel>
                    <Input width="100%" type="password" {...field} id="password" placeholder={t("loginScreen.password_placeholder")} />
                    <FormErrorMessage>{form.errors.password}</FormErrorMessage>
                  </FormControl>
                )}
              </Field>
              <Button mt={4} width="100%"
                 type="submit" variantColor="blue"
                 isLoading={props.isSubmitting}>
                 <Trans>loginScreen.signin</Trans>
              </Button>
            </form>
          )}
        </Formik>
      </Flex>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    user: getLoggedUser(state),
    error: getLoggedError(state)
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    ...bindActionCreators(authActions, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(WrappedLoginScreen));
