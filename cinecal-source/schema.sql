CREATE TABLE IF NOT EXISTS movies (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  genre TEXT NOT NULL DEFAULT '',
  poster TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved')),
  by TEXT NOT NULL DEFAULT '',
  created TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_movies_status_date ON movies(status, date);
CREATE INDEX IF NOT EXISTS idx_movies_created ON movies(created);
