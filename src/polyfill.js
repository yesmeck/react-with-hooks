const React = require('react');
const reactHooks = require('./withHooks');

const useNative = !!React.useState;

const { default: withHooks, ...hooks } = reactHooks;

const createElementWithHooks = useNative ? React.createElement : (() => {
  const componentMap = new Map();
  return (el, props, ...children) => {
    if (typeof el === 'function' && el.prototype && !el.prototype.isReactComponent) {
      if (!componentMap.has(el)) {
        if (!/\buse(State|(Mutation|Layout)?Effect|Context|Reducer|Callback|Memo|Ref|ImperativeHandle)\b/.test(`${el}`)) {
          componentMap.set(el, el);
        } else {
          componentMap.set(el, withHooks(el));
        }
      }
      return React.createElement(componentMap.get(el), props, ...children);
    }
    return React.createElement(el, props, ...children);
  }
})();

const newReact = {
  ...React,
  ...(useNative ? {} : { createElement: createElementWithHooks, ...hooks }),
};

newReact.default = { ...newReact };

module.exports = newReact;
