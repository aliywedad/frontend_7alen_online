import Swal from 'sweetalert2'

/* Pre-styled Swal instance — matches admin brand colours */
const S = Swal.mixin({
  buttonsStyling: false,
  customClass: {
    popup:          'swal-popup',
    title:          'swal-title',
    htmlContainer:  'swal-html',
    confirmButton:  'swal-btn swal-btn-confirm',
    cancelButton:   'swal-btn swal-btn-cancel',
    denyButton:     'swal-btn swal-btn-deny',
    input:          'swal-input',
    icon:           'swal-icon',
  },
})

/* Confirm a destructive action (delete / block / etc.) */
export async function confirmDelete(
  title: string,
  text = 'This action cannot be undone.',
): Promise<boolean> {
  const result = await S.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    focusCancel: true,
    customClass: {
      popup:          'swal-popup swal-delete',
      title:          'swal-title',
      htmlContainer:  'swal-html',
      confirmButton:  'swal-btn swal-btn-confirm',
      cancelButton:   'swal-btn swal-btn-cancel',
      input:          'swal-input',
      icon:           'swal-icon',
    },
  })
  return result.isConfirmed
}

/* Confirm any destructive action with custom button label */
export async function confirmAction(
  title: string,
  text: string,
  confirmText = 'Confirm',
): Promise<boolean> {
  const result = await S.fire({
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    focusCancel: true,
  })
  return result.isConfirmed
}

/* Number/text input dialog — returns the value or null if cancelled */
export async function promptNumber(
  title: string,
  label: string,
  placeholder = '',
): Promise<number | null> {
  const result = await S.fire({
    title,
    html: `<p class="swal-label">${label}</p>`,
    input: 'number',
    inputPlaceholder: placeholder,
    inputAttributes: { step: 'any' },
    showCancelButton: true,
    confirmButtonText: 'Apply',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    inputValidator: (value) => {
      if (!value) return 'Please enter an amount'
      if (Number.isNaN(Number(value)) || Number(value) === 0) return 'Enter a non-zero number'
      return null
    },
  })
  if (result.isConfirmed && result.value !== undefined) return Number(result.value)
  return null
}

export async function promptText(
  title: string,
  label: string,
  placeholder = '',
): Promise<string | null> {
  const result = await S.fire({
    title,
    html: `<p class="swal-label">${label}</p>`,
    input: 'text',
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonText: 'OK',
    cancelButtonText: 'Cancel',
    reverseButtons: true,
  })
  if (result.isConfirmed && result.value) return result.value as string
  return null
}
