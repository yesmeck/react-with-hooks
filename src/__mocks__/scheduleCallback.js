let pendingWorks = [];

const scheduleCallback = callback => {
  pendingWorks.push(callback);
  return () => {
    pendingWorks = pendingWorks.filter(cb => cb === callback);
  };
};

scheduleCallback.flush = () => {
  let work = pendingWorks.shift();
  while (work !== undefined) {
    work();
    work = pendingWorks.shift();
  }
};

export default scheduleCallback;
