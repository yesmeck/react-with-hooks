const pendingWorks = [];

const scheduleCallback = callback => {
  pendingWorks.push(callback);
};

scheduleCallback.flush = () => {
  let work = pendingWorks.shift();
  while (work !== undefined) {
    work();
    work = pendingWorks.shift();
  }
};

export default scheduleCallback;
