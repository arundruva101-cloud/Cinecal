export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/poster/") && request.method === "GET") {
      const key = decodeURIComponent(url.pathname.slice("/poster/".length));
      if (!key || key.includes("..")) return new Response("Not found", { status: 404 });
      const object = await env.POSTERS.get(key);
      if (!object) return new Response("Not found", { status: 404 });
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("Cache-Control", "public, max-age=86400");
      headers.set("X-Content-Type-Options", "nosniff");
      return new Response(object.body, { headers });
    }

    if (url.pathname === "/api/movies" && request.method === "GET") {
      const { results } = await env.DB.prepare(
        "SELECT id,title,date,genre,poster FROM movies WHERE status='approved' ORDER BY date ASC,title ASC"
      ).all();
      return json({ data: results });
    }

    if (url.pathname === "/api" && request.method === "POST") {
      try {
        const payload = await request.json();
        const action = payload.action;
        const args = Array.isArray(payload.args) ? payload.args : [];
        const data = await dispatch(action, args, env);
        return json({ ok: true, data });
      } catch (error) {
        return json({ ok: false, error: error?.message || "Server error" }, 400);
      }
    }

    if (url.pathname === "/api" || url.pathname === "/api/movies") {
      return new Response("Method not allowed", { status: 405 });
    }
    return env.ASSETS.fetch(request);
  }
};

function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}

function checkAdmin(pass, env) {
  if (!env.ADMIN_PASSCODE || pass !== env.ADMIN_PASSCODE) throw new Error("Wrong passcode");
}

function cleanMovie(movie) {
  const title = String(movie?.title || "").trim().slice(0, 80);
  const date = String(movie?.date || "");
  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Title and date are required");
  }
  return { title, date, genre: String(movie?.genre || "").trim().slice(0, 500) };
}

async function savePoster(data, env) {
  if (!data || typeof data !== "string" || !data.startsWith("data:image/")) return "";
  if (data.length > 400000) throw new Error("Poster is too large");
  const match = data.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error("Unsupported poster format");
  const mime = match[1];
  const bytes = Uint8Array.from(atob(match[2]), c => c.charCodeAt(0));
  if (bytes.byteLength > 300000) throw new Error("Poster is too large");
  const ext = mime.split("/")[1].replace("jpeg", "jpg");
  const key = `${crypto.randomUUID()}.${ext}`;
  await env.POSTERS.put(key, bytes, { httpMetadata: { contentType: mime } });
  return key;
}

async function addMovie(movie, posterData, status, by, env) {
  const m = cleanMovie(movie);
  const poster = await savePoster(posterData, env);
  const id = crypto.randomUUID();
  await env.DB.prepare(
    "INSERT INTO movies (id,title,date,genre,poster,status,by,created) VALUES (?,?,?,?,?,?,?,?)"
  ).bind(id, m.title, m.date, m.genre, poster, status, by, new Date().toISOString()).run();
  return true;
}

async function dispatch(action, args, env) {
  switch (action) {
    case "submitMovie": {
      const pending = await env.DB.prepare("SELECT COUNT(*) AS n FROM movies WHERE status='pending'").first();
      if ((pending?.n || 0) >= 200) throw new Error("Too many pending suggestions right now");
      return addMovie(args[0], args[1], "pending", "visitor", env);
    }
    case "adminList": {
      checkAdmin(args[0], env);
      const { results } = await env.DB.prepare(
        "SELECT id,title,date,genre,poster,status FROM movies ORDER BY created DESC"
      ).all();
      return results;
    }
    case "adminAdd":
      checkAdmin(args[0], env);
      return addMovie(args[1], args[2], "approved", "admin", env);
    case "approve": {
      checkAdmin(args[0], env);
      const result = await env.DB.prepare("UPDATE movies SET status='approved' WHERE id=?").bind(args[1]).run();
      if (!result.meta.changes) throw new Error("Movie not found");
      return true;
    }
    case "remove": {
      checkAdmin(args[0], env);
      const row = await env.DB.prepare("SELECT poster FROM movies WHERE id=?").bind(args[1]).first();
      if (!row) throw new Error("Movie not found");
      await env.DB.prepare("DELETE FROM movies WHERE id=?").bind(args[1]).run();
      if (row.poster) await env.POSTERS.delete(row.poster);
      return true;
    }
    case "adminUpdate": {
      checkAdmin(args[0], env);
      const m = cleanMovie(args[2]);
      const current = await env.DB.prepare("SELECT poster FROM movies WHERE id=?").bind(args[1]).first();
      if (!current) throw new Error("Movie not found");
      const uploaded = await savePoster(args[3], env);
      await env.DB.prepare(
        "UPDATE movies SET title=?,date=?,genre=?,poster=? WHERE id=?"
      ).bind(m.title, m.date, m.genre, uploaded || current.poster, args[1]).run();
      if (uploaded && current.poster) await env.POSTERS.delete(current.poster);
      return true;
    }
    default:
      throw new Error("Unknown action");
  }
}
