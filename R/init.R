app.init <- function() {
  # Makes sure that the database is initialized and returns the schema of the
  # data, and all the required UI configuration bits.

  db.init()

  schema <- p.db.select(table="schema");
  cluster <- p.cluster.methods()
  dimred <- p.dimred.methods()
  color <- p.color.configurations()

  list(schema = schema, cluster = cluster, dimred = dimred)
}
