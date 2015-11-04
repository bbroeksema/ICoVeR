# ICoVeR - Interactive Contig-bin Verification and Refinement
#    
# Copyright 2015 Luxembourg Institute of Science and technology. All rights reserved.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

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
#          /tmp/ICoVeR/ rw,
#          /tmp/ICoVeR/** rwkmix,
#
#       2) The OpenCPU cache service must be disabled. Rationale: opencpu
#          assumes each function to be pure (which is a reasonable assumption).
#          However, we update the schema table in the sqlite database, and as
#          such two calls to data.schema() can yield different results. This
#          doesn't happen when the opencpu cache is enabled, as it will cache
#          results of a function for given parameter configuration.
#
#       3) Make sure that OpenCPU can write large enough files from R. To
#          achieve this edit /etc/opencpu/server.conf:
#
#          "rlimit.fsize": 1e9,
#
p.db.file.path <- paste(.Platform$file.sep, paste("tmp", "ICoVeR", sep=.Platform$file.sep), sep="")
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
}

# This function makes sure column names are suitable for sqlite. It also prevents SQL injection.
p.db.escape.name <- function (name) {
  name <- paste("\"", name, "\"", sep="")
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
    column.name <- p.db.escape.name(column.name)
    q <- paste("ALTER TABLE", table, "ADD COLUMN", column.name, type, sep=" ")
    res <- DBI::dbSendQuery(con, q)
    DBI::dbClearResult(res)
  }

  DBI::dbDisconnect(con)
}

# ALTER TABLE DROP COLUMN is not supported by sqlite
p.db.remove.column <- function(table="data", column.name) {
#  con <- p.db.connection()
#  if (column.name %in% DBI::dbListFields(con, table)) {
#    column.name <- p.db.escape.name(column.name)
#    q <- paste("ALTER TABLE", table, "DROP COLUMN", column.name, sep=" ")
#    res <- DBI::dbSendQuery(con, q)
#    DBI::dbClearResult(res)
#  }
#
#  DBI::dbDisconnect(con)
}

# p.db.extend.schema("kmeans_30_7", "integer", "Analytics", "Clusterings")
p.db.extend.schema <- function(name, type, group, group_type) {
  con <- p.db.connection()
  q <- paste("SELECT count(*) FROM schema WHERE name='", name, "'", sep="")
  count <- unlist(DBI::dbGetQuery(con, q))
  if (count == 0) {
    values <- paste("'", c(name, type, group, group_type), "'", sep="", collapse=", ")
    q <- paste("INSERT INTO schema (name, type, \"group\", group_type) VALUES(", values , ")", sep="")
    res <- DBI::dbSendQuery(con, q)
    DBI::dbClearResult(res)
  }
  DBI::dbDisconnect(con)
}

p.db.truncate.schema <- function(name) {
  con <- p.db.connection()
  q <- paste("SELECT count(*) FROM schema WHERE name='", name, "'", sep="")
  count <- unlist(DBI::dbGetQuery(con, q))
  if (count == 1) {
    q <- paste("DELETE FROM schema WHERE name='", name, "'", sep="")
    res <- DBI::dbSendQuery(con, q)
    DBI::dbClearResult(res)
  }
  DBI::dbDisconnect(con)
}

# p.db.store(column.name="kmeans_30_7", 1:10, 8)
p.db.store <- function(column.name, rows = c(), value) {
  column.name <- p.db.escape.name(column.name)

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
  column.name <- p.db.escape.name(column.name)
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
  variables <- lapply(variables, p.db.escape.name)

  # NOTE: for now value is expected to be a numeric value.
  con <- p.db.connection()
  q <- paste("SELECT name, type FROM schema WHERE name in ("
             , paste(variables, collapse=", "), ")", sep="")
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

# p.db.select(vars=c("M4", "M20"), rows=c(1,2,100,2300))
p.db.select <- function(table="data", vars=c(), rows=c()) {
  vars <- lapply(vars, p.db.escape.name)

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
