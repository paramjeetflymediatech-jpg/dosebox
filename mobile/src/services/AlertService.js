/**
 * AlertService acts as a bridge to trigger the CustomAlert Modal from anywhere,
 * including non-React files like api interceptors.
 */

let alertRef;

export const setAlertRef = (ref) => {
  alertRef = ref;
};

export const AlertService = {
  /**
   * Show a custom alert modal
   * @param {Object} options 
   * @param {string} options.title - Alert Title
   * @param {string} options.message - Alert Message
   * @param {'error' | 'success' | 'info' | 'warning'} options.type - Icon/Color Type
   * @param {Array} options.buttons - Array of button objects: { text, onPress, style }
   * @param {boolean} options.cancellable - Whether tapping outside dismisses the modal
   */
  show: (options) => {
    if (alertRef) {
      alertRef.show(options);
    } else {
        console.warn('AlertService: show called before ref was set.', options);
    }
  },
  hide: () => {
    if (alertRef) {
      alertRef.hide();
    }
  }
};
