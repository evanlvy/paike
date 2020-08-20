import React, { PureComponent } from 'react';
import { Trans, withTranslation } from 'react-i18next';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
} from "@chakra-ui/core";

class CommonModalWrapped extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
    }
  }

  show = () => {
    this.setState({
      isOpen: true,
    })
  }

  dismiss = () => {
    this.setState({
      isOpen: false,
    })
  }

  onClose = () => {
    const { onResult } = this.props;
    if (onResult != null) {
      if (!onResult(false)) {
        return;
      }
    }
    this.dismiss();
  }

  onOKBtnClicked = () => {
    const { onResult } = this.props;
    if (onResult != null) {
      if (!onResult(true)) {
        return;
      }
    }
    this.dismiss();
  }

  render() {
    const { isOpen } = this.state;
    const { title, titleBgColor, children, ...other_props } = this.props;
    return (
      <Modal isOpen={isOpen} onClose={this.onClose} {...other_props}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader display="flex" flexDirection="row" alignItems="center" backgroundColor={titleBgColor}>
            <Text width="100%" whiteSpace="nowrap">{title}</Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody padding={3} display="flex" flexDirection="row" alignItems="center">
              { children }
              <Button onClick={this.onOKBtnClicked} variantColor="green" width="100px" height="44px" ml="3"><Trans>common.ok</Trans></Button>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }
}

const CommonModal = withTranslation("translation", {withRef: true})(CommonModalWrapped);
export { CommonModal };
