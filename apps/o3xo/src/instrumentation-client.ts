import { initBotId } from 'botid/client/core'

/**
 * BotID's client challenge, on the one path that accepts a submission: the
 * contact form's route. It attaches the headers `checkBotId` reads on the
 * server, so a path missing here is a path whose check cannot classify
 * anything.
 *
 * Basic only. Deep Analysis is a paid toggle in the Firewall dashboard and is
 * off.
 */
initBotId({ protect: [{ path: '/api/contact', method: 'POST' }] })
