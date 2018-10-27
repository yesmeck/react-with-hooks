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
    state[id] = typeof initial === 'function' ? initial() : initial;
    return [state[id], updater];
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
        injectedCleanup.current = current();
      }
    };
    injectedEffect.current = rawEffect;

    currentInstance._hookStore[id] = {
      effect: injectedEffect,
      cleanup: injectedCleanup,
      deps
    };

    injectEffect('componentDidMount', injectedEffect);
    injectEffect('componentWillUnmount', injectedCleanup);
    injectEffect('componentDidUpdate', injectedEffect);
    injectEffect('componentWillUpdate', injectedCleanup);
  } else {
    const { effect, deps: prevDeps = [] } = currentInstance._hookStore[id];
    if (!deps || deps.some((d, i) => d !== prevDeps[i])) {
      effect.current = rawEffect;
    } else {
      effect.current = null;
    }
  }
}

export function useContext(Context) {
  if (isMounting) {
    const originalRender = currentInstance.render.bind(currentInstance);
    currentInstance.render = () => (
      <Context.Consumer>
        {originalRender}
      </Context.Consumer>
    );
  }
  return Context._currentValue;
}

export function useReducer(reducer, initialState, initialAction) {
  if (isMounting && initialAction) {
    initialState = reducer(initialState, initialAction);
  }

  const [state, setState] = useState(initialState);

  function dispatch(action) {
    setState(reducer(state, action));
  }

  return [state, dispatch];
}

function injectEffect(key, fn) {
  currentInstance[key] = fn;
}

export function useCallback(fn, deps) {
  return useMemo(() => fn, deps)
}

export function useMemo(fn, deps) {
  const id = ++callIndex;

  if (isMounting) {
    const result = fn();
    currentInstance._hookStore[id] = {
      deps,
      result,
    };
    return result;
  } else {
    const { result, deps: prevDeps = [] } = currentInstance._hookStore[id];
    if (!deps || deps.some((d, i) => d !== prevDeps[i])) {
      const result = fn();
      currentInstance._hookStore[id] = { deps, result };
      return result;
    } else {
      return result;
    }
  }
}

export function useRef(initial) {
  const id = ++callIndex;

  if (isMounting) {
    const ref = {
      current: initial,
    };
    currentInstance._hookStore[id] = ref;
    return ref;
  } else {
    return currentInstance._hookStore[id];
  }
}

export function useImperativeMethods(ref, createInstance, deps) {
  const instance = useMemo(createInstance, deps);
  ref.current = instance;
}

export default function withHooks(render) {
  class WithHooks extends React.Component {
    constructor(props) {
      super();
      this.state = {};
      this._hookStore = [];
      currentInstance = this;
      isMounting = true;
      this.ret = render(props, props._forwardedRef);
    }

    render() {
      if (isMounting) {
        isMounting = false;
        callIndex = 0;
        return this.ret;
      }
      currentInstance = this;
      const ret = render(this.props, this.props._forwardedRef);
      currentInstance = null;
      callIndex = 0;
      return ret;
    }
  }
  WithHooks.displayName = render.displayName || render.name;
  return WithHooks;
}
