const React = require('react');
const reactHooks = require('./withHooks');

const useNative = !!React.useState;

const nativeCreateElement = React.createElement;
const { default: withHooks, ...hooks } = reactHooks;

const createElementWithHooks = (() => {
  const componentMap = new Map();
  return (el, props, ...children) => {
    if (typeof el === 'function' && el.prototype && !el.prototype.isReactComponent) {
      if (!componentMap.has(el)) {
        if (
          !/\buse(State|(Mutation|Layout)?Effect|Context|Reducer|Callback|Memo|Ref|ImperativeHandle)\b/.test(`${el}`)
        ) {
          componentMap.set(el, el);
        } else {
          componentMap.set(el, withHooks(el));
        }
      }
      return nativeCreateElement(componentMap.get(el), props, ...children);
    }
    return nativeCreateElement(el, props, ...children);
  };
})();

React.createElement = useNative ? React.createElement : createElementWithHooks;

if (!useNative) {
  Object.keys(hooks).forEach(hook => {
    React[hook] = hooks[hook];
  });
}
