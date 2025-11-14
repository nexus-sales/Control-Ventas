import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const createOfflineError = (operation) => {
  const error = new Error(`Supabase no configurado: ${operation}`);
  error.code = 'SUPABASE_OFFLINE';
  return error;
};

const wrapOfflineResponse = (operation) => ({ data: null, error: createOfflineError(operation) });

const createOfflineQueryBuilder = () => {
  let currentOperation = 'query';

  const resolveWithCurrentOperation = () => wrapOfflineResponse(currentOperation);

  const builder = {
    select() {
      currentOperation = 'select';
      return builder;
    },
    insert() {
      currentOperation = 'insert';
      return builder;
    },
    update() {
      currentOperation = 'update';
      return builder;
    },
    upsert() {
      currentOperation = 'upsert';
      return builder;
    },
    delete() {
      currentOperation = 'delete';
      return builder;
    },
    eq() {
      return builder;
    },
    ilike() {
      return builder;
    },
    in() {
      return builder;
    },
    order() {
      return builder;
    },
    limit() {
      return builder;
    },
    maybeSingle() {
      currentOperation = 'maybeSingle';
      return builder;
    },
    single() {
      currentOperation = 'single';
      return builder;
    },
    then(resolve, reject) {
      return Promise.resolve(resolveWithCurrentOperation()).then(resolve, reject);
    },
    catch(onRejected) {
      return Promise.resolve(resolveWithCurrentOperation()).catch(onRejected);
    },
    finally(onFinally) {
      return Promise.resolve(resolveWithCurrentOperation()).finally(onFinally);
    },
  };

  return builder;
};

const createOfflineClient = () => ({
  auth: {
    async getSession() {
      return wrapOfflineResponse('auth.getSession');
    },
    async signInWithPassword() {
      return wrapOfflineResponse('auth.signInWithPassword');
    },
    async signOut() {
      return wrapOfflineResponse('auth.signOut');
    },
    onAuthStateChange() {
      return {
        data: {
          subscription: {
            unsubscribe() {},
          },
        },
        error: createOfflineError('auth.onAuthStateChange'),
      };
    },
  },
  from() {
    return createOfflineQueryBuilder();
  },
  rpc() {
    return Promise.resolve(wrapOfflineResponse('rpc'));
  },
});

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createOfflineClient();

export const isSupabaseClientConfigured = Boolean(supabaseUrl && supabaseAnonKey);
