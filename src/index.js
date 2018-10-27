import React from 'react';

let currentInstance = null;
let isMounting = false;
let callIndex = 0;

export function useState(initial) {
  const id = ++callIndex;
  const state = currentInstance.state;
  const setState = currentInstance.setState.bind(currentInstance);
  const updater = newValue => {
    setState({
      [id]: newValue,
    })
  };
  if (isMounting) {
    state[id] = initial;
    return [initial, updater];
  } else {
    return [state[id], updater];
  }
}

export function useEffect(rawEffect, deps) {
  const id = ++callIndex;
  if (isMounting) {
    const injectedCleanup = () => {
      const { current } = injectedCleanup;
      if (current) {
        current();
        injectedCleanup.current = null;
      }
    };
    const injectedEffect = () => {
      injectedCleanup();
      const { current } = injectedEffect;
      if (current) {
        injectedCleanup.cleanup = current();
      }
    };
    injectedEffect.current = rawEffect;

    currentInstance._effectStore[id] = {
      effect: injectedEffect,
      cleanup: injectedCleanup,
      deps
    };

    injectEffect('componentDidMount', injectedEffect);
    injectEffect('componentWillUnmount', injectedCleanup);
    if (!deps) {
      injectEffect('componentDidUpdate', injectedEffect);
      injectEffect('componentWillUpdate', injectedCleanup);
    }
  } else {
    const { effect, deps: prevDeps = [] } = currentInstance._effectStore[id];
    if (!deps || deps.some((d, i) => d !== prevDeps[i])) {
      effect.current = rawEffect;
    } else {
      effect.current = null;
    }
  }
}

function injectEffect(key, fn) {
  currentInstance[key] = fn;
}

export default function withHooks(render) {
  class WithHooks extends React.Component {
    constructor() {
      super();
      this.state = {};
      this._effectStore = [];
      currentInstance = this;
      isMounting = true;
      this.ret = render(this.props);
    }

    render() {
      if (isMounting) {
        isMounting = false;
        callIndex = 0;
        return this.ret;
      }
      currentInstance = this;
      const ret = render(this.props);
      currentInstance = null;
      callIndex = 0;
      return ret;
    }
  }
  WithHooks.displayName = render.name;
  return WithHooks;
}
