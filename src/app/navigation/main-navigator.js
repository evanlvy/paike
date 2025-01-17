import React, { PureComponent, useEffect } from 'react';
import {
  Switch,
  Route,
  Redirect,
} from 'react-router-dom';
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { withTranslation } from 'react-i18next';
import {
  Flex,
  AlertDialog,
  AlertDialogOverlay,
  Spinner,
  useToast,
} from '@chakra-ui/core';

import {
  MenuBar,
  MenuType,
  Alert,
} from '../components';

import { actions as authActions, getAccessLevel, getLoggedUser, getStudentInfo } from '../redux/modules/auth';
import { actions as gradeActions, getGradesOfAllDegrees, getSchoolYear, getStageList } from '../redux/modules/grade';
import { actions as jysActions, getJiaoyanshiOfAllCenters } from '../redux/modules/jiaoyanshi';
import { actions as requestActions, getRequestQuantity, getError, getToast, getSpinner } from '../redux/modules/app';

import AsyncComponent from '../utils/AsyncComponent';
import connectRoute from '../utils/connectRoute';

const AsyncLiLunKeBiaoScreen = connectRoute(AsyncComponent(() => import('../screens/lilun-kebiao-screen')));
const AsyncBanJiKeBiaoScreen = connectRoute(AsyncComponent(() => import('../screens/banji-kebiao-screen')));
const AsyncShiXunKeBiaoScreen = connectRoute(AsyncComponent(() => import('../screens/shixun-kebiao-screen')));
const AsyncCenterLabScreen = connectRoute(AsyncComponent(() => import('../screens/center-lab-screen')));
const AsyncJysKebiaoScreen = connectRoute(AsyncComponent(() => import('../screens/jys-kebiao-screen')));
const AsyncJwcKeBiaoScreen = connectRoute(AsyncComponent(() => import('../screens/jwc-kebiao-screen')));
const AsyncPaikeScreen = connectRoute(AsyncComponent(() => import('../screens/paike-screen')));
const AsyncEditRawplan = connectRoute(AsyncComponent(() => import('../screens/edit-rawplan-screen')));
const AsyncProgressdoc = connectRoute(AsyncComponent(() => import('../screens/progressdoc-screen')));
const AsyncCurriculums = connectRoute(AsyncComponent(() => import('../screens/curriculums-screen')));
const AsyncFrontPage = connectRoute(AsyncComponent(() => import('../screens/frontpage-screen')));

function Toast(props) {
  const toast = useToast();
  useEffect(() => {
    toast(props.params);
  }, []); // Passing in empty array so this will only get called on mount
  return null;
}

class MainNavigatorWrapper extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      showError: false,
    };
    this.confirmErrorDialog = React.createRef();
  }

  componentDidMount() {
    this.props.fetchAllGradeInfo();
    this.props.fetchStageList();
    this.props.updateSchoolYearWeekInfo();
    this.props.fetchJiaoyanshi();
  }

  componentDidUpdate() {
    const { requestError, requestToast } = this.props;
    if (requestError) {
      this.showConfirmDialog(requestError);
    }
    if (requestToast) {
      this.props.setToast(null);
    }
  }

  onMenuSelected = (menu, menu_params) => {
    const { t, history } = this.props;
    console.log("onMenuSelected: "+menu+", params: "+JSON.stringify(menu_params));
    switch(menu) {
      case MenuType.LILUN:
        history.push('/kebiao/lilun', menu_params);
        break;
      case MenuType.BANJI:
        history.push('/kebiao/banji', menu_params);
        break;
      case MenuType.SHIXUN:
        history.push('/kebiao/shixun', menu_params);
        break;
      case MenuType.SHIYANSHI:
        history.push('/labs', menu_params);
        break;
      case MenuType.JIAOYANSHI:
        history.push('/jys', menu_params);
        break;
      case MenuType.PAIKE:
        history.push('/paike', menu_params);
        break;
      case MenuType.JIAOWUCHU:
        history.push('/kebiao/jwc', menu_params);
        break;
      case MenuType.BASIC_MAINTAIN:
        if (menu_params.sub.name === t("maintainMenu.annualData_rawplans")) {
          history.push('/maintain/rawplan', menu_params);
        }
        else if (menu_params.sub.name === t("maintainMenu.annualData_progressdoc")) {
          history.push('/maintain/progressdoc', menu_params);
        }
        else if (menu_params.sub.name === t("maintainMenu.annualData_curriculums")) {
          history.push('/maintain/curriculums', menu_params);
        }
        break;
      default:
        break;
    }
  }

  showConfirmDialog = (requestError) => {
    const { t } = this.props;
    const title = t("alert.request_failure");
    const message = t("alert.request_failure_detail", {error_msg: requestError.message});
    this.confirmErrorDialog.current.show(title, message);
  }

  onConfirmError = () => {
    this.confirmErrorDialog.current.dismiss();
    this.props.removeError();
  }

  needLogin = () => {
    const { user } = this.props;
    return !user || !user.token;
  }

  onStageChanged = (stageId) => {
    if (stageId <= 0) {
      this.props.recoverStage();
    }
    else {
      this.props.setStage(stageId);
    }
  }

  render() {
    if (this.needLogin()) {
      return <Redirect to="/login" />;
    }
    const { onConfirmError, onStageChanged } = this;
    const { t, initStage, stageList, gradeTypes, centers, labBuildings, requestsCount, requestError, requestToast, enableSpinner, user, accessLevel, stuInfo } = this.props;
    //console.log("Request count: "+requestsCount);
    return (
      <Flex direction="column" justify="center" basis="100%">
        <Flex px="10%" direction="column" justify="flex-start" flex={1}>
          <MenuBar 
            stageList={stageList}
            initStage={initStage}
            onStageChanged={onStageChanged}
            gradeTypes={gradeTypes} 
            centers={centers} 
            labBuildings={labBuildings} 
            onMenuSelected={this.onMenuSelected}
            accessLevel={accessLevel}
            stuInfo={stuInfo}
            userInfo={user}
          />
          <Switch>
            <Route path="/kebiao/jwc" component={AsyncJwcKeBiaoScreen} />
            <Route path="/kebiao/lilun" component={AsyncLiLunKeBiaoScreen} />
            <Route path="/kebiao/banji" component={AsyncBanJiKeBiaoScreen} />
            <Route path="/kebiao/shixun" component={AsyncShiXunKeBiaoScreen} />
            { accessLevel <= "PROFESSOR" &&
            <>
              <Route path="/labs" component={AsyncCenterLabScreen} />
              <Route path="/jys" component={AsyncJysKebiaoScreen} />
              <Route path="/paike" component={AsyncPaikeScreen} />
              <Route path="/maintain/rawplan" component={AsyncEditRawplan} />
              <Route path="/maintain/progressdoc" component={AsyncProgressdoc} />
              <Route path="/maintain/curriculums" component={AsyncCurriculums} />
            </>}
            <Route path="/" component={AsyncFrontPage} />
          </Switch>
        </Flex>
        {/* Spinner */}
        {
          (enableSpinner || (requestsCount > 0 && !requestError)) &&
          <AlertDialog
            isOpen={true}
            motionPreset="scale"
          >
            <AlertDialogOverlay>
              <Flex w="100%" h="100%" alignItems="center" justifyContent="center">
                <Spinner size="8rem" thickness="8px" speed="0.65s" emptyColor="gray.200" color="blue.500"/>
              </Flex>
            </AlertDialogOverlay>
          </AlertDialog>
        }
        {/* Error alert box */}
        <Alert
          ref={this.confirmErrorDialog}
          onResult={onConfirmError} />
        {/* Info toast */}
        {
          requestToast && requestToast.message &&
          <Toast 
          params={{
            title: (requestToast.title)?requestToast.title:t('toast.'+requestToast.type),
            description: (requestToast.message.startsWith('toast.'))?t(requestToast.message):requestToast.message,
            status: requestToast.type?requestToast.type:"info",
            duration: (requestToast.type && requestToast.type==='error')?10000:3000,
            isClosable: true,
          }}>
          </Toast>
        }
      </Flex>
    )
  }
}
/*
<Flex position="absolute" top="0" right="0" bottom="0" left="0" w="100%" h="100%" bg="#aaaa" color="black" alignItems="center" justify="center" overflow="hidden">
            <Progress width="50%" height="20px" rounded="4px" value={100} hasStripe isAnimated />
          </Flex>
*/
const mapStateToProps = (state) => {
  return {
    user: getLoggedUser(state),
    stageList: getStageList(state),
    initStage: getSchoolYear(state),
    gradeTypes: getGradesOfAllDegrees(state),
    centers: getJiaoyanshiOfAllCenters(state),
    requestsCount: getRequestQuantity(state),
    requestError: getError(state),
    requestToast: getToast(state),
    enableSpinner: getSpinner(state),
    stuInfo: getStudentInfo(state),
    accessLevel: getAccessLevel(state),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    ...bindActionCreators(requestActions, dispatch),
    ...bindActionCreators(authActions, dispatch),
    ...bindActionCreators(gradeActions, dispatch),
    ...bindActionCreators(jysActions, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(MainNavigatorWrapper));
