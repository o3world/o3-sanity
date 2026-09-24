/**
 * Deploy → publish the `default` workspace's schema.
 *
 *   pnpm schema:deploy
 *
 * The workspace is named out loud so a second workspace added to
 * `sanity.config.ts` later cannot be deployed by accident.
 */
import { execFileSync } from 'node:child_process'

execFileSync('pnpm', ['exec', 'sanity', 'schemas', 'deploy', '--workspace', 'default'], {
  stdio: 'inherit',
})
