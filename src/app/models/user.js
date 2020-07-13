let curUser = null;

const setCurUser = (name) => {
  curUser = {
    name: name
  };
}

const hasLogin = () => {
  return curUser != null;
}

export { setCurUser, hasLogin };
