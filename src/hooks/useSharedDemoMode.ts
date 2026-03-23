import { useSearchParams } from 'react-router-dom'
import { isSharedDemoQuery } from '@/utils/sharedDemoLink'

export function useSharedDemoMode(): boolean {
  const [params] = useSearchParams()
  return isSharedDemoQuery(params)
}
