import { query } from "./_generated/server";

export const whoami = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required.");
    }

    return {
      subject: identity.subject,
      issuer: identity.issuer,
      email: identity.email ?? null,
    };
  },
});
