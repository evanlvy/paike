import React, { PureComponent } from 'react';
import {
  Input
} from "@chakra-ui/core";

import {
  CommonModal
} from './common-modal';

class EditItemModal extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      value: ""
    }
    this.commonModalRef = React.createRef();
  }

  show = (initValue = "") => {
    this.commonModalRef.current.show();
    this.setState({
      value: initValue
    });
  }

  onEditChanged = (event) => {
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
    const { title, titleBgColor, placeholder } = this.props;
    return (
      <CommonModal
        ref={this.commonModalRef}
        title={title}
        titleBgColor={titleBgColor}
        onResult={this.onResult}>
          <Input placeholder={placeholder} value={value} onChange={this.onEditChanged}/>
      </CommonModal>
    );
  }
}
export { EditItemModal };
