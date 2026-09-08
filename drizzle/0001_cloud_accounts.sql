-- New account-owned storage. Legacy encrypted data is retained, never auto-migrated.
CREATE TABLE cloud_libraries (
  id TEXT PRIMARY KEY NOT NULL,
  owner TEXT UNIQUE NOT NULL,
  head INTEGER NOT NULL DEFAULT 0,
  last_mutation TEXT,
  created INTEGER NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE cloud_objects (
  library TEXT NOT NULL,
  id TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  PRIMARY KEY (library, id)
);
CREATE TABLE cloud_commits (
  library TEXT NOT NULL,
  revision INTEGER NOT NULL,
  mutation TEXT NOT NULL,
  objects TEXT NOT NULL,
  created INTEGER NOT NULL,
  PRIMARY KEY (library, revision)
);
CREATE UNIQUE INDEX cloud_mutation ON cloud_commits(library, mutation);
CREATE TABLE cloud_limits (key TEXT PRIMARY KEY NOT NULL, count INTEGER NOT NULL, expires INTEGER NOT NULL);
