'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.exportedGetNavigation = exports.getCurrentHistory = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; /* eslint-env browser */

exports.default = createBrowserApp;

var _history = require('history');

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _core = require('@react-navigation/core');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable import/no-commonjs */
const queryString = require('query-string');

const getPathAndParamsFromLocation = location => {
  const path = encodeURI(location.pathname.substr(1));
  const params = queryString.parse(location.search);
  return { path, params };
};

const matchPathAndParams = (a, b) => {
  if (a.path !== b.path) {
    return false;
  }
  if (queryString.stringify(a.params) !== queryString.stringify(b.params)) {
    return false;
  }
  return true;
};

function getHistory(history) {
  if (typeof history === 'string') {
    switch (history) {
      case 'browser':
        return (0, _history.createBrowserHistory)();
      case 'hash':
        return (0, _history.createHashHistory)();
      case 'memory':
        return (0, _history.createMemoryHistory)();
      default:
        throw new Error('@react-navigation/web: createBrowserApp() Invalid value for options.history ' + history);
    }
  }
  return history || (0, _history.createBrowserHistory)();
}

let history;
const getCurrentHistory = exports.getCurrentHistory = () => {
  return history;
};

let exportedGetNavigation = exports.exportedGetNavigation = undefined;

function createBrowserApp(App, { history: historyOption } = {}) {
  history = getHistory(historyOption);
  let currentPathAndParams = getPathAndParamsFromLocation(history.location);

  const initAction = App.router.getActionForPathAndParams(currentPathAndParams.path, currentPathAndParams.params) || _core.NavigationActions.init();

  const setHistoryListener = dispatch => {
    history.listen(location => {
      const pathAndParams = getPathAndParamsFromLocation(location);
      if (matchPathAndParams(pathAndParams, currentPathAndParams)) {
        return;
      }
      currentPathAndParams = pathAndParams;
      const action = App.router.getActionForPathAndParams(pathAndParams.path, pathAndParams.params);
      if (action) {
        dispatch(action);
      } else {
        dispatch(initAction);
      }
    });
  };

  class WebApp extends _react2.default.Component {
    constructor(...args) {
      var _temp;

      return _temp = super(...args), this.state = { nav: App.router.getStateForAction(initAction) }, this._title = document.title, this._actionEventSubscribers = new Set(), this.dispatch = action => {
        const lastState = this.state.nav;
        const newState = App.router.getStateForAction(action, lastState);
        const getOwnerMemberId = this.props.screenProps.getOwnerMemberId;
        const dispatchEvents = () => this._actionEventSubscribers.forEach(subscriber => subscriber({
          type: 'action',
          action,
          state: newState,
          lastState
        }));
        if (newState && newState !== lastState) {
          this.setState({ nav: newState }, () => {
            this._onNavigationStateChange(lastState, newState, action);
            dispatchEvents();
          });
          const pathAndParams = App.router.getPathAndParamsForState && App.router.getPathAndParamsForState(newState);
          if (pathAndParams && !matchPathAndParams(pathAndParams, currentPathAndParams)) {
            currentPathAndParams = pathAndParams;
            const params = _extends({}, pathAndParams.params);
            if (getOwnerMemberId && getOwnerMemberId()) {
              params.userId = getOwnerMemberId();
            }
            history.push(`/${pathAndParams.path}?${queryString.stringify(params)}`);
          }
        } else {
          dispatchEvents();
        }
      }, _temp;
    }

    componentDidMount() {
      setHistoryListener(this.dispatch);
      this.updateTitle();
      this._actionEventSubscribers.forEach(subscriber => subscriber({
        type: 'action',
        action: initAction,
        state: this.state.nav,
        lastState: null
      }));
      exports.exportedGetNavigation = exportedGetNavigation = () => {
        return this._navigation;
      };
    }
    componentDidUpdate() {
      this.updateTitle();
    }
    updateTitle() {
      const { state } = this._navigation;
      const childKey = state.routes[state.index].key;
      const activeNav = this._navigation.getChildNavigation(childKey);
      const opts = App.router.getScreenOptions(activeNav);
      this._title = opts.title || opts.headerTitle;
      if (this._title) {
        document.title = this._title;
      }
    }

    _onNavigationStateChange(prevNav, nav, action) {
      if (typeof this.props.onNavigationStateChange === 'function') {
        this.props.onNavigationStateChange(prevNav, nav, action);
      }
    }

    render() {
      this._navigation = (0, _core.getNavigation)(App.router, this.state.nav, this.dispatch, this._actionEventSubscribers, () => this.props.screenProps, () => this._navigation);
      return _react2.default.createElement(
        _core.NavigationProvider,
        { value: this._navigation },
        _react2.default.createElement(App, _extends({}, this.props, { navigation: this._navigation }))
      );
    }
  }
  return WebApp;
}