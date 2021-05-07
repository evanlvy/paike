import React, { PureComponent } from 'react';
import {
  Flex,
  Box,
  Icon,
  Text,
  Button,
  Collapse,
} from '@chakra-ui/core'
import { withTranslation } from 'react-i18next';

import { ResultTable } from '../result-table/result-table';

class CollapseBoardWrapped extends PureComponent {
  constructor(props) {
    super (props);
    this.state = {
      showTable: false,
    };
  }

  onToggleCollapse = () => {
    const oldShowTable = this.state.showTable;
    this.setState({
      showTable: !oldShowTable
    });
  }

  render() {
    const { onToggleCollapse } = this;
    const { t, color, titleIcon, title, emptyMessage,
      tableTitle, tableHeaders, tableData,
      pageNames, pagePrevCaption, pageNextCaption,
      initPageIndex, pageInputCaption, onResultPageIndexChanged,
      ...other_props } = this.props;
    const { showTable } = this.state;
    return (
      <Box borderWidth={1} borderColor={color+".200"} borderRadius="md" overflowY="hidden" {...other_props}>
        <Flex direction="row" alignItems="center" px={5} py={2}>
          <Icon as={titleIcon} color={color+".200"} size={16} />
          <Text width="100%" mx={5} whiteSpace="break-spaces">{!title || title.length === 0 ? emptyMessage : title}</Text>
          <Button variantColor={color} onClick={onToggleCollapse}>{showTable ? t("common.collapse") : t("common.expand")}</Button>
        </Flex>
        <Collapse mt={4} isOpen={showTable}>
          <ResultTable
            height={450}
            titleHeight={50}
            colLineHeight={20}
            defaultColWidth={150}
            title={tableTitle}
            color={color}
            headers={tableHeaders}
            data={tableData}
            pageNames={pageNames}
            pagePrevCaption={pagePrevCaption}
            pageNextCaption={pageNextCaption}
            onResultPageIndexChanged={onResultPageIndexChanged}
            initPageIndex={initPageIndex}
            pageInputCaption={pageInputCaption} />
        </Collapse>
      </Box>
    );
  }
}

const CollapseBoard = withTranslation()(CollapseBoardWrapped);

export { CollapseBoard };
