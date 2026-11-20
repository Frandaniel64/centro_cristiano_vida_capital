// Cada campo con error tiene un <p data-error="<nombre>"> y su input lleva
// aria-describedby apuntando a ese párrafo.

export function mostrarError(form: HTMLFormElement, nombre: string, mensaje: string) {
  const p = form.querySelector<HTMLElement>(`[data-error="${nombre}"]`);
  if (p) {
    p.textContent = mensaje;
    p.hidden = !mensaje;
  }
  form.querySelectorAll<HTMLElement>(`[name="${nombre}"]`).forEach((el) => {
    if (mensaje) el.setAttribute('aria-invalid', 'true');
    else el.removeAttribute('aria-invalid');
  });
}

export function limpiarErrores(form: HTMLFormElement) {
  form.querySelectorAll<HTMLElement>('[data-error]').forEach((p) => {
    p.textContent = '';
    p.hidden = true;
  });
  form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
}

/** Lleva el foco al primer campo con error. */
export function enfocarPrimerError(form: HTMLFormElement) {
  form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
}

export const valorDe = (form: HTMLFormElement, nombre: string) =>
  (form.elements.namedItem(nombre) as HTMLInputElement | RadioNodeList | null)?.value ?? '';
