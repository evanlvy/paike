import React, { PureComponent } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Text,
} from "@chakra-ui/core";

import DatePicker from "react-datepicker";
import { registerLocale } from  "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import zh from 'date-fns/locale/zh-cn';

registerLocale('zh-cn', zh)

class DatePickerModal extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      selectDate: new Date()
    };
  }

  show = (initDate) => {
    this.setState({
      isOpen: true,
      selectDate: initDate
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
      if (!onResult(null)) {
        return;
      }
    }
    this.dismiss();
  }

  onDateChanged = (newDate) => {
    const { onResult } = this.props;
    if (onResult != null) {
      if (!onResult(newDate)) {
        return;
      }
    }
    this.dismiss();
  }

  render() {
    const now = new Date();
    const { isOpen, selectDate } = this.state;
    const { title, titleBgColor, children, ...other_props } = this.props;
    return (
      <Modal isOpen={isOpen} onClose={this.onClose} {...other_props}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader display="flex" flexDirection="row" alignItems="center" backgroundColor={titleBgColor}>
            <Text width="100%" whiteSpace="nowrap">{title}</Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody padding={3} display="flex" flexDirection="column" alignItems="center">
            <DatePicker
              locale="zh-cn"
              selected={selectDate}
              minDate={now}
              onChange={this.onDateChanged}
              showDisabledMonthNavigation
              inline />
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }
}

export { DatePickerModal };
