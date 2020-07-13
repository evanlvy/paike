const Education = {
  COLLAGE : 1,
  VOCATIONAL: 2,
  DOCKING: 3,
};

function getEducationText(t, edu) {
  switch(edu) {
    case Education.COLLAGE:
      return t("grade.college");
    case Education.VOCATIONAL:
      return t("grade.vocational");
    case Education.DOCKING:
      return t("grade.docking");
    default:
      return "";
  }
}

export { Education, getEducationText };
