const LabType = {
  BY_CENTER: 1,
  BY_BUILDING: 2,
};

function getLabTypeText(t, labType) {
  switch(labType) {
    case LabType.BY_CENTER:
      return t("lab.by_center");
    case LabType.BY_BUILDING:
      return t("lab.by_building");
    default:
      return "";
  }
}

export { LabType, getLabTypeText };
