import * as schema from "./db/auth-schema";

import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";
import { db } from "./db";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
	appName: "Trashvault",
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
	}),
	emailAndPassword: {
		enabled: true,
	},
	plugins: [
		twoFactor({
			issuer: "Trashvault",
		}),
	],
	trustedOrigins: ["http://localhost:5173"],
	session: {
		expiresIn: 60 * 60 * 24 * 7,
		updateAge: 60 * 15,
	},
	advanced: {
		defaultCookieAttributes: {
			sameSite: 'lax',
			secure: false,
		},
	},
});
