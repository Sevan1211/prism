-- Match the ORM's named owner index while retaining the original uniqueness constraint.
CREATE UNIQUE INDEX IF NOT EXISTS cloud_libraries_owner_unique ON cloud_libraries(owner);
