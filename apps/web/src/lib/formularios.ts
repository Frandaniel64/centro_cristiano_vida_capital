import type { ContactoTipo } from '@ccvida/shared';

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

const CONTACTO: Record<ContactoTipo, { etiqueta: string; tipo: string; ejemplo: string }> = {
  whatsapp: { etiqueta: 'Tu WhatsApp *', tipo: 'tel', ejemplo: '11 5555 1234' },
  email: { etiqueta: 'Tu email *', tipo: 'email', ejemplo: 'nombre@gmail.com' },
};

/** Conecta el selector WhatsApp/Email con la etiqueta y el tipo del campo de contacto. */
export function conectarContacto(form: HTMLFormElement) {
  const input = form.querySelector<HTMLInputElement>('input[name="contacto"]');
  const etiqueta = form.querySelector<HTMLElement>('[data-etiqueta-contacto]');
  form.querySelectorAll<HTMLInputElement>('input[name="contactoTipo"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      const c = CONTACTO[radio.value as ContactoTipo];
      if (!input || !etiqueta) return;
      etiqueta.textContent = c.etiqueta;
      input.type = c.tipo;
      input.inputMode = c.tipo;
      input.autocomplete = c.tipo as AutoFill;
      input.placeholder = c.ejemplo;
      input.value = '';
      mostrarError(form, 'contacto', '');
    });
  });
}

export const valorDe = (form: HTMLFormElement, nombre: string) =>
  (form.elements.namedItem(nombre) as HTMLInputElement | RadioNodeList | null)?.value ?? '';
