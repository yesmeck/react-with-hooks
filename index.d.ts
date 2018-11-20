import * as React from 'react';

type WithHooks = <T>(component: React.SFC<T>) => React.SFC<T>;

declare function useContext<T>(context: React.Context<T>): T;
declare function useState<S>(initialState: S | (() => S)): [S, React.Dispatch<React.SetStateAction<S>>];
declare function useReducer<S, A>(
  reducer: React.Reducer<S, A>,
  initialState: S,
  initialAction?: A | null,
): [S, React.Dispatch<A>];
declare function useRef<T>(initialValue: T): React.MutableRefObject<T>;
declare function useRef<T>(initialValue: T | null): React.RefObject<T>;
declare function useMutationEffect(effect: React.EffectCallback, inputs?: React.InputIdentityList): void;
declare function useLayoutEffect(effect: React.EffectCallback, inputs?: React.InputIdentityList): void;
declare function useEffect(effect: React.EffectCallback, inputs?: React.InputIdentityList): void;
declare function useImperativeMethods<T, R extends T>(
  ref: React.Ref<T> | undefined,
  init: () => R,
  inputs?: React.InputIdentityList,
): void;
declare function useCallback<T extends (...args: any[]) => any>(callback: T, inputs: React.InputIdentityList): T;
declare function useMemo<T>(factory: () => T, inputs: React.InputIdentityList): T;

declare var withHooks: WithHooks;

export {
  useContext,
  useState,
  useReducer,
  useRef,
  useMutationEffect,
  useLayoutEffect,
  useEffect,
  useImperativeMethods,
  useCallback,
  useMemo,
}
export default withHooks;
