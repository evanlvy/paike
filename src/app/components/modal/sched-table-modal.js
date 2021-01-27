import React, { PureComponent } from 'react';
import { withTranslation } from 'react-i18next';

import { EditableTable } from '../result-table/editable-table';
import { CommonModal } from './common-modal';

class SchedTableModalWrapped extends PureComponent {
  constructor(props) {
    super(props);
    const { t } = props;

    this.state = {
      selItem: { row: -1, col: -1 },
      secSelItem: { row: -1, col: -1 }
    }

    this.cellClassRules = {
      'disabled-cell': (params) => {
        return params.value.disabled;
      },
      'selected-cell': (params) => {
        return params.value.highlight;
      }
    };

    this.tableHeaders = [
      {name: t("kebiao.sched_title"), field: "sched_name"},
      {name: t("kebiao.sched_monday"), field: "monday"},
      {name: t("kebiao.sched_tuesday"), field: "tuesday"},
      {name: t("kebiao.sched_wednesday"), field: "wednesday"},
      {name: t("kebiao.sched_thursday"), field: "thursday"},
      {name: t("kebiao.sched_friday"), field: "friday"},
      {name: t("kebiao.sched_saturday"), field: "saturday"},
      {name: t("kebiao.sched_sunday"), field: "sunday"},
    ];

    this.commonModalRef = React.createRef();
  }

  show = (initWeekIndex = 0) => {
    this.resetSelection();
    this.commonModalRef.current.show(initWeekIndex);
  }

  resetSelection = () => {
    this.setState({
      selItem: { row: -1, col: -1 },
      secSelItem: { row: -1, col: -1 }
    });
  }

  buildData = () => {
    const { multiSelect, singleSelect } = this.props;
    if (multiSelect) {
      this.rowData = this.buildMultiSelectData();
    } else if (singleSelect) {
      this.rowData = this.buildSingleSelectData();
    } else {
      this.rowData = this.props.tableData;
      this.enableOK = true;
    }
    //console.log("SchedTable, buildData "+JSON.stringify(this.rowData));
  }

  buildSingleSelectData = () => {
    const { tableHeaders } = this;
    const { tableData } = this.props;
    const { selItem } = this.state;
    let rowData = [];
    for (let i=0; i < tableData.length; i++) {
      rowData[i] = tableData[i];
      for (let j=1; j < tableHeaders.length; j++) {
        rowData[i][tableHeaders[j].field].highlight = (selItem.row === i && selItem.col === j);
      }
    }
    this.enableOK = selItem.row >= 0 && selItem.col >= 0;
    return rowData;
  }

  buildMultiSelectData = () => {
    const { tableHeaders } = this;
    const { tableData, multiSelectRange = 1 } = this.props;
    const { selItem, secSelItem } = this.state;
    let enableRowStart = 0, enableRowEnd = tableData.length;
    let enableColStart = 0, enableColEnd = tableHeaders.length;
    let highlightCol = -1, highlightRowStart = -1, highlightRowEnd = -1;
    if (selItem.col > 0 && selItem.row >= 0) {
      enableRowStart = selItem.row;
      enableRowEnd = selItem.row+multiSelectRange;
      enableColStart = selItem.col;
      enableColEnd = selItem.col+1;
      highlightCol = selItem.col;
      highlightRowStart = selItem.row;
      highlightRowEnd = selItem.row+1;
    }
    if (secSelItem.col > 0 && secSelItem.row >= 0) {
      highlightRowEnd = secSelItem.row+1;
    }

    let rowData = [];
    for (let i=0; i < tableData.length; i++) {
      rowData[i] = tableData[i];
      for (let j=1; j < tableHeaders.length; j++) {
        rowData[i][tableHeaders[j].field].disabled = (i < enableRowStart || i >= enableRowEnd || j < enableColStart || j >= enableColEnd);
        rowData[i][tableHeaders[j].field].highlight = (i >= highlightRowStart && i < highlightRowEnd && j === highlightCol);
      }
    }
    this.enableOK = selItem.row >= 0 && selItem.col >= 0 && ((secSelItem.row >= 0 && secSelItem.col >= 0) || multiSelectRange === 1);
    return rowData;
  }

  onResult = (confirm) => {
    const { onResult } = this.props;
    let result = null;
    if (confirm) {
      const { selItem, secSelItem } = this.state;
      if (selItem.row >= 0 && selItem.col > 0) {
        result = { hour_index: selItem.row, weekday_index: selItem.col-1, range: 1 };
        if (secSelItem.row >=0 && secSelItem.col > 0) {
          result.range = secSelItem.row - selItem.row + 1;
        }
      }
    }
    if (onResult != null) {
      return onResult(confirm, result);
    }
    return true;
  }

  onCellClicked = (e) => {
    const { multiSelect, singleSelect } = this.props;
    if (multiSelect) {
      this.onMultiCellClicked(e);
    } else if (singleSelect) {
      this.onSingleCellClicked(e);
    }

    const { onCellClicked : onCellClickedCb } = this.props;
    if (onCellClickedCb) {
      onCellClickedCb(e);
    }
  }

  onSingleCellClicked = (e) => {
    console.log(`onSingleCellClicked, (${e.row}, ${e.col})`);
    this.setState({
      selItem: {row: e.row, col: e.col}
    });
  }

  onMultiCellClicked = (e) => {
    const { selItem, secSelItem } = this.state;
    let { multiSelectRange = 1 } = this.props;
    if (multiSelectRange === 2 && selItem.row === 1) {
      multiSelectRange = 1;
    } else if (multiSelectRange >= 3) {
      if (selItem.row < 2) {
        multiSelectRange = 2-selItem.row;
      } else {
        multiSelectRange = 3-selItem.row;
      }
    }
    if (selItem.col < 0 || selItem.row < 0
    || (secSelItem.col > 0 && secSelItem.row >= 0)
    || e.col !== selItem.col || (e.row < selItem.row
    || e.row > selItem.row+multiSelectRange-1)) {
      this.setState({
        selItem: {row: e.row, col: e.col},
        secSelItem: {row: -1, col: -1}
      });
    } else {
      this.setState({
        secSelItem: {row: e.row, col: e.col}
      });
    }
  }

  render() {
    const { title, titleBgColor, tableData, withCancel, onResult, ...other_props } = this.props;
    this.buildData();
    const { tableHeaders, rowData, cellClassRules, enableOK, onCellClicked } = this;
    return (
      <CommonModal
        ref={this.commonModalRef}
        title={title}
        titleBgColor={titleBgColor}
        withCancel={withCancel}
        disableOK={!enableOK}
        onResult={this.onResult}
        { ...other_props }>
        <EditableTable
          width="100%"
          height={450}
          colLineHeight={20}
          defaultColWidth={110}
          cellClassRules={cellClassRules}
          headers={tableHeaders}
          data={rowData}
          onCellClicked={onCellClicked}/>
      </CommonModal>
    );
  }
}

const SchedTableModal = withTranslation("translation", {withRef: true})(SchedTableModalWrapped);
export { SchedTableModal };
