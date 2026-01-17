const SITE_ORIGIN = "https://cummings.ee";

module.exports = async function() {
  const indexUrl = `${SITE_ORIGIN}/downloads/books.json`;
  const res = await fetch(indexUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${indexUrl}: ${res.status}`);
  }
  const allBooks = await res.json();

  const publicBooks = (Array.isArray(allBooks) ? allBooks : [])
    .filter(b => b && b.public_domain === true);

  const booksWithToc = await Promise.all(publicBooks.map(async book => {
    const clone = Object.assign({}, book);
    clone.poems = [];

    if (!book.json_url) return clone;

    try {
      const r = await fetch(book.json_url);
      if (!r.ok) {
        console.warn(`Warning: could not fetch book json ${book.json_url}: ${r.status}`);
        return clone;
      }
      const bookJson = await r.json();
      if (!Array.isArray(bookJson.toc)) return clone;

      const poems = await Promise.all(bookJson.toc.map(async entry => {
        const title = entry.name || entry.title || "(untitled)";
        const html_url_raw = entry.html_url || entry.url || null;

        let html_url = null;
        if (html_url_raw) {
          try {
            html_url = new URL(html_url_raw, SITE_ORIGIN).toString();
          } catch (e) {
            html_url = null;
          }
        }

        let json_url = null;
        if (html_url) {
          try {
            const u = new URL(html_url);
            const pathNoSlash = u.pathname.replace(/\/$/, "");
            json_url = `${u.origin}${pathNoSlash}.json`;
          } catch (e) {
            json_url = null;
          }
        }

        let slug = entry.slug || null;
        if (!slug && html_url) {
          try {
            const parts = new URL(html_url).pathname.split("/").filter(Boolean);
            slug = parts.length ? parts[parts.length - 1] : null;
          } catch (e) {
            slug = null;
          }
        }
        let text = null;
        if (json_url) {
          try {
            const pr = await fetch(json_url);
            if (pr.ok) {
              const pj = await pr.json();
              text = pj.text ?? pj.html ?? null;
            }
          } catch (e) {
            console.warn(`Warning: could not fetch poem json ${json_url}: ${e && e.message ? e.message : e}`);
          }
        }

        return {
          title,
          slug,
          html_url,
          json_url,
          text
        };
      }));

      clone.poems = poems;
    } catch (e) {
      console.warn(`Warning: error processing ${book.json_url}:`, e && e.message ? e.message : e);
    }

    return clone;
  }));

  return booksWithToc;
};
