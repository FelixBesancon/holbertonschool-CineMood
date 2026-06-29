/**
 * recommendations.ts — API calls for the two-step recommendation flow.
 *
 * Usage:
 *   import { discover, refine } from '@/services/recommendations'
 */

import api from './api'
import type {
  DiscoverRequest,
  DiscoverResponse,
  RefineRequest,
  RecommendationResponse,
} from '@/types/api'

export async function discover(request: DiscoverRequest): Promise<DiscoverResponse> {
  const { data } = await api.post('/recommendations/discover', request)
  return data
}

export async function refine(request: RefineRequest): Promise<RecommendationResponse> {
  const { data } = await api.post('/recommendations/refine', request)
  return data
}
