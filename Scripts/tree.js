$(function() {
	var diameter = 750;
	var treeAngle = document.getElementById("StartAngle").value;
	console.log("Tree Start Angle " + treeAngle);
	
	var fileNameInput = document.getElementById("fileName");
		fileNameInput.onchange = changeData;
		
		
	function changeData (){
		$("svg").remove();
		displayJson();		
		printTree();
		
	};

	function displayJson() {
	var fileName = fileNameInput.files[0].name;
	console.log(fileName);
	$.getJSON(fileName, function(data ) {
			var dataJson = data;
			console.log(dataJson);
			var json_text = JSON.stringify(dataJson , null, 4); // Indented 4 spaces
			$("#dataTree").empty();
			$("#dataTree").append("<div class='header'>" + fileName + ":</div><div><pre>" + json_text + "</pre></div>");
		})	;
	};
	
	function printTree() {
		var fileName = fileNameInput.files[0].name;

		var tree = d3.layout.tree()
			.size([treeAngle, diameter/2 - diameter/8])
			.separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / treeAngle; });

		var diagonal = d3.svg.diagonal.radial()
			.projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });
			
		var svg = d3.select("#diagramTree").append("svg")
			.attr("width", diameter)
			.attr("height", diameter)
		  .append("g")
			.attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");

		d3.json(fileName, function(error, root) {
		  var nodes = tree.nodes(root),
			  links = tree.links(nodes);
			
		  var link = svg.selectAll(".link")
			  .data(links)
			.enter().append("path")
			  .attr("class", "link")
			  .attr("d", diagonal);

		  var node = svg.selectAll(".node")
			  .data(nodes)
			.enter().append("g")
			  .attr("class", "node")
			  .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })

		  node.append("circle")
			  .attr("r", 4.5);

		  node.append("text")
			  .attr("dy", ".31em")
			  .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
			  .attr("transform", function(d) { return d.x < 180 ? "translate(8)" : "rotate(180)translate(-8)"; })
			  .text(function(d) { return d.name; });
		});

		d3.select(self.frameElement).style("height", diameter + "px");
		}
		
	});
