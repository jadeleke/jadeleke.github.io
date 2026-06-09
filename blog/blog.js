// Supabase config
const SUPABASE_URL = 'https://unwwxpovznnbdfkbcwph.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVud3d4cG92em5uYmRma2Jjd3BoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDE4MzQsImV4cCI6MjA5NTMxNzgzNH0.AN_792G7XP6ts9l-naGPOx4_WFPenr55BYXrXserdIw';

async function supabase(path, options = {}) {
  const url = `${SUPABASE_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': options.prefer || '',
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || err.error || res.statusText);
  }
  return res.status === 204 ? null : res.json();
}

async function rpc(fn, body) {
  return supabase(`/rest/v1/rpc/${fn}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function fetchPosts() {
  return supabase('/rest/v1/posts?published=eq.true&order=created_at.desc&select=id,title,slug,excerpt,tags,created_at,updated_at,edited');
}

export async function fetchPost(slug) {
  const rows = await supabase(`/rest/v1/posts?slug=eq.${encodeURIComponent(slug)}&published=eq.true&select=*`);
  return rows?.[0] ?? null;
}

export async function fetchComments(postId) {
  return supabase(`/rest/v1/comments?post_id=eq.${postId}&order=created_at.asc&select=*`);
}

export async function addComment(postId, authorName, content) {
  return supabase('/rest/v1/comments', {
    method: 'POST',
    prefer: 'return=representation',
    body: JSON.stringify({ post_id: postId, author_name: authorName, content }),
  });
}

// ── Admin API ────────────────────────────────────────────────────────────────

export async function adminLogin(password) {
  const token = await rpc('admin_login', { secret: password });
  if (token) sessionStorage.setItem('admin_token', token);
  return token;
}

export function getAdminToken() {
  return sessionStorage.getItem('admin_token');
}

export function adminLogout() {
  sessionStorage.removeItem('admin_token');
}

export async function adminFetchAllPosts() {
  // Service role not available from browser; we read all posts via the anon key
  // The admin page uses this after logging in — we show all posts including unpublished
  // by calling a privileged RPC (admin_list_posts defined below via migration)
  const token = getAdminToken();
  return rpc('admin_list_posts', { p_token: token });
}

export async function adminUpsertPost({ id, title, slug, excerpt, content, tags, published }) {
  const token = getAdminToken();
  return rpc('admin_upsert_post', {
    p_token: token,
    p_id: id ?? null,
    p_title: title,
    p_slug: slug,
    p_excerpt: excerpt,
    p_content: content,
    p_tags: tags,
    p_published: published,
  });
}

export async function adminDeletePost(id) {
  const token = getAdminToken();
  return rpc('admin_delete_post', { p_token: token, p_id: id });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}
