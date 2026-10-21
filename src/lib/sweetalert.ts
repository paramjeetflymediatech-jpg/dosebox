import Swal from 'sweetalert2';

// Base SweetAlert2 instance with DoseBox theme
export const DoseAlert = Swal.mixin({
  confirmButtonColor: '#108098',
  cancelButtonColor: '#64748b',
  customClass: {
    popup: 'rounded-2xl shadow-2xl font-sans !p-6 border border-slate-100',
    title: 'text-slate-900 font-bold text-lg sm:text-xl !pt-2',
    htmlContainer: 'text-slate-600 text-sm leading-relaxed !mt-2',
    confirmButton: 'rounded-xl px-5 py-2.5 font-semibold text-sm shadow-sm transition-all !bg-[#108098] hover:!bg-[#0c6b80]',
    cancelButton: 'rounded-xl px-5 py-2.5 font-semibold text-sm shadow-sm transition-all !bg-slate-500 hover:!bg-slate-600',
  },
});

/**
 * Center screen popup when medicine is added to cart
 */
export const showAddedToCart = (medicineName: string, onViewCart?: () => void) => {
  return DoseAlert.fire({
    icon: 'success',
    title: 'Added to Cart!',
    text: `${medicineName} added to cart!`,
    showCancelButton: true,
    confirmButtonText: 'View Cart',
    cancelButtonText: 'Continue Shopping',
    timer: 3500,
    timerProgressBar: true,
    position: 'center',
    buttonsStyling: true,
  }).then((result) => {
    if (result.isConfirmed && onViewCart) {
      onViewCart();
    }
    return result;
  });
};

/**
 * Center screen popup when user must sign in to proceed with checkout
 */
export const showSignInRequired = (
  message = 'Please sign in to proceed with checkout.',
  onSignIn?: () => void
) => {
  return DoseAlert.fire({
    icon: 'info',
    title: 'Sign In Required',
    text: message,
    showCancelButton: true,
    confirmButtonText: 'Sign In',
    cancelButtonText: 'Cancel',
    position: 'center',
    buttonsStyling: true,
  }).then((result) => {
    if (result.isConfirmed && onSignIn) {
      onSignIn();
    }
    return result;
  });
};

/**
 * Center screen warning popup (e.g., "Please select a payment method.")
 */
export const showWarning = (title: string, text?: string) => {
  return DoseAlert.fire({
    icon: 'warning',
    title,
    text,
    confirmButtonText: 'OK',
    position: 'center',
    buttonsStyling: true,
  });
};

/**
 * Center screen confirmation popup (e.g., "Are you sure you want to delete this address?")
 */
export const showDeleteConfirm = (
  title = 'Delete Address?',
  text = 'Are you sure you want to delete this address?'
) => {
  return DoseAlert.fire({
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonColor: '#e11d48',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Yes, delete it',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    position: 'center',
    buttonsStyling: true,
  });
};

/**
 * Center screen success popup
 */
export const showSuccess = (title: string, text?: string) => {
  return DoseAlert.fire({
    icon: 'success',
    title,
    text,
    timer: 2000,
    timerProgressBar: true,
    showConfirmButton: false,
    position: 'center',
  });
};

/**
 * Center screen error popup
 */
export const showError = (title: string, text?: string) => {
  return DoseAlert.fire({
    icon: 'error',
    title,
    text,
    confirmButtonText: 'OK',
    position: 'center',
    buttonsStyling: true,
  });
};

export default Swal;
