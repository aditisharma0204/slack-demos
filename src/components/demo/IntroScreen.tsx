interface IntroScreenProps {
  prototypeName: string
  instructions?: string
}

export function IntroScreen({
  prototypeName,
  instructions = 'Use ← and → arrow keys to navigate. Or click anywhere to advance.',
}: IntroScreenProps) {
  return (
    <div className="fixed inset-0 bg-purple-900 flex flex-col items-center justify-center p-8 z-50">
      <h1 className="text-3xl font-bold text-white text-center mb-4">
        {prototypeName}
      </h1>
      <p className="text-purple-200 text-center mb-6 max-w-md">
        {instructions}
      </p>
      <p className="text-purple-300 text-sm">
        Press → or click to begin
      </p>
    </div>
  )
}
