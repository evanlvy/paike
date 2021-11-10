import React, { Component } from "react";
import {
    Flex,
    Select,
  } from '@chakra-ui/core';

class SelectorCelleditor extends Component {
  constructor(props) {
    super(props);
    let initialState = props.value;
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
    const { values, column } = this.props;
    const { actualWidth } = column;
    return (
      <Select w={actualWidth} color="gray.700" value={this.state.value} onChange={this.handleChange}>
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