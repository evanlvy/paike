import React, { Component } from "react";
import {
    Flex,
    Select,
  } from '@chakra-ui/core';

class SelectorCelleditor extends Component {
  constructor(props) {
    super(props);
    let initialState =
      false //props.keyPress === KEY_BACKSPACE || props.keyPress === KEY_DELETE
        ? ""
        : props.value;
    this.state = { value: initialState };
  }

  afterGuiAttached() {
  }

  getValue() {
    return this.state.value;
  }


  handleChange = (event) => {
    this.setState({ value: event.target.value });
  };

  render() {
    const { values } = this.props;
    return (
    <Select color="gray.700" value={this.state.value} onChange={this.handleChange}>
    {
    values.map((val, index)=> (
        <option key={index}>{val}</option>
    ))
    }
    </Select>
    );
  }
}

export { SelectorCelleditor };