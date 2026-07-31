import { createClient, type ClientConfig } from '@sanity/client'
import { PROJECT_ID } from './constants'

export const clientConfig = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2026-07-01',
  useCdn: true,
} satisfies ClientConfig

export function getClient(overrides?: Partial<ClientConfig>) {
  return createClient({ ...clientConfig, ...overrides })
}
