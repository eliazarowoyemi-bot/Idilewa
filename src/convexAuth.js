export function createSupabaseTokenFetcher(supabase) {
  if (!supabase?.auth) {
    throw new Error('Supabase Auth is required to connect authenticated requests to Convex.');
  }

  return async ({ forceRefreshToken }) => {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw new Error('The Supabase session could not be provided to Convex.', { cause: error });
    }

    if (!data.session) return null;
    if (!forceRefreshToken) return data.session.access_token;

    const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      throw new Error('The Supabase session could not be refreshed for Convex.', { cause: refreshError });
    }

    return refreshedData.session?.access_token ?? null;
  };
}

export function connectSupabaseAuthToConvex(supabase, convexClient) {
  if (!convexClient || typeof convexClient.setAuth !== 'function') {
    throw new Error('A configured Convex client is required to connect Supabase Auth.');
  }

  const fetchToken = createSupabaseTokenFetcher(supabase);
  convexClient.setAuth(fetchToken);

  const { data } = supabase.auth.onAuthStateChange(() => {
    queueMicrotask(() => convexClient.setAuth(fetchToken));
  });

  return () => data.subscription.unsubscribe();
}
