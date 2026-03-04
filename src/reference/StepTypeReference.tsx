import { getAllStepTypes } from '@/extensions/stepTypeRegistry'
import { StepTypeCard } from '@/builder/StepTypeCard'

export function StepTypeReference() {
  const stepTypes = getAllStepTypes()

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <p className="text-gray-600 mb-6">
        When you write a story and generate a demo, the app turns your narrative into a sequence of <strong>steps</strong>. Each step has a <strong>type</strong>—for example, a user message, a bot reply, or opening a modal. This page lists every step type you can use. For each one, the card explains <strong>when to use it</strong> (so you pick the right type for each moment in your story), <strong>what fields to fill in</strong>, and a short example. Use this as a reference while writing your story or when editing a demo in the builder.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {stepTypes.map((def) => (
          <StepTypeCard key={def.id} definition={def} />
        ))}
      </div>
    </div>
  )
}
