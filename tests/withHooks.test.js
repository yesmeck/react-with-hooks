import React, { createContext, forwardRef, memo } from 'react';
import { mount } from 'enzyme';
import withHooks, {
  useState,
  useEffect,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useRef,
  useImperativeMethods,
} from '../src';

class Logger {
  constructor() {
    this.logs = [];
  }

  flush() {
    const logs = this.logs;
    this.logs = [];
    return logs;
  }

  log(msg) {
    this.logs.push(msg);
  }
}

describe('hooks', () => {
  let logger;

  function Text(props) {
    logger.log(props.text);
    return <span>{props.text}</span>;
  }

  beforeEach(() => {
    logger = new Logger();
  });

  describe('useState', () => {
    it('simple mount and update', () => {
      let Counter = withHooks((props, ref) => {
        const [count, updateCount] = useState(0);
        useImperativeMethods(ref, () => ({ updateCount }));
        return <Text text={'Count: ' + count} />;
      });
      Counter = forwardRef(Counter);
      const counter = React.createRef(null);
      const App = () => <Counter ref={counter} />;
      const wrapper = mount(<App />);
      expect(wrapper.text()).toEqual('Count: 0');

      counter.current.updateCount(1);
      expect(wrapper.text()).toEqual('Count: 1');

      counter.current.updateCount(count => count + 10);
      expect(wrapper.text()).toEqual('Count: 11');
    });

    it('lazy state initializer', () => {
      let Counter = withHooks((props, ref) => {
        const [count, updateCount] = useState(() => {
          logger.log('getInitialState');
          return props.initialState;
        });
        useImperativeMethods(ref, () => ({ updateCount }));
        return <Text text={'Count: ' + count} />;
      });
      Counter = forwardRef(Counter);
      const counter = React.createRef(null);
      const App = () => <Counter initialState={42} ref={counter} />;
      const wrapper = mount(<App />);
      expect(logger.flush()).toEqual(['getInitialState', 'Count: 42']);
      expect(wrapper.text()).toEqual('Count: 42');

      counter.current.updateCount(7);
      expect(logger.flush()).toEqual(['Count: 7']);
      expect(wrapper.text()).toEqual('Count: 7');
    });

    it('multiple states', () => {
      let Counter = withHooks((props, ref) => {
        const [count, updateCount] = useState(0);
        const [label, updateLabel] = useState('Count');
        useImperativeMethods(ref, () => ({ updateCount, updateLabel }));
        return <Text text={label + ': ' + count} />;
      });
      Counter = forwardRef(Counter);
      const counter = React.createRef(null);
      const App = () => <Counter ref={counter} />;
      const wrapper = mount(<App />);
      expect(wrapper.text()).toEqual('Count: 0');

      counter.current.updateCount(7);
      expect(wrapper.text()).toEqual('Count: 7');

      counter.current.updateLabel('Total');
      expect(wrapper.text()).toEqual('Total: 7');
    });

    it('returns the same updater function every time', () => {
      let updaters = [];
      const Counter = withHooks(() => {
        const [count, updateCount] = useState(0);
        updaters.push(updateCount);
        return <Text text={'Count: ' + count} />;
      });
      const wrapper = mount(<Counter />);
      expect(wrapper.text()).toEqual('Count: 0');

      updaters[0](1);
      expect(wrapper.text()).toEqual('Count: 1');

      updaters[0](count => count + 10);
      expect(wrapper.text()).toEqual('Count: 11');

      expect(updaters).toEqual([updaters[0], updaters[0], updaters[0]]);
    });

    // enzyme don't support memo yet
    it.skip('works with memo', () => {
      let _updateCount;
      let Counter = withHooks(props => {
        const [count, updateCount] = useState(0);
        _updateCount = updateCount;
        return <Text text={'Count: ' + count} />;
      });
      Counter = memo(Counter);

      const wrapper = mount(<Counter />);
      expect(logger.flush()).toEqual(['Count: 0']);
      expect(wrapper.text()).toEqual('Count: 0');

      wrapper.setProps({});
      expect(logger.flush()).toEqual([]);
      expect(renderNumbers).toEqual(0);

      _updateCount(1);
      expect(logger.flush()).toEqual(['Count: 1']);
      expect(wrapper.text()).toEqual('Count: 1');
    });
  });

  describe('updates during the render phase', () => {
    it('restarts the render function and applies the new updates on top', () => {
      const ScrollView = withHooks(({ row: newRow }) => {
        let [isScrollingDown, setIsScrollingDown] = useState(false);
        let [row, setRow] = useState(null);

        if (row !== newRow) {
          // Row changed since last render. Update isScrollingDown.
          setIsScrollingDown(row !== null && newRow > row);
          setRow(newRow);
        }

        return <Text text={`Scrolling down: ${isScrollingDown}`} />;
      });

      const wrapper = mount(<ScrollView row={1} />);
      expect(wrapper.text()).toEqual('Scrolling down: false');

      wrapper.setProps({ row: 5 });
      expect(wrapper.text()).toEqual('Scrolling down: true');

      wrapper.setProps({ row: 5 });
      expect(wrapper.text()).toEqual('Scrolling down: true');

      wrapper.setProps({ row: 10 });
      expect(wrapper.text()).toEqual('Scrolling down: true');

      wrapper.setProps({ row: 2 });
      expect(wrapper.text()).toEqual('Scrolling down: false');

      wrapper.setProps({ row: 2 });
      expect(wrapper.text()).toEqual('Scrolling down: false');
    });

    it('keeps restarting until there are no more new updates', () => {
      const Counter = withHooks(({ row: newRow }) => {
        let [count, setCount] = useState(0);
        if (count < 3) {
          setCount(count + 1);
        }
        logger.log('Render: ' + count);
        return <Text text={count} />;
      });

      const wrapper = mount(<Counter />);
      expect(logger.flush()).toEqual(['Render: 0', 'Render: 1', 'Render: 2', 'Render: 3', 3]);
      expect(wrapper.text()).toEqual('3');
    });

    it('updates multiple times within same render function', () => {
      const Counter = withHooks(({ row: newRow }) => {
        let [count, setCount] = useState(0);
        if (count < 12) {
          setCount(c => c + 1);
          setCount(c => c + 1);
          setCount(c => c + 1);
        }
        logger.log('Render: ' + count);
        return <Text text={count} />;
      });

      const wrapper = mount(<Counter />);
      expect(logger.flush()).toEqual([
        // Should increase by three each time
        'Render: 0',
        'Render: 3',
        'Render: 6',
        'Render: 9',
        'Render: 12',
        12,
      ]);
      expect(wrapper.text()).toEqual('12');
    });

    it('works with useReducer', () => {
      function reducer(state, action) {
        return action === 'increment' ? state + 1 : state;
      }
      const Counter = withHooks(({ row: newRow }) => {
        let [count, dispatch] = useReducer(reducer, 0);
        if (count < 3) {
          dispatch('increment');
        }
        logger.log('Render: ' + count);
        return <Text text={count} />;
      });

      const wrapper = mount(<Counter />);
      expect(logger.flush()).toEqual(['Render: 0', 'Render: 1', 'Render: 2', 'Render: 3', 3]);
      expect(wrapper.text()).toEqual('3');
    });

    it('uses reducer passed at time of render, not time of dispatch', () => {
      // This test is a bit contrived but it demonstrates a subtle edge case.

      // Reducer A increments by 1. Reducer B increments by 10.
      function reducerA(state, action) {
        switch (action) {
          case 'increment':
            return state + 1;
          case 'reset':
            return 0;
        }
      }
      function reducerB(state, action) {
        switch (action) {
          case 'increment':
            return state + 10;
          case 'reset':
            return 0;
        }
      }

      let Counter = withHooks(({ row: newRow }, ref) => {
        let [reducer, setReducer] = useState(() => reducerA);
        let [count, dispatch] = useReducer(reducer, 0);
        useImperativeMethods(ref, () => ({ dispatch }));
        if (count < 20) {
          dispatch('increment');
          // Swap reducers each time we increment
          if (reducer === reducerA) {
            setReducer(() => reducerB);
          } else {
            setReducer(() => reducerA);
          }
        }
        logger.log('Render: ' + count);
        return <Text text={count} />;
      });
      Counter = forwardRef(Counter);
      const counter = React.createRef(null);
      const App = () => <Counter ref={counter} />;
      const wrapper = mount(<App />);
      expect(logger.flush()).toEqual([
        // The count should increase by alternating amounts of 10 and 1
        // until we reach 21.
        'Render: 0',
        'Render: 10',
        'Render: 11',
        'Render: 21',
        21,
      ]);
      expect(wrapper.text()).toEqual('21');

      // Test that it works on update, too. This time the log is a bit different
      // because we started with reducerB instead of reducerA.
      counter.current.dispatch('reset');
      expect(logger.flush()).toEqual(['Render: 0', 'Render: 1', 'Render: 11', 'Render: 12', 'Render: 22', 22]);
      expect(wrapper.text()).toEqual('22');
    });
  });

  describe('useReducer', () => {
    it('simple mount and update', () => {
      const INCREMENT = 'INCREMENT';
      const DECREMENT = 'DECREMENT';

      function reducer(state, action) {
        switch (action) {
          case 'INCREMENT':
            return state + 1;
          case 'DECREMENT':
            return state - 1;
          default:
            return state;
        }
      }

      let Counter = withHooks((props, ref) => {
        const [count, dispatch] = useReducer(reducer, 0);
        useImperativeMethods(ref, () => ({ dispatch }));
        return <Text text={'Count: ' + count} />;
      });
      Counter = forwardRef(Counter);
      const counter = React.createRef(null);
      const App = () => <Counter ref={counter} />;
      const wrapper = mount(<App />);
      expect(wrapper.text()).toEqual('Count: 0');

      counter.current.dispatch(INCREMENT);
      expect(wrapper.text()).toEqual('Count: 1');

      counter.current.dispatch(DECREMENT);
      counter.current.dispatch(DECREMENT);
      counter.current.dispatch(DECREMENT);
      expect(wrapper.text()).toEqual('Count: -2');
    });

    it('accepts an initial action', () => {
      const INCREMENT = 'INCREMENT';
      const DECREMENT = 'DECREMENT';

      function reducer(state, action) {
        switch (action) {
          case 'INITIALIZE':
            return 10;
          case 'INCREMENT':
            return state + 1;
          case 'DECREMENT':
            return state - 1;
          default:
            return state;
        }
      }

      const initialAction = 'INITIALIZE';

      let Counter = withHooks((props, ref) => {
        const [count, dispatch] = useReducer(reducer, 0, initialAction);
        useImperativeMethods(ref, () => ({ dispatch }));
        return <Text text={'Count: ' + count} />;
      });
      Counter = forwardRef(Counter);
      const counter = React.createRef(null);
      const App = () => <Counter ref={counter} />;
      const wrapper = mount(<App />);
      expect(wrapper.text()).toEqual('Count: 10');

      counter.current.dispatch(INCREMENT);
      expect(wrapper.text()).toEqual('Count: 11');

      counter.current.dispatch(DECREMENT);
      counter.current.dispatch(DECREMENT);
      counter.current.dispatch(DECREMENT);
      expect(wrapper.text()).toEqual('Count: 8');
    });
  });

  describe('useEffect', () => {
    it('simple mount and update', () => {
      const Counter = withHooks(props => {
        useEffect(() => {
          logger.log(`Did commit [${props.count}]`);
        });
        return <Text text={'Count: ' + props.count} />;
      });
      const wrapper = mount(<Counter count={0} />);
      expect(wrapper.text()).toEqual('Count: 0');
      expect(logger.flush()).toEqual(['Count: 0', 'Did commit [0]']);

      wrapper.setProps({ count: 1 });
      expect(wrapper.text()).toEqual('Count: 1');
      expect(logger.flush()).toEqual(['Count: 1', 'Did commit [1]']);
    });

    it('unmounts previous effect', () => {
      const Counter = withHooks(props => {
        useEffect(() => {
          logger.log(`Did create [${props.count}]`);
          return () => {
            logger.log(`Did destroy [${props.count}]`);
          };
        });
        return <Text text={'Count: ' + props.count} />;
      });
      const wrapper = mount(<Counter count={0} />);
      expect(wrapper.text()).toEqual('Count: 0');
      expect(logger.flush()).toEqual(['Count: 0', 'Did create [0]']);

      wrapper.setProps({ count: 1 });
      expect(wrapper.text()).toEqual('Count: 1');
      expect(logger.flush()).toEqual(['Count: 1', 'Did destroy [0]', 'Did create [1]']);
    });

    it('unmounts on deletion', () => {
      const Counter = withHooks(props => {
        useEffect(() => {
          logger.log(`Did create [${props.count}]`);
          return () => {
            logger.log(`Did destroy [${props.count}]`);
          };
        });
        return <Text text={'Count: ' + props.count} />;
      });
      const wrapper = mount(<Counter count={0} />);
      expect(wrapper.text()).toEqual('Count: 0');
      expect(logger.flush()).toEqual(['Count: 0', 'Did create [0]']);

      wrapper.unmount();
      expect(logger.flush()).toEqual(['Did destroy [0]']);
    });

    it('unmounts on deletion after skipped effect', () => {
      const Counter = withHooks(props => {
        useEffect(() => {
          logger.log(`Did create [${props.count}]`);
          return () => {
            logger.log(`Did destroy [${props.count}]`);
          };
        }, []);
        return <Text text={'Count: ' + props.count} />;
      });
      const wrapper = mount(<Counter count={0} />);
      expect(wrapper.text()).toEqual('Count: 0');
      expect(logger.flush()).toEqual(['Count: 0', 'Did create [0]']);

      wrapper.setProps({ count: 1 });
      expect(wrapper.text()).toEqual('Count: 1');
      expect(logger.flush()).toEqual(['Count: 1']);

      wrapper.unmount();
      expect(logger.flush()).toEqual(['Did destroy [0]']);
    });

    it('skips effect if constructor has not changed', () => {
      function effect() {
        logger.log(`Did mount`);
        return () => {
          logger.log(`Did unmount`);
        };
      }
      const Counter = withHooks(props => {
        useEffect(effect);
        return <Text text={'Count: ' + props.count} />;
      });
      const wrapper = mount(<Counter count={0} />);
      expect(wrapper.text()).toEqual('Count: 0');
      expect(logger.flush()).toEqual(['Count: 0', 'Did mount']);

      wrapper.setProps({ count: 1 });
      // No effect, because constructor was hoisted outside render
      expect(logger.flush()).toEqual(['Count: 1']);
      expect(wrapper.text()).toEqual('Count: 1');

      wrapper.unmount();
      expect(logger.flush()).toEqual(['Did unmount']);
    });

    it('skips effect if inputs have not changed', () => {
      const Counter = withHooks(props => {
        const text = `${props.label}: ${props.count}`;
        useEffect(
          () => {
            logger.log(`Did create [${text}]`);
            return () => {
              logger.log(`Did destroy [${text}]`);
            };
          },
          [props.label, props.count],
        );
        return <Text text={text} />;
      });
      const wrapper = mount(<Counter label="Count" count={0} />);
      expect(logger.flush()).toEqual(['Count: 0', 'Did create [Count: 0]']);
      expect(wrapper.text()).toEqual('Count: 0');

      wrapper.setProps({ count: 1 });
      // Count changed
      expect(wrapper.text()).toEqual('Count: 1');
      expect(logger.flush()).toEqual(['Count: 1', 'Did destroy [Count: 0]', 'Did create [Count: 1]']);

      wrapper.setProps({ count: 1 });
      // Nothing changed, so no effect should have fired
      expect(logger.flush()).toEqual(['Count: 1']);
      expect(wrapper.text()).toEqual('Count: 1');

      wrapper.setProps({ label: 'Total' });
      // Label changed
      expect(wrapper.text()).toEqual('Total: 1');
      expect(logger.flush()).toEqual(['Total: 1', 'Did destroy [Count: 1]', 'Did create [Total: 1]']);
    });

    it('multiple effects', () => {
      const Counter = withHooks(props => {
        useEffect(() => {
          logger.log(`Did commit 1 [${props.count}]`);
        });
        useEffect(() => {
          logger.log(`Did commit 2 [${props.count}]`);
        });
        return <Text text={'Count: ' + props.count} />;
      });
      const wrapper = mount(<Counter count={0} />);
      expect(wrapper.text()).toEqual('Count: 0');
      expect(logger.flush()).toEqual(['Count: 0', 'Did commit 1 [0]', 'Did commit 2 [0]']);

      wrapper.setProps({ count: 1 });
      expect(wrapper.text()).toEqual('Count: 1');
      expect(logger.flush()).toEqual(['Count: 1', 'Did commit 1 [1]', 'Did commit 2 [1]']);
    });

    it('unmounts all previous effects before creating any new ones', () => {
      const Counter = withHooks(props => {
        useEffect(() => {
          logger.log(`Mount A [${props.count}]`);
          return () => {
            logger.log(`Unmount A [${props.count}]`);
          };
        });
        useEffect(() => {
          logger.log(`Mount B [${props.count}]`);
          return () => {
            logger.log(`Unmount B [${props.count}]`);
          };
        });
        return <Text text={'Count: ' + props.count} />;
      });
      const wrapper = mount(<Counter count={0} />);
      expect(wrapper.text()).toEqual('Count: 0');
      expect(logger.flush()).toEqual(['Count: 0', 'Mount A [0]', 'Mount B [0]']);

      wrapper.setProps({ count: 1 });
      expect(wrapper.text()).toEqual('Count: 1');
      expect(logger.flush()).toEqual(['Count: 1', 'Unmount A [0]', 'Unmount B [0]', 'Mount A [1]', 'Mount B [1]']);
    });

    it.skip('handles errors on mount', () => {
      const Counter = withHooks(props => {
        useEffect(() => {
          logger.log(`Mount A [${props.count}]`);
          return () => {
            logger.log(`Unmount A [${props.count}]`);
          };
        });
        useEffect(() => {
          logger.log('Oops!');
          throw new Error('Oops!');
          // eslint-disable-next-line no-unreachable
          logger.log(`Mount B [${props.count}]`);
          return () => {
            logger.log(`Unmount B [${props.count}]`);
          };
        });
        return <Text text={'Count: ' + props.count} />;
      });
      expect(() => {
        mount(<Counter count={0} />);
      }).toThrow('Oops');
      expect(logger.flush()).toEqual([
        'Count: 0',
        'Mount A [0]',
        'Oops!',
        // Clean up effect A. There's no effect B to clean-up, because it
        // never mounted.
        'Unmount A [0]',
      ]);
    });

    it.skip('handles errors on update', () => {
      const Counter = withHooks(props => {
        useEffect(() => {
          logger.log(`Mount A [${props.count}]`);
          return () => {
            logger.log(`Unmount A [${props.count}]`);
          };
        });
        useEffect(() => {
          if (props.count === 1) {
            logger.log('Oops!');
            throw new Error('Oops!');
          }
          logger.log(`Mount B [${props.count}]`);
          return () => {
            logger.log(`Unmount B [${props.count}]`);
          };
        });
        return <Text text={'Count: ' + props.count} />;
      });
      const wrapper = mount(<Counter count={0} />);
      expect(wrapper.text()).toEqual('Count: 0');
      expect(logger.flush()).toEqual(['Count: 0', 'Mount A [0]', 'Mount B [0]']);

      // This update will trigger an errror
      expect(() => wrapper.setProps({ count: 1 })).toThrow('Oops');
      expect(logger.flush()).toEqual([
        'Count: 1',
        'Unmount A [0]',
        'Unmount B [0]',
        'Mount A [1]',
        'Oops!',
        // Clean up effect A. There's no effect B to clean-up, because it
        // never mounted.
        'Unmount A [1]',
      ]);
    });

    it.skip('handles errors on unmount', () => {
      const Counter = withHooks(props => {
        useEffect(() => {
          logger.log(`Mount A [${props.count}]`);
          return () => {
            logger.log('Oops!');
            throw new Error('Oops!');
            // eslint-disable-next-line no-unreachable
            logger.log(`Unmount A [${props.count}]`);
          };
        });
        useEffect(() => {
          logger.log(`Mount B [${props.count}]`);
          return () => {
            logger.log(`Unmount B [${props.count}]`);
          };
        });
        return <Text text={'Count: ' + props.count} />;
      });
      const wrapper = mount(<Counter count={0} />);
      expect(wrapper.text()).toEqual('Count: 0');
      expect(logger.flush()).toEqual(['Count: 0', 'Mount A [0]', 'Mount B [0]']);

      // This update will trigger an error
      expect(() => wrapper.unmount()).toThrow('Oops');
      expect(logger.flush()).toEqual([
        'Count: 1',
        'Oops!',
        // B unmounts even though an error was thrown in the previous effect
        'Unmount B [0]',
      ]);
    });

    it.skip('works with memo', () => {
      let Counter = withHooks(({ count }) => {
        useLayoutEffect(() => {
          logger.log('Mount: ' + count);
          return () => logger.log('Unmount: ' + count);
        });
        return <Text text={'Count: ' + count} />;
      });
      Counter = memo(Counter);

      const wrapper = mount(<Counter count={0} />);
      expect(logger.flush()).toEqual(['Count: 0', 'Mount: 0']);
      expect(wrapper.text()).toEqual([span('Count: 0')]);

      wrapper.setProps({ count: 1 });
      expect(logger.flush()).toEqual(['Count: 1', 'Unmount: 0', 'Mount: 1']);
      expect(wrapper.text()).toEqual([span('Count: 1')]);

      wrapper.unmount();
      expect(logger.flush()).toEqual(['Unmount: 1']);
      expect(wrapper.text()).toEqual([]);
    });
  });

  describe('useCallback', () => {
    it('memoizes callback by comparing inputs', () => {
      class IncrementButton extends React.PureComponent {
        increment = () => {
          this.props.increment();
        };

        render() {
          return <Text text="Increment" />;
        }
      }

      const Counter = withHooks(({ incrementBy }) => {
        const [count, updateCount] = useState(0);
        const increment = useCallback(() => updateCount(c => c + incrementBy), [incrementBy]);
        return (
          <div>
            <IncrementButton increment={increment} ref={button} />
            <Text text={'Count: ' + count} />
          </div>
        );
      });

      const button = React.createRef(null);
      const wrapper = mount(<Counter incrementBy={1} />);
      expect(logger.flush()).toEqual(['Increment', 'Count: 0']);

      button.current.increment();
      expect(logger.flush()).toEqual([
        // Button should not re-render, because its props haven't changed
        // 'Increment',
        'Count: 1',
      ]);
      expect(wrapper.text()).toEqual('IncrementCount: 1');

      // Increase the increment amount
      wrapper.setProps({ incrementBy: 10 });
      expect(logger.flush()).toEqual(['Increment', 'Count: 1']);

      // Callback should have updated
      button.current.increment();
      expect(logger.flush()).toEqual(['Count: 11']);
      expect(wrapper.text()).toEqual('IncrementCount: 11');
    });
  });

  describe('useMemo', () => {
    it('memoizes value by comparing to previous inputs', () => {
      const CapitalizedText = withHooks(props => {
        const text = props.text;
        const capitalizedText = useMemo(
          () => {
            logger.log(`Capitalize '${text}'`);
            return text.toUpperCase();
          },
          [text],
        );
        return <Text text={capitalizedText} />;
      });

      const wrapper = mount(<CapitalizedText text="hello" />);
      expect(logger.flush()).toEqual(["Capitalize 'hello'", 'HELLO']);
      expect(wrapper.text()).toEqual('HELLO');

      wrapper.setProps({ text: 'hi' });
      expect(logger.flush()).toEqual(["Capitalize 'hi'", 'HI']);
      expect(wrapper.text()).toEqual('HI');

      wrapper.setProps({ text: 'hi' });
      expect(logger.flush()).toEqual(['HI']);
      expect(wrapper.text()).toEqual('HI');

      wrapper.setProps({ text: 'goodbye' });
      expect(logger.flush()).toEqual(["Capitalize 'goodbye'", 'GOODBYE']);
      expect(wrapper.text()).toEqual('GOODBYE');
    });

    it('compares function if no inputs are provided', () => {
      const LazyCompute = withHooks(props => {
        const computed = useMemo(props.compute);
        return <Text text={computed} />;
      });

      function computeA() {
        logger.log('compute A');
        return 'A';
      }

      function computeB() {
        logger.log('compute B');
        return 'B';
      }

      const wrapper = mount(<LazyCompute compute={computeA} />);
      expect(logger.flush()).toEqual(['compute A', 'A']);

      wrapper.setProps({});
      expect(logger.flush()).toEqual(['A']);

      wrapper.setProps({});
      expect(logger.flush()).toEqual(['A']);

      wrapper.setProps({ compute: computeB });
      expect(logger.flush()).toEqual(['compute B', 'B']);
    });

    it('should not invoke memoized function during re-renders unless inputs change', () => {
      const LazyCompute = withHooks(props => {
        const computed = useMemo(() => props.compute(props.input), [props.input]);
        const [count, setCount] = useState(0);
        if (count < 3) {
          setCount(count + 1);
        }
        return <Text text={computed} />;
      });

      function compute(val) {
        logger.log('compute ' + val);
        return val;
      }

      const wrapper = mount(<LazyCompute compute={compute} input="A" />);
      expect(logger.flush()).toEqual(['compute A', 'A']);

      wrapper.setProps({});
      expect(logger.flush()).toEqual(['A']);

      wrapper.setProps({ input: 'B' });
      expect(logger.flush()).toEqual(['compute B', 'B']);
    });
  });

  describe('useRef', () => {
    it('creates a ref object initialized with the provided value', () => {
      jest.useFakeTimers();

      function useDebouncedCallback(callback, ms, inputs) {
        const timeoutID = useRef(-1);
        useEffect(() => {
          return function unmount() {
            clearTimeout(timeoutID.current);
          };
        }, []);
        const debouncedCallback = useCallback(
          (...args) => {
            clearTimeout(timeoutID.current);
            timeoutID.current = setTimeout(callback, ms, ...args);
          },
          [callback, ms],
        );
        return useCallback(debouncedCallback, inputs);
      }

      let ping;
      const App = withHooks(() => {
        ping = useDebouncedCallback(
          value => {
            logger.log('ping: ' + value);
          },
          100,
          [],
        );
        return null;
      });

      const wrapper = mount(<App />);
      expect(logger.flush()).toEqual([]);

      ping(1);
      ping(2);
      ping(3);

      expect(logger.flush()).toEqual([]);

      jest.advanceTimersByTime(100);

      expect(logger.flush()).toEqual(['ping: 3']);

      ping(4);
      jest.advanceTimersByTime(20);
      ping(5);
      ping(6);
      jest.advanceTimersByTime(80);

      expect(logger.flush()).toEqual([]);

      jest.advanceTimersByTime(20);
      expect(logger.flush()).toEqual(['ping: 6']);
    });

    it('should return the same ref during re-renders', () => {
      const Counter = withHooks(() => {
        const ref = useRef('val');
        const [count, setCount] = useState(0);
        const [firstRef] = useState(ref);

        if (firstRef !== ref) {
          throw new Error('should never change');
        }

        if (count < 3) {
          setCount(count + 1);
        }

        return <Text text={ref.current} />;
      });

      const wrapper = mount(<Counter />);
      expect(logger.flush()).toEqual(['val']);

      wrapper.setProps();
      expect(logger.flush()).toEqual(['val']);
    });
  });

  describe('progressive enhancement', () => {
    it.skip('mount additional state', () => {
      let updateA;
      let updateB;
      let updateC;

      const App = withHooks(props => {
        const [A, _updateA] = useState(0);
        const [B, _updateB] = useState(0);
        updateA = _updateA;
        updateB = _updateB;

        let C;
        if (props.loadC) {
          const [_C, _updateC] = useState(0);
          C = _C;
          updateC = _updateC;
        } else {
          C = '[not loaded]';
        }
        console.log('B', B);

        return <Text text={`A: ${A}, B: ${B}, C: ${C}`} />;
      });

      const wrapper = mount(<App loadC={false} />);
      expect(logger.flush()).toEqual(['A: 0, B: 0, C: [not loaded]']);
      expect(wrapper.text()).toEqual('A: 0, B: 0, C: [not loaded]');

      updateA(2);
      updateB(3);
      console.log('UpdatedB');
      // expect(logger.flush()).toEqual(['A: 2, B: 3, C: [not loaded]']);
      expect(wrapper.text()).toEqual('A: 2, B: 3, C: [not loaded]');

      wrapper.setProps({ loadC: true });
      expect(logger.flush()).toEqual(['A: 2, B: 3, C: 0']);
      expect(wrapper.text()).toEqual('A: 2, B: 3, C: 0');

      updateC(4);
      expect(logger.flush()).toEqual(['A: 2, B: 3, C: 4']);
      expect(wrapper.text()).toEqual('A: 2, B: 3, C: 4');
    });

    it.skip('unmount state', () => {
      let updateA;
      let updateB;
      let updateC;

      const App = withHooks(props => {
        const [A, _updateA] = useState(0);
        const [B, _updateB] = useState(0);
        updateA = _updateA;
        updateB = _updateB;

        let C;
        if (props.loadC) {
          const [_C, _updateC] = useState(0);
          C = _C;
          updateC = _updateC;
        } else {
          C = '[not loaded]';
        }

        return <Text text={`A: ${A}, B: ${B}, C: ${C}`} />;
      });

      const wrapper = mount(<App loadC={true} />);
      expect(logger.flush()).toEqual(['A: 0, B: 0, C: 0']);
      expect(wrapper.text()).toEqual('A: 0, B: 0, C: 0');

      updateA(2);
      updateB(3);
      updateC(4);
      expect(logger.flush()).toEqual(['A: 2, B: 3, C: 4']);
      expect(wrapper.text()).toEqual('A: 2, B: 3, C: 4');
      expect(() => {
        wrapper.setProps({ loadC: false });
      }).toThrow(
        'Rendered fewer hooks than expected. This may be caused by an ' + 'accidental early return statement.',
      );
    });

    it.skip('unmount effects', () => {
      const App = withHooks(props => {
        useEffect(() => {
          logger.log('Mount A');
          return () => {
            logger.log('Unmount A');
          };
        }, []);

        if (props.showMore) {
          useEffect(() => {
            logger.log('Mount B');
            return () => {
              logger.log('Unmount B');
            };
          }, []);
        }

        return null;
      });

      const wrapper = mount(<App showMore={false} />);
      expect(logger.flush()).toEqual(['Mount A']);

      wrapper.setProps({ showMore: true });
      expect(logger.flush()).toEqual(['Mount B']);

      expect(() => {
        wrapper.setProps({ showMore: false });
      }).toThrow(
        'Rendered fewer hooks than expected. This may be caused by an ' + 'accidental early return statement.',
      );
    });
  });

  describe('useContext', () => {
    it('simple use', () => {
      const CounterContext = createContext();
      const Counter = withHooks(() => {
        const count = useContext(CounterContext);
        return <div>{count}</div>;
      });
      class Blank extends React.PureComponent {
        render() {
          return this.props.children;
        }
      }
      const App = props => {
        return (
          <CounterContext.Provider value={props.count}>
            <Blank>
              <Counter />
            </Blank>
          </CounterContext.Provider>
        );
      };
      const wrapper = mount(<App count={0} />);
      expect(wrapper.text()).toBe('0');
      wrapper.setProps({ count: 1 });
      expect(wrapper.text()).toBe('1');
    });

    it('works with shouldComponentUpdate', () => {
      const CounterContext = createContext(0);
      const Counter = withHooks(() => {
        const count = useContext(CounterContext);
        return <div>{count}</div>;
      });
      class Blank extends React.PureComponent {
        render() {
          return <Counter />;
        }
      }
      let updateCount;
      const App = withHooks(() => {
        const [count, _updateCount] = useState(0);
        updateCount = _updateCount;
        return (
          <CounterContext.Provider value={count}>
            <Blank />
          </CounterContext.Provider>
        );
      });
      const wrapper = mount(<App />);
      expect(wrapper.text()).toBe('0');
      updateCount(1);
      expect(wrapper.text()).toBe('1');
    });
  });
});
