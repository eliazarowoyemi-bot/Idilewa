import { supabase } from './supabaseClient.js';

const LANGUAGES = new Set(['Yorùbá', 'Igbo', 'Hausa', 'Swahili']);
const SELECT_COLUMNS = 'id,user_id,language,yoruba,meaning,context,created_at';

function validateContribution(value) {
  const contribution = {
    language: typeof value?.language === 'string' ? value.language.trim() : '',
    text: typeof value?.text === 'string' ? value.text.trim() : '',
    meaning: typeof value?.meaning === 'string' ? value.meaning.trim() : '',
    context: typeof value?.context === 'string' ? value.context.trim() : '',
  };

  if (!LANGUAGES.has(contribution.language)) {
    throw new Error('Choose one of the supported languages.');
  }
  if (!contribution.text || contribution.text.length > 240) {
    throw new Error('Enter a proverb of 1–240 characters.');
  }
  if (!contribution.meaning || contribution.meaning.length > 320) {
    throw new Error('Enter a meaning or translation of 1–320 characters.');
  }
  if (contribution.context.length > 120) {
    throw new Error('Keep the context or attribution to 120 characters or fewer.');
  }

  return contribution;
}

function mapContribution(row) {
  return {
    id: row.id,
    userId: row.user_id,
    language: row.language,
    text: row.yoruba,
    meaning: row.meaning || '',
    context: row.context || '',
    createdAt: row.created_at,
  };
}

export function createCommunityProverbRepository(client) {
  async function getUserId() {
    const { data, error } = await client.auth.getSession();
    if (error) {
      throw new Error('Your sign-in session could not be checked.', { cause: error });
    }
    const userId = data?.session?.user?.id;
    if (typeof userId !== 'string' || !userId) {
      throw new Error('Sign in again to save a proverb to your account.');
    }
    return userId;
  }

  return {
    async listMine() {
      const userId = await getUserId();
      const { data, error } = await client
        .from('community_proverbs')
        .select(SELECT_COLUMNS)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) {
        throw new Error('Your private proverb contributions could not be loaded.', { cause: error });
      }
      return (data || []).map(mapContribution);
    },

    async saveMine(value) {
      const contribution = validateContribution(value);
      const userId = await getUserId();
      const { data, error } = await client
        .from('community_proverbs')
        .insert({
          user_id: userId,
          language: contribution.language,
          yoruba: contribution.text,
          meaning: contribution.meaning,
          context: contribution.context || null,
          approved: false,
        })
        .select(SELECT_COLUMNS)
        .single();
      if (error || !data) {
        throw new Error('Your contribution was not saved to your account. Please try again later.', { cause: error });
      }
      return mapContribution(data);
    },
  };
}

const repository = supabase ? createCommunityProverbRepository(supabase) : null;

export async function getMyProverbContributions() {
  if (!repository) {
    throw new Error('Account storage is not configured on this deployment.');
  }
  return repository.listMine();
}

export async function saveMyProverbContribution(contribution) {
  if (!repository) {
    throw new Error('Account storage is not configured on this deployment.');
  }
  return repository.saveMine(contribution);
}
