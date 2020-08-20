import React, { PureComponent } from 'react';
import {
  Select
} from "@chakra-ui/core";

import {
  CommonModal
} from './common-modal';

class SelectItemModal extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      value: ""
    }
    this.commonModalRef = React.createRef();
  }

  show = (initValue = 0) => {
    this.commonModalRef.current.show();
    this.setState({
      value: initValue
    });
  }

  onSelectChanged = (event) => {
    this.setState({
      value: event.target.value
    });
  }

  onResult = (confirm) => {
    const { onResult } = this.props;
    let result = null;
    if (confirm) {
      result = this.state.value;
    }
    if (onResult != null) {
      return onResult(confirm, result);
    }
    return true;
  }

  render() {
    const { value } = this.state;
    const { title, titleBgColor, choices } = this.props;
    return (
      <CommonModal
        ref={this.commonModalRef}
        title={title}
        titleBgColor={titleBgColor}
        onResult={this.onResult}>
          <Select value={value} onChange={this.onSelectChanged}>
            {
              choices.map((choice, index) => (
                <option key={index} value={index} >{choice.name}</option>
              ))
            }
          </Select>
      </CommonModal>
    );
  }
}
export { SelectItemModal };
