import type { CorpusWrite } from './corpus/commands'
import type { CorpusDocument } from './corpus/plan'

/**
 * The part of a Sanity transaction a corpus sync uses. Structural, so the plan
 * side of the tool stays free of the client and this file is the only place
 * that knows what a write turns into.
 */
type CorpusTransaction = {
  createOrReplace: (document: CorpusDocument) => unknown
  createIfNotExists: (document: CorpusDocument) => unknown
  patch: (id: string, operations: { set: Record<string, unknown> }) => unknown
  delete: (id: string) => unknown
}

/**
 * One translation from a plan's writes to client calls, shared by both syncs —
 * so a write op cannot be honoured by one command and silently dropped by the
 * other.
 */
export function commitWrites(tx: CorpusTransaction, writes: readonly CorpusWrite[]): void {
  for (const write of writes) {
    switch (write.op) {
      case 'createOrReplace':
        tx.createOrReplace(write.document)
        break
      case 'createIfNotExists':
        tx.createIfNotExists(write.document)
        break
      case 'patch':
        tx.patch(write._id, { set: write.set })
        break
      case 'delete':
        tx.delete(write._id)
        break
    }
  }
}
