import { ReportHandler } from 'web-vitals';

/**
 * Reports the web vital metrics to the provided handler.
 * This function dynamically imports the 'web-vitals' library and calls all the
 * individual metric getters with the provided callback.
 * @param {ReportHandler} [onPerfEntry] - The callback function to handle the performance entry.
 * If not provided, or not a function, the function does nothing.
 */
const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
