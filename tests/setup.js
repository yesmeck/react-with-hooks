import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

window.requestAnimationFrame = (() => {
  const pendingWorks = [];
  const impl = callback => {
    pendingWorks.push(callback);
  };
  impl.flush = () => {
    console.log(pendingWorks);
    let work = pendingWorks.shift();
    while (work !== undefined) {
      work();
      work = pendingWorks.shift();
    }
  };
  return impl;
})();
