import pino from "pino"
import { env } from "./env"

export const logger = pino({ prettyPrint: env.isDev })
