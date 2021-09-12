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
  import {
    MdHelp,
  } from 'react-icons/md';
  const PromptDrawer = props => {
    const { isOpen, onOpen, onClose } = useDisclosure()
    const btnRef = React.useRef()
    //const sizes = ["xs", "sm", "md", "lg", "xl", "full"]
    return (
      <>
        <Button ref={btnRef} leftIcon={MdHelp} variantColor="green" variant="solid" onClick={onOpen} mx={5}>
          {props.t("common.help")}
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
                <Text fontSize="lg" as='pre'>
                  {props.promptText /* Must use as='pre' for new line on /n */}
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