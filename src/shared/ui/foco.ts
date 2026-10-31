/** Depois de uma validação que falhou, leva o foco ao primeiro campo marcado como inválido. */
export function focarPrimeiroInvalido(form: HTMLFormElement | null) {
  setTimeout(() => form?.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalido] input')?.focus());
}

