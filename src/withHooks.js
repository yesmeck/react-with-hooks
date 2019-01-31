import React, { createElement } from 'react';
import invariant from 'invariant';

const RE_RENDER_LIMIT = 25;
const NoEffect = /*             */ 0b00000000;
const MountPassive = /*         */ 0b01000000;
const UnmountPassive = /*       */ 0b10000000;

let firstWorkInProgressHook = null;
let firstCurrentHook = null;
let currentHook = null;
let workInProgressHook = null;
let isReRender = false;
let didScheduleRenderPhaseUpdate = false;
let currentInstance = null;
let renderPhaseUpdates = null;
let numberOfReRenders = 0;
let componentUpdateQueue = null;
let componentContext = null;
let isRenderPhase = false;

function basicStateReducer(state, action) {
  return typeof action === 'function' ? action(state) : action;
}

function prepareToUseHooks(current) {
  currentInstance = current;
  firstCurrentHook = current.memoizedState ? current.memoizedState : null;
}

function finishHooks(render, props, children, refOrContext) {
  while (didScheduleRenderPhaseUpdate) {
    // Updates were scheduled during the render phase. They are stored in
    // the `renderPhaseUpdates` map. Call the component again, reusing the
    // work-in-progress hooks and applying the additional updates on top. Keep
    // restarting until no more updates are scheduled.
    didScheduleRenderPhaseUpdate = false;
    numberOfReRenders += 1;

    // Start over from the beginning of the list
    currentHook = null;
    workInProgressHook = null;
    componentUpdateQueue = null;

    children = currentInstance.applyContext(() => render(props, refOrContext));

    componentContext = null;
  }
  renderPhaseUpdates = null;
  numberOfReRenders = 0;
  currentInstance.firstHook = firstWorkInProgressHook;

  const renderedInstance = currentInstance;

  renderedInstance.memoizedState = firstWorkInProgressHook;
  renderedInstance.updateQueue = componentUpdateQueue;

  const didRenderTooFewHooks = currentHook !== null && currentHook.next !== null;

  currentInstance = null;

  firstCurrentHook = null;
  currentHook = null;
  firstWorkInProgressHook = null;
  workInProgressHook = null;
  componentUpdateQueue = null;
  componentContext = null;
  isRenderPhase = false;

  invariant(
    !didRenderTooFewHooks,
    'Rendered fewer hooks than expected. This may be caused by an accidental ' + 'early return statement.',
  );

  return children;
}

function resetHooks() {
  currentInstance = null;
  firstCurrentHook = null;
  currentHook = null;
  firstWorkInProgressHook = null;
  workInProgressHook = null;
  componentUpdateQueue = null;
  componentContext = null;

  didScheduleRenderPhaseUpdate = false;
  renderPhaseUpdates = null;
  numberOfReRenders = 0;
  isRenderPhase = false;
}

function createHook() {
  return {
    memoizedState: null,
    baseState: null,
    queue: null,
    baseUpdate: null,
    next: null,
  };
}

function cloneHook(hook) {
  return {
    memoizedState: hook.memoizedState,
    baseState: hook.memoizedState,
    queue: hook.queue,
    baseUpdate: hook.baseUpdate,
    next: null,
  };
}

function createWorkInProgressHook() {
  if (workInProgressHook === null) {
    // This is the first hook in the list
    if (firstWorkInProgressHook === null) {
      isReRender = false;
      currentHook = firstCurrentHook;

      if (currentHook === null) {
        // This is a newly mounted hook
        workInProgressHook = createHook();
      } else {
        // Clone the current hook.
        workInProgressHook = cloneHook(currentHook);
      }

      firstWorkInProgressHook = workInProgressHook;
    } else {
      // There's already a work-in-progress. Reuse it.
      isReRender = true;
      currentHook = firstCurrentHook;
      workInProgressHook = firstWorkInProgressHook;
    }
  } else {
    if (workInProgressHook.next === null) {
      isReRender = false;
      var hook = void 0;

      if (currentHook === null) {
        // This is a newly mounted hook
        hook = createHook();
      } else {
        currentHook = currentHook.next;

        if (currentHook === null) {
          // This is a newly mounted hook
          hook = createHook();
        } else {
          // Clone the current hook.
          hook = cloneHook(currentHook);
        }
      } // Append to the end of the list

      workInProgressHook = workInProgressHook.next = hook;
    } else {
      // There's already a work-in-progress. Reuse it.
      isReRender = true;
      workInProgressHook = workInProgressHook.next;
      currentHook = currentHook !== null ? currentHook.next : null;
    }
  }

  return workInProgressHook;
}

function createFunctionComponentUpdateQueue() {
  return {
    lastEffect: null,
  };
}

function inputsAreEqual(arr1, arr2) {
  for (let i = 0; i < arr1.length; i++) {
    const val1 = arr1[i];
    const val2 = arr2[i];
    if ((val1 === val2 && (val1 !== 0 || 1 / val1 === 1 / val2)) || (val1 !== val1 && val2 !== val2)) {
      continue;
    }
    return false;
  }
  return true;
}

function pushEffect(tag, create, destroy, inputs) {
  const effect = {
    tag,
    create,
    destroy,
    inputs,
    // Circular
    next: null,
  };
  if (componentUpdateQueue === null) {
    componentUpdateQueue = createFunctionComponentUpdateQueue();
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {
    const lastEffect = componentUpdateQueue.lastEffect;
    if (lastEffect === null) {
      componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
      const firstEffect = lastEffect.next;
      lastEffect.next = effect;
      effect.next = firstEffect;
      componentUpdateQueue.lastEffect = effect;
    }
  }
  return effect;
}

function pushContext(context) {
  const _context = {
    Consumer: context.Consumer,
    next: null,
  };
  if (componentContext === null) {
    componentContext = _context;
  } else {
    componentContext.next = _context;
  }
  return _context;
}

function dispatchAction(instance, queue, action) {
  invariant(
    numberOfReRenders < RE_RENDER_LIMIT,
    'Too many re-renders. React limits the number of renders to prevent ' + 'an infinite loop.',
  );
  if (isRenderPhase) {
    // This is a render phase update. Stash it in a lazily-created map of
    // queue -> linked list of updates. After this render pass, we'll restart
    // and apply the stashed updates on top of the work-in-progress hook.
    didScheduleRenderPhaseUpdate = true;
    const update = {
      action,
      next: null,
    };
    if (renderPhaseUpdates === null) {
      renderPhaseUpdates = new Map();
    }
    const firstRenderPhaseUpdate = renderPhaseUpdates.get(queue);
    if (firstRenderPhaseUpdate === undefined) {
      renderPhaseUpdates.set(queue, update);
    } else {
      // Append the update to the end of the list.
      let lastRenderPhaseUpdate = firstRenderPhaseUpdate;
      while (lastRenderPhaseUpdate.next !== null) {
        lastRenderPhaseUpdate = lastRenderPhaseUpdate.next;
      }
      lastRenderPhaseUpdate.next = update;
    }
  } else {
    const update = {
      action,
      next: null,
    };
    // Append the update to the end of the list.
    const last = queue.last;
    if (last === null) {
      // This is the first update. Create a circular list.
      update.next = update;
    } else {
      const first = last.next;
      if (first !== null) {
        // Still circular.
        update.next = first;
      }
      last.next = update;
    }
    queue.last = update;
    instance.setState({});
  }
}

export function useState(initialState) {
  return useReducer(basicStateReducer, initialState);
}

export function useEffect(create, inputs) {
  const workInProgressHook = createWorkInProgressHook();

  let nextInputs = inputs !== undefined && inputs !== null ? inputs : [create];
  let destroy = null;
  if (currentHook !== null) {
    const prevEffect = currentHook.memoizedState;
    destroy = prevEffect.destroy;
    if (inputsAreEqual(nextInputs, prevEffect.inputs)) {
      pushEffect(NoEffect, create, destroy, nextInputs);
      return;
    }
  }

  workInProgressHook.memoizedState = pushEffect(UnmountPassive | MountPassive, create, destroy, nextInputs);
}

export function useContext(Context) {
  pushContext(Context);
  return Context._currentValue;
}

export function useReducer(reducer, initialState, initialAction) {
  workInProgressHook = createWorkInProgressHook();
  let queue = workInProgressHook.queue;
  if (queue !== null) {
    // Already have a queue, so this is an update.
    if (isReRender) {
      // This is a re-render. Apply the new render phase updates to the previous
      // work-in-progress hook.
      const dispatch = queue.dispatch;
      if (renderPhaseUpdates !== null) {
        // Render phase updates are stored in a map of queue -> linked list
        const firstRenderPhaseUpdate = renderPhaseUpdates.get(queue);
        if (firstRenderPhaseUpdate !== undefined) {
          renderPhaseUpdates.delete(queue);
          let newState = workInProgressHook.memoizedState;
          let update = firstRenderPhaseUpdate;
          do {
            // Process this render phase update. We don't have to check the
            // priority because it will always be the same as the current
            // render's.
            const action = update.action;
            newState = reducer(newState, action);
            update = update.next;
          } while (update !== null);

          workInProgressHook.memoizedState = newState;

          // Don't persist the state accumlated from the render phase updates to
          // the base state unless the queue is empty.
          // TODO: Not sure if this is the desired semantics, but it's what we
          // do for gDSFP. I can't remember why.
          if (workInProgressHook.baseUpdate === queue.last) {
            workInProgressHook.baseState = newState;
          }

          return [newState, dispatch];
        }
      }
      return [workInProgressHook.memoizedState, dispatch];
    }

    // The last update in the entire queue
    const last = queue.last;
    // The last update that is part of the base state.
    const baseUpdate = workInProgressHook.baseUpdate;

    // Find the first unprocessed update.
    let first;
    if (baseUpdate !== null) {
      if (last !== null) {
        // For the first update, the queue is a circular linked list where
        // `queue.last.next = queue.first`. Once the first update commits, and
        // the `baseUpdate` is no longer empty, we can unravel the list.
        last.next = null;
      }
      first = baseUpdate.next;
    } else {
      first = last !== null ? last.next : null;
    }
    if (first !== null) {
      let newState = workInProgressHook.baseState;
      let newBaseState = null;
      let newBaseUpdate = null;
      let prevUpdate = baseUpdate;
      let update = first;
      let didSkip = false;
      do {
        // Process this update.
        const action = update.action;
        newState = reducer(newState, action);
        prevUpdate = update;
        update = update.next;
      } while (update !== null && update !== first);

      if (!didSkip) {
        newBaseUpdate = prevUpdate;
        newBaseState = newState;
      }

      workInProgressHook.memoizedState = newState;
      workInProgressHook.baseUpdate = newBaseUpdate;
      workInProgressHook.baseState = newBaseState;
    }

    const dispatch = queue.dispatch;
    return [workInProgressHook.memoizedState, dispatch];
  }

  // There's no existing queue, so this is the initial render.
  if (reducer === basicStateReducer) {
    // Special case for `useState`.
    if (typeof initialState === 'function') {
      initialState = initialState();
    }
  } else if (initialAction !== undefined && initialAction !== null) {
    initialState = reducer(initialState, initialAction);
  }
  workInProgressHook.memoizedState = workInProgressHook.baseState = initialState;
  queue = workInProgressHook.queue = {
    last: null,
    dispatch: null,
  };
  const dispatch = (queue.dispatch = dispatchAction.bind(null, currentInstance, queue));
  return [workInProgressHook.memoizedState, dispatch];
}

export function useCallback(fn, deps) {
  return useMemo(() => fn, deps);
}

export function useMemo(nextCreate, inputs) {
  const workInProgressHook = createWorkInProgressHook();

  const nextInputs = inputs !== undefined && inputs !== null ? inputs : [nextCreate];

  const prevState = workInProgressHook.memoizedState;
  if (prevState !== null) {
    const prevInputs = prevState[1];
    if (inputsAreEqual(nextInputs, prevInputs)) {
      return prevState[0];
    }
  }

  const nextValue = nextCreate();
  workInProgressHook.memoizedState = [nextValue, nextInputs];
  return nextValue;
}

export function useRef(initialValue) {
  workInProgressHook = createWorkInProgressHook();
  let ref;

  if (workInProgressHook.memoizedState === null) {
    ref = { current: initialValue };
    workInProgressHook.memoizedState = ref;
  } else {
    ref = workInProgressHook.memoizedState;
  }
  return ref;
}

export function useImperativeMethods(ref, create, inputs) {
  // TODO: If inputs are provided, should we skip comparing the ref itself?
  const nextInputs = inputs !== null && inputs !== undefined ? inputs.concat([ref]) : [ref, create];

  // TODO: I've implemented this on top of useEffect because it's almost the
  // same thing, and it would require an equal amount of code. It doesn't seem
  // like a common enough use case to justify the additional size.
  useEffect(() => {
    if (typeof ref === 'function') {
      const refCallback = ref;
      const inst = create();
      refCallback(inst);
      return () => refCallback(null);
    } else if (ref !== null && ref !== undefined) {
      const refObject = ref;
      const inst = create();
      refObject.current = inst;
      return () => {
        refObject.current = null;
      };
    }
  }, nextInputs);
}

export function useMutationEffect(...args) {
  return useEffect(...args);
}

export function useLayoutEffect(...args) {
  return useEffect(...args);
}

export default function withHooks(render) {
  class WithHooks extends React.Component {
    componentDidMount() {
      this.commitHookEffectList(UnmountPassive, NoEffect);
      this.commitHookEffectList(NoEffect, MountPassive);
      this.mounted = true;
    }

    componentDidUpdate() {
      this.commitHookEffectList(UnmountPassive, NoEffect);
      this.commitHookEffectList(NoEffect, MountPassive);
    }

    componentWillUnmount() {
      this.callDestroy();
    }

    commitHookEffectList(unmountTag, mountTag) {
      let lastEffect = this.updateQueue !== null ? this.updateQueue.lastEffect : null;
      if (lastEffect !== null) {
        const firstEffect = lastEffect.next;
        let effect = firstEffect;
        do {
          if ((effect.tag & unmountTag) !== NoEffect) {
            // Unmount
            const destroy = effect.destroy;
            effect.destroy = null;
            if (destroy !== null) {
              destroy();
            }
          }
          effect = effect.next;
        } while (effect !== firstEffect);

        effect = firstEffect;
        do {
          if ((effect.tag & mountTag) !== NoEffect) {
            // Mount
            const create = effect.create;
            const destroy = create();
            effect.destroy = typeof destroy === 'function' ? destroy : null;
          }
          effect = effect.next;
        } while (effect !== firstEffect);
      }
    }

    callDestroy() {
      const updateQueue = this.updateQueue;

      if (updateQueue !== null) {
        var lastEffect = updateQueue.lastEffect;

        if (lastEffect !== null) {
          var firstEffect = lastEffect.next;
          var effect = firstEffect;

          do {
            var destroy = effect.destroy;

            if (destroy !== null) {
              destroy();
            }

            effect = effect.next;
          } while (effect !== firstEffect);
        }
      }
    }

    applyContext(render, context, children) {
      if (!children) {
        children = render();
      }
      context = context || componentContext;
      if (context !== null) {
        return createElement(context.Consumer, {}, () => {
          if (this.mounted) {
            children = render();
          }
          if (context.next !== null) {
            return applyContext(children, context.next, children);
          }
          return children;
        });
      }
      return children;
    }

    render() {
      resetHooks();
      prepareToUseHooks(this);
      const { _forwardedRef, ...rest } = this.props;
      isRenderPhase = true;
      const nextChildren = this.applyContext(() => render(rest, _forwardedRef));
      return finishHooks(render, rest, nextChildren, _forwardedRef);
    }
  }
  WithHooks.displayName = render.displayName || render.name;
  const wrap = (props, ref) => <WithHooks {...props} _forwardedRef={ref} />;
  wrap.displayName = `WithHooks(${WithHooks.displayName})`;
  return wrap;
}
