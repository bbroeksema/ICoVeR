p_schemes <- list(
  numeric = list(
    value = list(
      blue_to_brown = c("steelblue", "brown")
    )
  )
)

p_color_numeric_value <- function(colorVariable, scheme) {
  # First we extract the variable and normalize it.
  extent <- range(colorVariable)
  normalized <- colorVariable - extent[1]
  normalized <- normalized / (extent[2] - extent[1])

  # Now we create a color interpolation function and call it on the normalized
  # data.
  color <- colorRamp(p_schemes$numeric$value[[scheme]])
  rgb(color(normalized), max = 255)
}

p_color_numeric_decile <- function(colorVariable, scheme) {

}

p_color_numeric_zscore <- function(colorVariable, scheme) {

}

p_color_numeric <- function(colorVariable, method, scheme) {
  if (method == "Value") {
    p_color_numeric_value(colorVariable, scheme)
  } else if (method == "Decile") {
    p_color_numeric_decile(colorVariable, scheme)
  } else if (method == "Z-score") {
    p_color_numeric_zscore(colorVariable, scheme)
  } else {
    stop(paste("Unsupported color method:", method))
  }
}

color.configurations <- function() {
  list(
    numeric = list(
      "Value" = names(p_schemes$numeric$value),
      "Decile" = c("BlueToGreen", "BlueToPurple", "Blues"),
      "Z-score" = c("RedToBlue", "Spectral")
    )
  )
}

# color.apply(variable="gc_content", method="Value", scheme="blue_to_brown")
color.apply <- function(rows = c(), variable, method, scheme) {
  colorVariable <- data.get(rows, c(variable))[,variable]
  colors <- NA
  if (is.numeric(colorVariable)) {
    colors <- p_color_numeric(colorVariable, method, scheme)
  } else {
    stop("Unsupported data type")
  }
  rows <- if(missing(rows) | length(rows) == 0)
            attr(gData, "row.names")
          else
            rows
  # Now, combine row names and the colors in a resulting data frame.
  #data.frame("row" = rows, "vis.color" = colors, stringsAsFactors = F)
  colors <- as.list(colors)
  names(colors) <- rows
  colors
}

color.get <- function(colors = NA, rows = c()) {
  if (missing(colors)) {
    if (length(rows) == 0) {
      colors <- as.list(rep("#069", nrow(gData)))
      names(colors) <- c(1:nrow(gData))
      colors
    } else {
      colors <- as.list(rep("#069", length(rows)))
      names(colors) <- rows
      colors
    }
  } else {
    if (length(rows) == 0 ) {
      colors;
    } else {
      colors[rows]
    }
  }
}
