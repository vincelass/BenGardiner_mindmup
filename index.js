const fs = require('fs');
const D3Node = require('d3-node');
const d3 = require('d3');

const styles = `

.node circle {
  fill: #999;
}

.node text {
  font: 10px sans-serif;
}

.node--internal circle {
  fill: #555;
}

.node--internal text {
  text-shadow: 0 1px 0 #fff, 0 -1px 0 #fff, 1px 0 0 #fff, -1px 0 0 #fff;
}

.link {
  fill: none;
  stroke: #555;
  stroke-opacity: 0.4;
  stroke-width: 1.5px;
}

`;
const markup = '<div id="container"><div id="chart"></div></div>';
var options = {selector:'#chart', svgStyles:styles, container:markup, d3Module:d3};

var d3n = new D3Node(options);

///-- start D3 code
//TODO: stop abusing margin.left to compensate for test rendering of top node getting cut off
var margin = {top: 40, right: 40, bottom: 40, left: 160},
  total_width = 1260;
  total_height = 500;
  width = total_width - margin.left - margin.right,
  height = total_height - margin.top - margin.bottom;

var g = d3n.createSVG()
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .attr("viewBox", "0 0 " + total_width + " " + total_height)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

do_draw = function(json) {
  var root_node = d3.hierarchy(json, function(d) {
    if (typeof d.ideas === "undefined"){ return null; }
    //TODO: return null for collapsed nodes as well.
    return Object.keys(d.ideas).map(key => d.ideas[key]);
  });

  var tree = d3.tree().size([height, width-160]);

  var link = g.selectAll(".link")
    .data(tree(root_node).descendants().slice(1))
    .enter().append("path")
      .attr("class", "link")
      .attr("d", function(d) {
        return "M" + d.y + "," + d.x
            + "C" + (d.y + d.parent.y) / 2 + "," + d.x
            + " " + (d.y + d.parent.y) / 2 + "," + d.parent.x
            + " " + d.parent.y + "," + d.parent.x;
      });

  var node = g.selectAll(".node")
    .data(root_node.descendants())
    .enter().append("g")
      .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })

  node.append("circle")
      .attr("r", 2.5);

  node.append("text")
      .attr("dy", 3)
      .attr("x", function(d) { return d.children ? -8 : 8; })
      .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
      .text(function(d) {
        return d.data.title;
      });

};

mindmup_json = JSON.parse(fs.readFileSync('test.mup', 'utf8'));

if (typeof mindmup_json.id !== "undefined" && mindmup_json['id'] === "root") { // handle >= 2 mindmup_json
  mindmup_json = mindmup_json['ideas']['1'];
}

do_draw(mindmup_json);

function elbow(d, i) {
  return "M" + d.source.y + "," + d.source.x
      + "V" + d.target.x + "H" + d.target.y;
}

/// -- end D3 code

// create output files
outputName = 'v4.line-chart';

const svg2png = require('svg2png');

fs.writeFile(outputName+'.html', d3n.html(), function () {
  console.log('>> Done. Open '+outputName+'.html" in a web browser');
});

var svgBuffer = new Buffer(d3n.svgString(), 'utf-8');
svg2png(svgBuffer, {width: width*4})
  .then(buffer => fs.writeFile(outputName+'.png', buffer))
  .catch(e => console.error('ERR:', e))
  .then(err => console.log('>> Exported: "'+outputName+'.png"'));

