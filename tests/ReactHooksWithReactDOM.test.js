import '../src/polyfill';
import React, { forwardRef, useState, useImperativeHandle, useLayoutEffect, useEffect } from 'react';
import { render, cleanup } from 'react-testing-library';
import 'jest-dom/extend-expect';

class Logger {
  yieldedValues = null;

  yield(value) {
    if (this.yieldedValues === null) {
      this.yieldedValues = [value];
    } else {
      this.yieldedValues.push(value);
    }
  }

  flush() {
    const values = this.yieldedValues || [];
    this.yieldedValues = null;
    return values;
  }

  clearYields() {
    const values = this.yieldedValues;
    this.yieldedValues = null;
    return values;
  }
}

let logger;

describe('hooks', () => {
  function Text(props) {
    logger.yield(props.text);
    return <span data-testid="text">{props.text}</span>;
  }

  beforeEach(() => {
    logger = new Logger();
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => setTimeout(cb));
  });

  afterEach(() => {
    cleanup();
    window.requestAnimationFrame.mockRestore();
    jest.clearAllTimers();
  });

  describe('useEffect', () => {
    it('flushes passive effects even with sibling deletions', () => {
      jest.useFakeTimers();
      function LayoutEffect(props) {
        useLayoutEffect(() => {
          logger.yield(`Layout effect`);
        });
        return <Text text="Layout" />;
      }
      function PassiveEffect(props) {
        useEffect(() => {
          logger.yield(`Passive effect`);
        }, []);
        return <Text text="Passive" />;
      }
      let passive = <PassiveEffect key="p" />;
      const { container, rerender } = render([<LayoutEffect key="l" />, passive]);
      expect(logger.flush()).toEqual(['Layout', 'Passive', 'Layout effect']);
      expect(container).toHaveTextContent('LayoutPassive');

      // Destroying the first child shouldn't prevent the passive effect from
      // being executed
      rerender([passive]);
      jest.runAllTimers();
      expect(logger.flush()).toEqual(['Passive effect']);
      expect(container).toHaveTextContent('Passive');

      // (No effects are left to flush.)
      jest.runAllTimers();
      expect(logger.clearYields()).toEqual(null);
    });

    it('flushes passive effects even if siblings schedule an update', () => {
      jest.useFakeTimers();
      function PassiveEffect(props) {
        useEffect(() => {
          debugger
          logger.yield('Passive effect');
        });
        return <Text text="Passive" />;
      }
      function LayoutEffect(props) {
        let [count, setCount] = useState(0);
        useLayoutEffect(() => {
          // Scheduling work shouldn't interfere with the queued passive effect
          if (count === 0) {
            setCount(1);
          }
          logger.yield('Layout effect ' + count);
        });
        return <Text text="Layout" />;
      }

      render([<PassiveEffect key="p" />, <LayoutEffect key="l" />]);

      jest.runAllTimers();

      expect(logger.flush()).toEqual([
        'Passive',
        'Layout',
        'Layout effect 0',
        'Passive effect',
        'Layout',
        'Layout effect 1',
      ]);

      expect(container).toHaveTextContent('PassiveLayout');
    });

  });
});
