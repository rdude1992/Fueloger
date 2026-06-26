// FuelLog — Receipt OCR Worker
// Runs Tesseract.js in a dedicated thread to keep UI responsive

self.importScripts('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');

self.addEventListener('message', async (e) => {
  const { type, imageDataUrl, id } = e.data;

  if (type === 'recognize') {
    try {
      self.postMessage({ type: 'progress', id, status: 'Initializing OCR engine…', pct: 0 });

      const worker = await Tesseract.createWorker('eng', 1, {
        logger: m => {
          if (m.status) {
            self.postMessage({ type: 'progress', id, status: m.status, pct: Math.round(m.progress * 100) });
          }
        }
      });

      self.postMessage({ type: 'progress', id, status: 'Running OCR…', pct: 50 });

      const { data: { text } } = await worker.recognize(imageDataUrl);

      await worker.terminate();

      self.postMessage({ type: 'result', id, text });
    } catch (err) {
      self.postMessage({ type: 'error', id, error: err.message });
    }
  }
});