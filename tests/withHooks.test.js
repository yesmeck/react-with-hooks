import React, { createContext } from 'react';
import { mount } from 'enzyme';
import withHooks, { useState, useEffect, useContext } from '../src';

test('useState', () => {
  const Counter = withHooks(() => {
    const [count, setCount] = useState(0);
    return (
      <div>
        <div className="count">{count}</div>
        <button onClick={() => setCount(count + 1)}>+</button>
      </div>
    );
  });
  const wrapper = mount(<Counter />);
  expect(wrapper.find('.count').text()).toBe('0');
  wrapper.find('button').simulate('click');
  expect(wrapper.find('.count').text()).toBe('1');
});

test('useState with initial function ', () => {
  const Counter = withHooks(() => {
    const [count] = useState(() => 0);
    return <div>{count}</div>;
  });
  const wrapper = mount(<Counter />);
  expect(wrapper.text()).toBe('0');
});

test('useEffect', () => {
  let count = 0;
  const Counter = withHooks(() => {
    useEffect(() => {
      count++;
    });
    return <div>{count}</div>;
  });
  const wrapper = mount(<Counter />);
  expect(count).toBe(1);
  wrapper.setState({});
  expect(count).toBe(2);
});

test('useEffect clean up', () => {
  let count = 0;
  const Counter = withHooks(() => {
    useEffect(() => {
      count++;
      return () => {
        count = 5;
      };
    });
    return <div>{count}</div>;
  });
  const wrapper = mount(<Counter />);
  expect(count).toBe(1);
  wrapper.setState({});
  expect(count).toBe(6);
  wrapper.unmount();
  expect(count).toBe(5);
});

test('useEffect deps', () => {
  let count = 0;
  const Counter = withHooks((props) => {
    useEffect(() => {
      count += props.step;
    }, [props.step]);
    return <div>{count}</div>;
  });
  const wrapper = mount(<Counter step={1} />);
  expect(count).toBe(1);
  wrapper.setState({});
  expect(count).toBe(1);
  wrapper.setProps({ step: 2 });
  expect(count).toBe(3);
});

test('useEffect empty deps', () => {
  let count = 0;
  const Counter = withHooks(() => {
    useEffect(() => {
      count++;
    }, []);
    return <div>{count}</div>;
  });
  const wrapper = mount(<Counter />);
  expect(count).toBe(1);
  wrapper.setState({});
  expect(count).toBe(1);
});

test('useContext', () => {
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
  const App = (props) => {
    return (
      <CounterContext.Provider value={props.count}>
        <Blank>
          <Counter />
        </Blank>
      </CounterContext.Provider>
    );
  }
  const wrapper = mount(<App count={0} />);
  expect(wrapper.text()).toBe('0');
  wrapper.setProps({ count: 1 });
  expect(wrapper.text()).toBe('1');
});
