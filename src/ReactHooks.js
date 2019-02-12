/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import invariant from 'invariant';

import ReactCurrentDispatcher from './ReactCurrentDispatcher';

function resolveDispatcher() {
  const dispatcher = ReactCurrentDispatcher.current;
  invariant(
    dispatcher !== null,
    'Hooks can only be called inside the body of a function component. ' +
      '(https://fb.me/react-invalid-hook-call)',
  );
  return dispatcher;
}

export function useContext(
  context,
) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useContext(context);
}

export function useState(initialState) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
}

export function useReducer(
  reducer,
  initialArg,
  init,
) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useReducer(reducer, initialArg, init);
}

export function useRef(initialValue) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useRef(initialValue);
}

export function useEffect(
  create,
  inputs,
) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useEffect(create, inputs);
}

export function useLayoutEffect(
  create,
  inputs,
) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useLayoutEffect(create, inputs);
}

export function useCallback(
  callback,
  inputs,
) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useCallback(callback, inputs);
}

export function useMemo(
  create,
  inputs,
) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useMemo(create, inputs);
}

export function useImperativeHandle(
  ref,
  create,
  inputs,
) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useImperativeHandle(ref, create, inputs);
}
