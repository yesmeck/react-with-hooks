import React from 'react';
import * as ReactIs from 'react-is';
import withHooks from './withHooks';
import * as hooks from './ReactHooks';

const useNative = __DEV__ ? false : !!React.useState;

const nativeCreateElement = React.createElement;

function shouldConstruct(Component) {
  const prototype = Component.prototype;
  return !!(prototype && prototype.isReactComponent);
}

function isSimpleFunctionComponent(type) {
  return typeof type === 'function' && !shouldConstruct(type) && type.defaultProps === undefined;
}

function hasHooks(fn) {
  return /\buse[A-Z0-9]/g.test(fn.toString());
}

const createElementWithHooks = (() => {
  const componentMap = new Map();
  return (component, props, ...children) => {
    if (componentMap.has(component)) {
      return nativeCreateElement(componentMap.get(component), props, ...children);
    }
    const element = nativeCreateElement(component, props, ...children);
    let wrappedComponent = component;
    let render;
    if (ReactIs.isForwardRef(element)) {
      render = component.render;
      wrappedComponent.render = withHooks(render);
      componentMap.set(component, wrappedComponent);
    }
    if (ReactIs.isMemo(component)) {
      render = component.type;
      wrappedComponent.type = withHooks(render);
      componentMap.set(component, wrappedComponent);
    }
    if (isSimpleFunctionComponent(component) && component.__react_with_hooks !== true) {
      render = component;
      wrappedComponent = withHooks(render);
      componentMap.set(component, wrappedComponent);
    }
    if (!render || !hasHooks(render)) {
      return element;
    }
    return nativeCreateElement(wrappedComponent, props, ...children);
  };
})();

React.createElement = useNative ? React.createElement : createElementWithHooks;

if (!useNative) {
  Object.keys(hooks).forEach(hook => {
    React[hook] = hooks[hook];
  });
}
