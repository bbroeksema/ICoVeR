app.init <- function(timestamp = Sys.time()) {
  # Makes sure that the database is initialized and returns the schema of the
  # data, and all the required UI configuration bits.

  db.init()

  schema <- data.schema(timestamp = timestamp)

  data = list(
    schema = schema,
    dimensions = list(rows = p.db.rowcount(table = "data"), cols = nrow(schema))
  )
  cluster <- p.cluster.methods()
  dimred <- p.dimred.methods()

  list(data = data, cluster = cluster, dimred = dimred)
}
