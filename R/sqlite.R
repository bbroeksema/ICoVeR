library(RSQLite)

# Some private helper functions and variables (starting with p.db.)

# NOTE: The "cache" databse will be created as: /tmp/RParcoords/cache.db under
#       linux. In order to make this work with the opencpu service a couple of
#       things need to be done on linux:
#       1) Some apparmor rules need to be set enable the RParcoords plugin to
#          create a cache. The file: /etc/apparmor.d/opencpu.d/custom needs the
#          following lines:
#
#          /tmp/RParcoords/ rw,
#          /tmp/RParcoords/** rwkmix,
#
#       2) The OpenCPU cache service must be disabled. Rationale: opencpu
#          assumes each function to be pure (which is a reasonable assumption).
#          However, we update the schema table in the sqlite database, and as
#          such two calls to data.schema() can yield different results. This
#          doesn't happen when the opencpu cache is enabled, as it will cache
#          results of a function for given parameter configuration.

p.db.file.path <- paste(.Platform$file.sep, paste("tmp", "RParcoords", sep=.Platform$file.sep), sep="")
p.db.file.name <- paste(p.db.file.path, "cache.db", sep=.Platform$file.sep)

p.db.init <- function() {
  data(cstr)
  data(cstr.schema)

  if (!file.exists(p.db.file.path)) {
    dir.create(p.db.file.path, recursive = T)
  }

  # rownames(cstr) returns a vector of character, in the databse we actually
  # prefer to have it as integer
  cstr$row <- as.integer(rownames(cstr))

  con <- DBI::dbConnect(RSQLite::SQLite(), p.db.file.name)
  DBI::dbWriteTable(con, "cstr", cstr, row.names=F)
  DBI::dbWriteTable(con, "cstr_schema", cstr.schema, row.names=F)
  DBI::dbDisconnect(con)
}

p.db.check.column.type <- function(type) {
  type <- toupper(type)
  if (!(type %in% c("INTEGER", "REAL", "TEXT"))) {
    stop(paste("db.check.column.type - Invalid column type:", type))
  }
  type
}

# p.db.add.column(column.name="kmeans_35_M4", type="integer")
p.db.add.column <- function(table="cstr", column.name, type) {
  type <- p.db.check.column.type(type)

  con <- DBI::dbConnect(RSQLite::SQLite(), p.db.file.name)
  if (!(column.name %in% DBI::dbListFields(con, "cstr"))) {
    q <- paste("ALTER TABLE", table, "ADD COLUMN", column.name, type, sep=" ")
    res <- DBI::dbSendQuery(con, q)
    DBI::dbClearResult(res)
  }

  DBI::dbDisconnect(con)
}

# p.db.extend.schema("kmeans_30_7", "integer", "Analytics", "Clusterings")
p.db.extend.schema <- function(name, type, group, group_type) {
  con <- DBI::dbConnect(RSQLite::SQLite(), p.db.file.name)
  q <- paste("SELECT count(*) FROM cstr_schema WHERE name='", name, "'", sep="")
  count <- unlist(DBI::dbGetQuery(con, q))
  if (count == 0) {
    values <- paste("'", c(name, type, group, group_type), "'", sep="", collapse=", ")
    q <- paste("INSERT INTO cstr_schema VALUES(", values , ")", sep="")
    res <- DBI::dbSendQuery(con, q)
    DBI::dbClearResult(res)
  }
  DBI::dbDisconnect(con)
}

# API exposed to the front-end

db.reset <- function() {
  if (file.exists(p.db.file.name)) {
    file.remove(p.db.file.name)
  }
  db.init()
}

# db.select(vars=c("M4", "M20"), rows=c(1,2,100,2300))
db.select <- function(table="cstr", vars, rows=c()) {
  vars <- paste(unlist(vars), collapse=", ")
  q <- paste("SELECT ", vars, " FROM ", table, sep="")

  if (length(rows) > 0) {
    rows <- paste(as.character(rows), collapse=", ")
    q <- paste(q, " WHERE row in (", rows, ")", sep="")
  }

  con <- DBI::dbConnect(RSQLite::SQLite(), p.db.file.name)
  data <- DBI::dbGetQuery(con, q)
  DBI::dbDisconnect(con)
  data
}
