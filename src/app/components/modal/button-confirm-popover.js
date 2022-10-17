import React, { PureComponent } from 'react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  PopoverArrow,
  PopoverCloseButton,
  Button,
  ButtonGroup,
} from "@chakra-ui/core";

class ButtonConfirmPopover extends PureComponent {
  constructor(props) {
    super(props);
    this.initialFocusRef = React.createRef();
  }

  static defaultProps = {
    popBgColor: "blue.800",
    popTextColor: "white",
    cancelColor: "green",
  }

  render() {
    const { t, variantColor, btnTitle, popTitle, popText, popBgColor, popTextColor, onConfirm, cancelColor, ...other_props } = this.props;
    return (
      <Popover
        initialFocusRef={this.initialFocusRef}
        placement="bottom"
        //closeOnBlur={false}
      >
        {({ isOpen, onClose }) => (
        <>
        <PopoverTrigger>
          <Button variantColor={variantColor} {...other_props}>{btnTitle}</Button>
        </PopoverTrigger>
        <PopoverContent
          zIndex={4}
          color={popTextColor}
          bg={popBgColor}
          borderColor={popBgColor}
        >
          <PopoverHeader pt={4} fontWeight="bold" border="0">
            {popTitle?popTitle:t("common.pls_confirm")}
          </PopoverHeader>
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverBody>
            {popText?popText:""}
          </PopoverBody>
          <PopoverFooter
            border="0"
            d="flex" justifyContent="flex-end"
            pb={5}
          >
            <ButtonGroup size="sm" spacing='6'>
              <Button variantColor={cancelColor} ref={this.initialFocusRef} onClick={onClose}>{t("common.cancel")}</Button>
              <Button variantColor={variantColor} onClick={e=>{
                onClose(e);
                if (onConfirm) onConfirm();
                }}>{t("common.ok")}</Button>
            </ButtonGroup>
          </PopoverFooter>
        </PopoverContent>
        </>
        )}
      </Popover>
    );
  }
};

export default ButtonConfirmPopover;
