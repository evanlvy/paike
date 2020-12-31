import React, { PureComponent } from 'react';
import { Trans, withTranslation } from 'react-i18next';
import {
  Flex,
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

  onCancelBtnClicked = () => {
    this.onClose();
  }

  render() {
    const { isOpen } = this.state;
    const { title, titleBgColor, children, withCancel, onResult, minWidth, ...other_props } = this.props;
    return (
      <Modal isOpen={isOpen} onClose={this.onClose} closeOnOverlayClick={false} {...other_props}>
        <ModalOverlay />
        <ModalContent minWidth={minWidth}>
          <ModalHeader display="flex" flexDirection="row" alignItems="center" backgroundColor={titleBgColor}>
            <Text width="100%" whiteSpace="nowrap">{title}</Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody padding={3} display="flex" flexDirection="row" alignItems="center">
              <Flex width="100%" direction="column">
                { children }
                <Flex my="2" alignItems="center">
                  <Flex flex="1" />
                  { withCancel && <Button onClick={this.onCancelBtnClicked} mr="5" variantColor="gray" width="100px" height="44px"><Trans>common.cancel</Trans></Button> }
                  <Button onClick={this.onOKBtnClicked} variantColor="green" width="100px" height="44px"><Trans>common.ok</Trans></Button>
                </Flex>
              </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }
}

const CommonModal = withTranslation("translation", {withRef: true})(CommonModalWrapped);
export { CommonModal };
