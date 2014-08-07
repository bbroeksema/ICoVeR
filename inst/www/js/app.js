//ocpu.seturl("/ocpu/library/RParcoords/R");


function visualize(d) {
  var dims = Object.getOwnPropertyNames(d.schema).filter(function(dim) {
    if (d.schema[dim] === "numeric" || d.schema[dim] === "integer") {
      d.schema[dim] = "number"
      return true
    } else if (d.schema[dim] == "character") {
      d.schema[dim] = "string"
    }

    return false;
  })

  d3.parcoords()("#parcoords")
    .dimensions(dims)
    .types(d.schema)
    .data(d.data)
    .height(400)
    .mode("queue")
    .rate(250)
    .alpha(0.05)
    .render()
    .createAxes()
    .brushable()
    .reorderable()
}

function error(e) {
  console.log(e)
}

d3.json("/ocpu/library/RParcoords/data/cstr/json?auto_unbox=true", visualize, error);
