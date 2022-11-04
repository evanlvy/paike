
import { isImmutable } from 'immutable';
import { slotsTranslation } from "../../redux/modules/rawplan";

export class CellConverters {

  static getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
            return;
        }
        seen.add(value);
      }
      return value; 
    };
  };

  static numbersOnlyValueSetter = params => {
    let newValue = params.newValue;
    if (typeof newValue === 'number') {
      params.data[params.column.colId] = newValue.toString(10);
      return true;
    }
    if (typeof newValue !== 'string') return false;

    // Remove any non-numberic charactors
    params.data[params.column.colId] = newValue.replace(/[^0-9]/ig, "");
    return true;
  };

  //Cell Edit Ref https://www.ag-grid.com/javascript-grid/cell-editing/?
  static courseTeacherGetter = (params) => {
    //console.log("courseTeacherGetter: params:"+params.value+" column:"+JSON.stringify(params.colDef, this.getCircularReplacer()));
    let value = params.data[params.colDef.field];
    //console.log("courseTeacherGetter: value:"+JSON.stringify(value));
    if (!value) {
      return this.zixi;
    }
    let cname = value.course;
    /*if (value.cid <= 0){
      cname = (value.cid < 0?"\u274C":"\u2753")+cname;
    }*/
    let tname = value.teacher;
    /*if (value.tid <= 0){
      tname = (value.tid < 0?"\u274C":"\u2753")+tname;
    }*/
    let output = "\u3010" + cname + "\u3011 " + tname;
    //console.log("courseTeacherGetter: "+output);
    return output;
  };

  static courseTeacherSetter = (params) => {
    let dest_col = params.colDef.field;
    if (!params.newValue || params.newValue.length < 1) {
      delete params.data[dest_col];
      return true;
    }
    let old_string = "";
    if (params.oldValue && params.oldValue.length > 0) {
      //old_string = params.oldValue.replace("\u274C", "").replace("\u2753", "").replace(/\s+/g, "");
      old_string = params.oldValue.replace("\u3010", "").replace("\u3011", "").replace(/\s+/g, "");
    }
    //let input_string = params.newValue.replace("\u274C", "").replace("\u2753", "");
    let input_string = params.newValue.replace("\u3010", "").replace("\u3011", "");
    if (old_string.length > 1) {
      // Compare string after trim
      let new_trimmed = input_string.replace(/\s+/g, "");
      if (old_string === new_trimmed) {
        return false;
      }
    }
    let output = {course: "", cid: 0, teacher: "", tid: 0};
    let item_splited = input_string.split(' ');
    if (item_splited.length >= 1) {
      output.course = item_splited[0];
      if (output.course === this.zixi) {
        delete params.data[dest_col];
        return true;
      }
    }
    if (item_splited.length === 2) {
      output.teacher = item_splited[1];
    }
    if (item_splited.length > 2) {
      output.teacher = input_string.replace(output.course, "");
    }
    //console.log("courseTeacherSetter: "+JSON.stringify(output));
    params.data[dest_col] = output;
    return true;
  };

  static courseTeacherCellStyle = (params) => {
    let course_teacher_combined = params.data[params.colDef.field];
    if (course_teacher_combined) {
      if (course_teacher_combined.cid < 0) return { backgroundColor: '#FEB2B2' };
      if (course_teacher_combined.tid < 0) return { backgroundColor: '#FED7E2' };
      if (course_teacher_combined.cid === 0) return { backgroundColor: '#00B5D8' };
    }
    return;
  };

  static classNamesGetter = (params) => {
    //console.log("courseTeacherGetter: params:"+params.value+" column:"+JSON.stringify(params.colDef, this.getCircularReplacer()));
    let value = params.data[params.colDef.field];
    //console.log("courseTeacherGetter: value:"+JSON.stringify(value));
    //Data sample: {12: '20全科1', 13:'20全科2'}
    if (!value) {
      return "";
    }
    let short_names = Object.values(value);
    return short_names.join(', ');
  };

  static slotWeekdayGetter = (params) => {
    //console.log("slotWeekdayGetter: params:"+params.value+" column:"+JSON.stringify(params.colDef, this.getCircularReplacer()));
    let value = params.data[params.colDef.field];
    console.log("slotWeekdayGetter: value:"+JSON.stringify(value));
    //Data sample: [mon_12, tue_56] or [mon, fri]
    if (!value) {
      return "";
    }
    let flat_string = "";
    Object.keys(value).forEach(index => {
      let translated = slotsTranslation[value[index]];
      if (translated) {
        flat_string += translated+" ";
      }
    });
    return flat_string;
  };

  static labListGetter = (params) => {
    let value = params.data[params.colDef.field];
    if (!value) {
      // Show flash icon when lab hour > 0
      return (!params.data.theory_item_content && !params.data.theory_item_hours)?"\u26A1":"";
    }
    let loc_data = value.items;
    if (!loc_data) {
      return "...";
    }
    if (isImmutable(loc_data)) {
      loc_data = value.items.toJS();
    }
    let short_names = Object.values(loc_data).map(function (lab_info) {
      return lab_info.location;
    });
    return short_names.join(', ');
  };

  static teacherListGetter = (params) => {
    let value = params.data[params.colDef.field];
    if (!value) {
      return "";
    }
    if (Array.isArray(value)) {
      return value.map(function (teacher_info) {
        return teacher_info.name;
      });
    }
    return value.name;
  };

  static teacherListSetter = (params) => {
    let newValue = params.newValue;
    if (typeof newValue !== 'string') return false;
    newValue = newValue.replace('，',' ').replace(',', ' ');
    let teachers = newValue.split(" ");
    params.data[params.column.colId] = teachers.map(teacher_name => ({id: -1, name: teacher_name}));
    return true;
  };

  static increasingValueGetter = (params) => {
    let value = params.data[params.colDef.field];
    if (!value) {
      return "";
    }
    if (params.node.rowIndex === 0) {
      return value;
    }
    let indexBefore = params.node.rowIndex;
    if (!params.api) {
      return value;
    }
    let dataBefore = params.api.getDisplayedRowAtIndex(indexBefore - 1);
    if (value < dataBefore.data[params.colDef.field]) {
      return "\u2757"+value;
    }
    return value;
  };

  static groupColoredWeekCellStyle = params => {
    let week_str = params.data['week_idx'];  //params.colDef.field
    if (!week_str) {
      return;
    }
    let week_idx = parseInt(week_str);
    if (!week_idx) {
      return { backgroundColor: '#D32F2F' };
    }
    switch (week_idx%4) {
      case 0:
        return { backgroundColor: '#FFAB91' };
      case 1:
        return { backgroundColor: '#D7CCC8' };
      case 2:
        return { backgroundColor: '#FF7043' };
      case 3:
        return { backgroundColor: '#FFB74D' };
      default:
        return {};
      }
    /*
    if (!params.api) {
      return;
    }
    let value = params.data[params.colDef.field];
    if (!value) {
      return;
    }
    if (params.node.rowIndex === 0) {
      return;
    }
    let dataBefore = params.api.getDisplayedRowAtIndex(params.node.rowIndex - 1);
    if (value < dataBefore.data[params.colDef.field]) {
      return { backgroundColor: '#FEB2B2' };
    }*/
    return;
  };

}