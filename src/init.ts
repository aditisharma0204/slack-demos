import { registerBuiltInStepTypes } from '@/extensions/stepTypes'
import { registerBuiltInValidators } from '@/extensions/validators'
import '@/components/chat/templates'

export function initApp(): void {
  registerBuiltInStepTypes()
  registerBuiltInValidators()
}
