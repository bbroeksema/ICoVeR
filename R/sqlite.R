library(RSQLite)

# Some private helper functions (starting with p.db.)

# Note: This only works if the packe is installed in a directory that can be
#       written by the user that runs opencpu.
# Note: To make this work under linux, make sure you have the following line in
#       /etc/apparmor.d/opencpu.d/custom:
#       /home/${user.name}/R/x86_64-pc-linux-gnu-library/3.1/RParcoords/data/*.db rwk,
#
#       Replace ${user.name} with your actual user name. Also make sure that is
#       actually represent the directory in which you have installed this packeage.
p.db.file.name <- system.file("data", "cstr.db", package="RParcoords")

if (!file.exists(p.db.file.name)) {
  p.db.init()
}

p.db.init <- function() {
  data(cstr)
  data(cstr.schema)

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

# API exposed to the front-end

db.reset <- function() {
  if (file.exists(p.db.file.name)) {
    file.remove(p.db.file.name)
  }
  db.init()
}

# db.add.column(column.name="kmeans_35_M4", type="integer")
db.add.column <- function(table="cstr", column.name, type) {
  type <- db.check.column.type(type)

  con <- DBI::dbConnect(RSQLite::SQLite(), p.db.file.name)
  if (!(column.name %in% DBI::dbListFields(con, "cstr"))) {
    q <- paste("ALTER TABLE", table, "ADD COLUMN", column.name, type, sep=" ")
    res <- DBI::dbSendQuery(con, q)
    DBI::dbClearResult(res)
  }

  DBI::dbDisconnect(con)
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
