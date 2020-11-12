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
} from '@chakra-ui/core';
import {
  Formik,
  Field
} from 'formik';
import { Trans, withTranslation } from 'react-i18next';

import { actions as authActions, getLoggedUser } from '../redux/modules/auth';

class WrappedLoginScreen extends Component {
  constructor(props) {
    super(props);
    this.oldToken = props.user.get("userToken");
    this.state = {
      redirectToReferer: false,
    };
  }

  componentDidUpdate() {
    const token = this.props.user.get("userToken");
    const isLoggedIn = token != null;
    console.log("componentDidUpdate, isLoggedIn: "+isLoggedIn);
    if (isLoggedIn && token !== this.oldToken) {
      this.oldToken = token;
      this.setState({
        redirectToReferer: true
      });
    }
  }

  onLogin = (values) => {
    const { user } = this.props;
    if (user && user.userToken) {
      this.props.logout();
    }
    this.props.login(values.name, values.password);
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

  render() {
    const { t } = this.props;
    const { from } = this.props.location.state || { from: { pathname: "/"}};
    const { redirectToReferer } = this.state;
    if (redirectToReferer) {
      console.log("redirect to "+from.pathname);
      return <Redirect to={from.pathname} />;
    }
    return (
      <Flex bg="green.50" height="100vh" align="center" justify="center">
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
    user: getLoggedUser(state)
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    ...bindActionCreators(authActions, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(WrappedLoginScreen));
