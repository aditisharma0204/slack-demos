import { registerValidator } from '../validatorRegistry'
import { validateModalOpen, validateModalSubmit } from './modalValidator'

export function registerBuiltInValidators(): void {
  registerValidator(validateModalOpen)
  registerValidator(validateModalSubmit)
}
