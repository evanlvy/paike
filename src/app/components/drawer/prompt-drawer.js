import React from 'react';
import {
    Drawer,
    DrawerBody,
    DrawerFooter,
    DrawerHeader,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    useDisclosure,
    Button,
    Text,
  } from "@chakra-ui/core"

  const PromptDrawer = props => {
    const { isOpen, onOpen, onClose } = useDisclosure()
    const btnRef = React.useRef()
    //const sizes = ["xs", "sm", "md", "lg", "xl", "full"]
    return (
      <>
        <Button ref={btnRef} colorScheme="teal" onClick={onOpen}>
          {props.btnText}
        </Button>
        <Drawer
          isOpen={isOpen}
          placement="right"
          onClose={onClose}
          finalFocusRef={btnRef}
          size={props.size?props.size:"sm"}
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>{props.title?props.title:props.t("common.help")}</DrawerHeader>
  
            <DrawerBody>
                <Text fontSize="lg">
                    <pre>{props.promptText}</pre>
                </Text>
            </DrawerBody>
  
            <DrawerFooter>
              <Button variant="outline" mr={3} onClick={onClose}>
              {props.t("common.back")}
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </>
    )
  }

export default PromptDrawer;