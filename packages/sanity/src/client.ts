import { createClient, type ClientConfig } from '@sanity/client'
import { resolveDataset, resolveProjectId } from './brand'

export const clientConfig = {
  projectId: resolveProjectId(),
  dataset: resolveDataset(),
  apiVersion: '2026-07-01',
  useCdn: true,
} satisfies ClientConfig

export function getClient(overrides?: Partial<ClientConfig>) {
  return createClient({ ...clientConfig, ...overrides })
}
