import React, { PureComponent } from 'react';
import { withTranslation } from 'react-i18next';
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
  Spinner,
} from "@chakra-ui/core";

class CommonModalWrapped extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      navItemIndex: 0,
    }
  }

  show = (curItemIndex = 0) => {
    this.setState({
      isOpen: true,
      navItemIndex: curItemIndex,
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

  onNavPrev = () => {
    const { navItemsInfo } = this.props;
    if (this.state.navItemIndex > 0) {
      const newIndex = this.state.navItemIndex-1;
      this.setState({
        navItemIndex: newIndex
      });
      if (navItemsInfo.onNavItemChange) {
        navItemsInfo.onNavItemChange(newIndex);
      }
    }
  }

  onNavNext = () => {
    const { navItemsInfo } = this.props;
    if (this.state.navItemIndex < navItemsInfo.maxCount - 1) {
      const newIndex = this.state.navItemIndex+1
      this.setState({
        navItemIndex: newIndex
      });
      if (navItemsInfo.onNavItemChange) {
        navItemsInfo.onNavItemChange(newIndex);
      }
    }
  }

  render() {
    const { isOpen, navItemIndex } = this.state;
    const { t, title, titleBgColor, loading, children, withCancel, disableCancel, disableOK,
      onResult, minWidth, navItemsInfo, okColor, ...other_props } = this.props;
    const { onNavPrev, onNavNext } = this;
    return (
      <Modal isCentered isOpen={isOpen} onClose={this.onClose} closeOnOverlayClick={false} {...other_props}>
        <ModalOverlay />
        <ModalContent minWidth={minWidth}>
          <ModalHeader display="flex" flexDirection="row" alignItems="center" backgroundColor={titleBgColor}>
            <Text width="100%" whiteSpace="nowrap">{title}</Text>
            {
              loading && <Flex mx="5"><Spinner /></Flex>
            }
            {
              navItemsInfo && navItemsInfo.onNavItemChange &&
              <Flex flexDirection="row" alignItems="center" marginRight="10">
                <Button disabled={navItemIndex <= 0} onClick={onNavPrev}>{navItemsInfo.prevCaption ? navItemsInfo.prevCaption : t("common.prev")}</Button>
                {
                  navItemsInfo.list &&
                  <Text ml="2" whiteSpace="nowrap">{navItemsInfo.list[navItemIndex].title}</Text>
                }
                {
                  navItemsInfo.titleTemplate &&
                  <Text ml="2" whiteSpace="nowrap">{t(navItemsInfo.titleTemplate, {index: navItemIndex+1})}</Text>
                }
                <Button ml="2" disabled={navItemIndex >= navItemsInfo.maxCount-1} onClick={onNavNext}>{navItemsInfo.nextCaption ? navItemsInfo.nextCaption : t("common.next")}</Button>
              </Flex>
            }
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody padding={3} display="flex" flexDirection="row" alignItems="center">
              <Flex width="100%" direction="column">
                { children }
                <Flex my="2" alignItems="center">
                  <Flex flex="1" />
                  { withCancel && <Button disabled={disableCancel} onClick={this.onCancelBtnClicked} mr="5" variantColor="gray" width="100px" height="44px">{t("common.cancel")}</Button> }
                  <Button disabled={disableOK} onClick={this.onOKBtnClicked} variantColor={(!okColor)?"green":okColor} width="100px" height="44px">{t("common.ok")}</Button>
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
