import React, { PureComponent } from 'react';
import { Trans, withTranslation } from 'react-i18next';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Flex,
  Button,
  Text,
  Select,
} from "@chakra-ui/core";

import { BallGrid } from '../common/ball-grid';

const DEFAULT_EMPTY_COLOR = "blue.500";
const DEFAULT_OCCUPIED_COLOR = "gray.500";
class ChooseItemModalWrapped extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      curCenterIndex: 0,
      selectedItemIndex: -1,
    }
  }

  componentDidMount() {
    this.initUI();
  }

  initUI = () => {
    const { initCenterIndex = 0 } = this.props;

    this.setState({
      curCenterIndex: initCenterIndex,
    });
  }

  buildItemsData = () => {
    const { items } = this.props;
    let { occupiedColor = DEFAULT_OCCUPIED_COLOR, occupiedSuffix = "", emptyColor = DEFAULT_EMPTY_COLOR } = this.props;
    let itemsData = [];
    for (let i=0; i < items.length; i++) {
      let item = items[i];
      let title = item.title;
      let color = emptyColor
      if (item.occupied != null) {
        title += item.occupied+occupiedSuffix;
        color = occupiedColor;
      }
      itemsData[i] = {title: title, color: color};
    }
    //console.log("Items: "+JSON.stringify(itemsData));
    return itemsData;
  }

  show = (selectedIndex = -1) => {
    this.setState({
      isOpen: true,
      selectedItemIndex: selectedIndex,
    })
  }

  dismiss = () => {
    this.setState({
      isOpen: false,
    })
  }

  onItemSelected = (index) => {
    const { onItemSelect: onItemSelectCb } = this.props;
    const { items } = this.props;
    console.log("onItemSelected: "+JSON.stringify(items[index]));
    this.setState({
      selectedItemIndex: index
    });
    if (onItemSelectCb) {
      onItemSelectCb(index);
    }
  }

  onSelectedCenterChanged = (event) => {
    this.setState({
      curCenterIndex: event.target.value,
      selectedItemIndex: -1,
    });
    const { onCenterChanged } = this.props;
    if (onCenterChanged != null) {
      onCenterChanged(event.target.value);
    }
  }

  onCancelBtnClicked = () => {
    const { onResult } = this.props;
    if (onResult != null) {
      if (!onResult(false, -1)) {
        return;
      }
    }
    this.dismiss();
  }

  onOKBtnClicked = () => {
    const { selectedItemIndex } = this.state;
    const { onResult } = this.props;
    if (onResult != null) {
      if (!onResult(true, selectedItemIndex)) {
        return;
      }
    }
    this.dismiss();
  }

  render() {
    const { isOpen, curCenterIndex, selectedItemIndex } = this.state;
    const { t, title, items, centers, checkIconColor, withOK = true, withCancel = false, ...other_props } = this.props;
    const itemsData = this.buildItemsData(items);
    return (
      <Modal isOpen={isOpen} onClose={this.onCancelBtnClicked} {...other_props}>
        <ModalOverlay />
        <ModalContent minWidth={1024}>
          <ModalHeader display="flex" flexDirection="row" alignItems="center" backgroundColor="blue.500">
            <Text width="100%" whiteSpace="nowrap">{title}</Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody padding={0}>
            <BallGrid
              maxHeight={280}
              colCount={6}
              ballSize={100}
              balls={itemsData}
              checkIconColor={checkIconColor}
              selectedBallIndexList={[selectedItemIndex]}
              onBallClicked={this.onItemSelected} />
            {
              (withOK || withCancel || centers != null) &&
              <Flex margin="2" padding="3" alignItems="center" borderTop="solid 1px" borderTopColor="gray.200">
                <Flex flex="1">
                {
                  centers != null &&
                  <Select width="30%" value={curCenterIndex} onChange={this.onSelectedCenterChanged}>
                    {
                      centers.map((center, index) => (
                        <option key={index} value={index} >{center.name}</option>
                      ))
                    }
                  </Select>
                }
                </Flex>
                {withCancel && <Button onClick={this.onCancelBtnClicked} mr="5" variantColor="gray" width="100px" height="44px"><Trans>common.cancel</Trans></Button>}
                {withOK && <Button onClick={this.onOKBtnClicked} variantColor="green" width="100px" height="44px" disabled={selectedItemIndex < 0}><Trans>common.ok</Trans></Button>}
              </Flex>
            }
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }
}

const ChooseItemModal = withTranslation("translation", {withRef: true})(ChooseItemModalWrapped);
export { ChooseItemModal };
