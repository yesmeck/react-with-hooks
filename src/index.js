import React from 'react';
import withHooks from './withHooks';
import * as hooks from './ReactHooks';

const useNative = !!React.useState;

export const useState = useNative ? React.useState : hooks.useState;
export const useEffect = useNative ? React.useEffect : hooks.useEffect;
export const useContext = useNative ? React.useContext : hooks.useContext;
export const useReducer = useNative ? React.useReducer : hooks.useReducer;
export const useCallback = useNative ? React.useCallback : hooks.useCallback;
export const useMemo = useNative ? React.useMemo : hooks.useMemo;
export const useRef = useNative ? React.useRef : hooks.useRef;
export const useImperativeHandle = useNative ? React.useImperativeHandle : hooks.useImperativeHandle;
export const useMutationEffect = useNative ? React.useMutationEffect : hooks.useMutationEffect;
export const useLayoutEffect = useNative ? React.useLayoutEffect : hooks.useLayoutEffect;
export default useNative ? (fn) => fn : withHooks;
