library(DBI)
library(RSQLite)

# Some private helper functions and variables (starting with p.db.)

# Change this variable to switch data sets. It is expected that the data
# directory contains the files:
# - ${p.db.dataset}.rda
# - ${p.db.dataset}.schema.rda
p.db.dataset <- "cstr"

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
p.db.file.name <- paste(p.db.file.path, paste(p.db.dataset, "cache.db", sep="-"), sep=.Platform$file.sep)

db.init <- function() {
  if (!file.exists(p.db.file.name)) {

    if (!file.exists(p.db.file.path)) {
      dir.create(p.db.file.path, recursive = T)
    }

    data(list=list(p.db.dataset, paste(p.db.dataset, ".schema", sep="")))
    mSchema <- .GlobalEnv[[paste(p.db.dataset, ".schema", sep="")]]
    mData <- .GlobalEnv[[p.db.dataset]]
    mData$row <- as.integer(1:nrow(mData))

    con <- DBI::dbConnect(RSQLite::SQLite(), p.db.file.name)
    stopifnot(DBI::dbWriteTable(con, "data", mData, row.names=F))
    stopifnot(DBI::dbWriteTable(con, "schema", mSchema, row.names=F))
    #create index by row to allow for faster lookup / updates
    res <- DBI::dbSendQuery(con,"CREATE INDEX row_index ON data (row ASC);")
    DBI::dbClearResult(res)
    DBI::dbDisconnect(con)
  }

  db.select(table="schema")
}

p.db.connection <-function() {
  DBI::dbConnect(RSQLite::SQLite(), p.db.file.name)
}

p.db.rowcount <- function(table) {
  q <- paste("SELECT COUNT(*) FROM", table, sep=" ")

  con <- p.db.connection()
  rowcount <- DBI::dbGetQuery(con, q)
  DBI::dbDisconnect(con)
  as.vector(unlist(rowcount))
}

p.db.check.column.type <- function(type) {
  type <- toupper(type)
  if (!(type %in% c("INTEGER", "REAL", "TEXT"))) {
    stop(paste("db.check.column.type - Invalid column type:", type))
  }
  type
}

# p.db.add.column(column.name="kmeans_35_M4", type="integer")
p.db.add.column <- function(table="data", column.name, type) {
  type <- p.db.check.column.type(type)

  con <- p.db.connection()
  if (!(column.name %in% DBI::dbListFields(con, table))) {
    q <- paste("ALTER TABLE", table, "ADD COLUMN", column.name, type, sep=" ")
    res <- DBI::dbSendQuery(con, q)
    DBI::dbClearResult(res)
  }

  DBI::dbDisconnect(con)
}

# p.db.extend.schema("kmeans_30_7", "integer", "Analytics", "Clusterings")
p.db.extend.schema <- function(name, type, group, group_type) {
  con <- p.db.connection()
  q <- paste("SELECT count(*) FROM schema WHERE name='", name, "'", sep="")
  count <- unlist(DBI::dbGetQuery(con, q))
  if (count == 0) {
    values <- paste("'", c(name, type, group, group_type), "'", sep="", collapse=", ")
    q <- paste("INSERT INTO schema VALUES(", values , ")", sep="")
    res <- DBI::dbSendQuery(con, q)
    DBI::dbClearResult(res)
  }
  DBI::dbDisconnect(con)
}

# p.db.store(column.name="kmeans_30_7", 1:10, 8)
p.db.store <- function(column.name, rows = c(), value) {
  # NOTE: for now value is expected to be a numeric value.
  con <- p.db.connection()
  q <- paste("UPDATE data SET ", column.name, " = ", value, sep="")

  if (length(rows) > 0) {
    rows <- paste(as.character(rows), collapse=", ")
    q <- paste(q, " WHERE row in (", rows, ")", sep="")
  }

  res <- DBI::dbSendQuery(con, q)
  DBI::dbClearResult(res)
  DBI::dbDisconnect(con)
}

p.db.storeList <- function(column.name, values) {
  #Note: list must have the row ids as the item names
  #connect to DB
  con <- p.db.connection()
  #start TXN
  dbBegin(con)
  #build update statement for each item in the list,
  # using the item name as a row id
  print(paste("Query Build Start",Sys.time(),sep = " "))
  queries<-paste("UPDATE data SET ", column.name, " = ", values, " WHERE row =", names(values),sep="")
  #pass queries to DB
  for(q in queries) {
    DBI::dbSendQuery(con, q)
  }
  #commit changes
  dbCommit(con)
  DBI::dbDisconnect(con)
}

p.db.types <- function(variables) {
  # NOTE: for now value is expected to be a numeric value.
  con <- p.db.connection()
  q <- paste("SELECT name, type FROM schema WHERE name in (\""
             , paste(variables, collapse="\", \""), "\")", sep="")
  data <- DBI::dbGetQuery(con, q)
  DBI::dbDisconnect(con)
  data
}

# API exposed to the front-end

db.reset <- function() {
  if (file.exists(p.db.file.name)) {
    file.remove(p.db.file.name)
  }
  p.db.init()
}

# db.select(vars=c("M4", "M20"), rows=c(1,2,100,2300))
db.select <- function(table="data", vars=c(), rows=c()) {
  vars <- ifelse(length(vars) == 0,
                 "*",
                 paste(unlist(vars), collapse=", "))

  q <- paste("SELECT ", vars, " FROM ", table, sep="")

  if (length(rows) > 0) {
    rows <- paste(as.character(rows), collapse=", ")
    q <- paste(q, " WHERE row in (", rows, ")", sep="")
  }

  con <- p.db.connection()
  data <- DBI::dbGetQuery(con, q)
  DBI::dbDisconnect(con)
  data
}
