import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

import bcrypt from "bcryptjs";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {  
        enabled: true,
        password: {
            hash: async (password) => {
                return await bcrypt.hash(password, 10);
            },
            verify: async ({ hash, password }) => {
                return await bcrypt.compare(password, hash);
            }
        }
    },
    trustedOrigins: ["https://invoices.senovate.cloud"],
});
