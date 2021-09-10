import React from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Button,
    Text,
  } from "@chakra-ui/core"
  
  import { EditableTable } from '../result-table/editable-table';

  const TableDialog = props => {
    const { isOpen, onOpen, onClose } = useDisclosure()
    const { t, title, color, btnText, isSaveable, tableTitle, tableHeaders, tableRows, tablePages, onPageChanged, onCellClicked, onCellValueChanged } = props;
    const btnRef = React.useRef()

    return (
      <>
        <Button mt={3} ref={btnRef} onClick={onOpen}>
          {btnText}
        </Button>
  
        <Modal
          onClose={onClose}
          finalFocusRef={btnRef}
          isOpen={isOpen}
          scrollBehavior="outside"
          closeOnOverlayClick={false}
        >
          <ModalOverlay />
          <ModalContent maxW="100rem">
            <ModalHeader>{title}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
            {
              tableRows &&
              <EditableTable 
                flex={1}
                minHeight={950}
                titleHeight={50}
                colLineHeight={15}
                defaultColWidth={180}
                title={tableTitle}
                color={color}
                headers={tableHeaders}
                data={tableRows}
                pageNames={tablePages}
                pagePrevCaption={t("common.previous")}
                pageNextCaption={t("common.next")}
                onResultPageIndexChanged={onPageChanged}
                initPageIndex={0}
                onCellValueChanged={onCellValueChanged}
                onCellClicked={onCellClicked}
                //pageInputCaption={[t("kebiao.input_semester_week_prefix"), t("kebiao.input_semester_week_suffix")]}
                />
            }
            </ModalBody>
            <ModalFooter>
              { isSaveable && 
                <Button variantColor="red" mr={3}>{t("common.save")}</Button>
              }
              <Button onClick={onClose}>{t("common.close")}</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    )
  }

export default TableDialog;