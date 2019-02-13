export default function scheduleCallback(callback) {
  const timer = requestAnimationFrame(callback);
  return () => {
    cancelAnimationFrame(timer);
  };
}
