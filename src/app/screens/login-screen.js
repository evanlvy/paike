/* @flow */

import React, { Component, Redirect } from 'react';
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

import { setCurUser } from '../models/user';

class WrappedLoginScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      redirectToReferer: false,
    };
  }

  onLogin = (values, actions) => {
    setCurUser(values.name);
    setTimeout(() => {
      actions.setSubmitting(false);
      const { history } = this.props;
      history.replace("/");
    }, 1000);
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
      return <Redirect to={from} />;
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

const LoginScreen = withTranslation()(WrappedLoginScreen);

export { LoginScreen };
