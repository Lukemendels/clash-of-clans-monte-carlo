import { optimizeBase } from "./optimizer.js";

self.onmessage = (event) => {
  const { base, options } = event.data || {};
  try {
    const result = optimizeBase(base, options, (progress) => self.postMessage({ type:"progress", progress }));
    self.postMessage({ type:"result", result });
  } catch (error) {
    self.postMessage({ type:"error", error: error?.message || String(error) });
  }
};
