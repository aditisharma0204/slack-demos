interface ClickThroughOverlayProps {
  onNext: () => void
  onBack?: () => void
  /** When false, overlay does not capture clicks (pointer-events: none) so underlying UI can be selected */
  enabled?: boolean
}

export function ClickThroughOverlay({ onNext, enabled = true }: ClickThroughOverlayProps) {
  return (
    <div
      className="absolute top-0 right-0 bottom-0 z-10 cursor-pointer"
      style={{ pointerEvents: enabled ? 'auto' : 'none', left: 'auto' }}
      onClick={onNext}
      aria-label="Click to advance to next step"
    />
  )
}
