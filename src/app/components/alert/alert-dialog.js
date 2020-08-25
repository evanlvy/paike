import React, { PureComponent } from 'react';
import { withTranslation } from 'react-i18next';

import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
} from "@chakra-ui/core";

const POSITIVE_BTN_DEFAULT_COLOR = "blue";
class AlertWrapper extends PureComponent {
  constructor(props) {
    super(props);
    const { t } = props;
    this.state = {
      isOpen: false,
      title: t("alert.default_title"),
      message: ""
    }
    this.cancelRef = React.createRef();
  }

  show = (title, message) => {
    this.setState({
      isOpen: true,
      title: title,
      message: message
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

  onConfirm = () => {
    const { onResult } = this.props;
    if (onResult != null) {
      if (!onResult(true)) {
        return;
      }
    }
    this.dismiss();
  }

  render() {
    const { cancelRef, onClose, onConfirm } = this;
    const { isOpen, title, message } = this.state;
    const { t, titleBgColor, negativeBtnCaption } = this.props;
    let { positiveBtnCaption, positiveBtnColor } = this.props;
    if (positiveBtnColor == null) {
      positiveBtnColor = POSITIVE_BTN_DEFAULT_COLOR;
    }
    if (positiveBtnCaption == null) {
      positiveBtnCaption = t("alert.default_positive_btn_caption");
    }
    return (
      <AlertDialog isOpen={isOpen}
        isCentered
        leastDestructiveRef={cancelRef}
        onClose={onClose} >
        <AlertDialogOverlay />
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold" backgroundColor={titleBgColor}>
              {title}
            </AlertDialogHeader>
            <AlertDialogBody>
              {message}
            </AlertDialogBody>
            <AlertDialogFooter>
              {
                negativeBtnCaption != null &&
                <Button ref={cancelRef} onClick={onClose}>
                  {negativeBtnCaption}
                </Button>
              }
              <Button variantColor={positiveBtnColor} onClick={onConfirm} ml={3}>
                {positiveBtnCaption}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    );
  }
}

const Alert = withTranslation("translation", {withRef: true})(AlertWrapper);
export { Alert };
