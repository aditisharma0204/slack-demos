import { registerStepType } from '../stepTypeRegistry'
import { surfaceStepType } from './surface'
import { userMessageStepType } from './userMessage'
import { appMessageStepType } from './appMessage'
import { userActionStepType } from './userAction'
import { modalOpenStepType } from './modalOpen'
import { modalSubmitStepType } from './modalSubmit'
import { threadReplyStepType } from './threadReply'
import { botTypingStepType } from './botTyping'

export function registerBuiltInStepTypes(): void {
  registerStepType(surfaceStepType)
  registerStepType(userMessageStepType)
  registerStepType(appMessageStepType)
  registerStepType(userActionStepType)
  registerStepType(modalOpenStepType)
  registerStepType(modalSubmitStepType)
  registerStepType(threadReplyStepType)
  registerStepType(botTypingStepType)
}
