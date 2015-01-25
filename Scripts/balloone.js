$(function () {

    /**** Default Parameters ****/
    var symbolDisplay = 0;
    var textDisplay = 0;
    var theme = [['#2980b9', '#3acfc8', '#D7F73A'], ["#3182bd", "#c6dbef", "#fd8d3c"], ["#9B0DFF", "#E82BD1", "#FF8F19"], ["#005C0A", "#80FFEC", "#19FF82"]];
    var figureSize = 7;
    var themeId = 0;
    var showTip = 1;
    var collapse = 1;
    var showZoom = 0;

    var currentZoom = 0;

    document.getElementById("collapse").checked = collapse;
    document.getElementById("showText").checked = textDisplay;
    document.getElementById("showTip").checked = showTip;
    document.getElementById("showZoom").checked = showZoom;

    /**** ******* ****/


    /*** Option ***/
    var margin = { top: -5, right: -5, bottom: -5, left: -5 };
    var width = $("#tabs").width() - 50,
        height = width - 250,
        root;
    var treeAngle = document.getElementById("sizeParameters").value;
    /***********/

    /*Zmiana pliku - renderowanie widoku*/
    var fileNameInput = document.getElementById("fileName");
    fileNameInput.onchange = changeData;
    /**** ******* ****/

    /* Zmiana parametrów konfiguracyjnych**/
    var changeConfOption = document.getElementById("changeParameters");
    changeConfOption.onclick = changeConfOptionEvent;

    var resetConfOption = document.getElementById("defaultParameters");
    resetConfOption.onclick = resetOptions;

    var changeStyleOption = document.getElementById("styleChangeParameters");
    changeStyleOption.onclick = changeStyle;


    function changeConfOptionEvent() {
        collapse = $('#collapse:checked').length > 0;
        textDisplay = $('#showText:checked').length > 0;
        showTip = $('#showTip:checked').length > 0;
        showZoom = $('#showZoom:checked').length > 0;

        var fileName = $("#fileName").val();
        if (fileName.lastIndexOf("json") === fileName.length - 4) {
            changeData();
        }
        else {
            alert("Wybierz plik z rozszerzeniem JSON");
        }

    };


    function resetOptions() {
        collapse = 1;
        textDisplay = 1;
        showTip = 1;
        showZoom = 0;
        document.getElementById("collapse").checked = collapse;
        document.getElementById("showText").checked = textDisplay;
        document.getElementById("showTip").checked = showTip;
        document.getElementById("showZoom").checked = showZoom;
    };

    function changeStyle() {
        symbolDisplay = $("#figuresParameters").val();
        figureSize = $("#sizeParameters").val();
        themeId = $("#themeParamters").val();
        var fileName = $("#fileName").val();
        if (fileName.lastIndexOf("json") === fileName.length - 4) {
            changeData();
        }
        else {
            alert("Wybierz plik z rozszerzeniem JSON");

        }

    };

    /*****************/

    function changeData() {
        $("svg").remove();
        $("#slider").remove();
        displayJson();

        var zoom = d3.behavior.zoom()
           .scaleExtent([0.3, 10])
           .on("zoom", zoomed);

        var force = d3.layout.force()
            .linkDistance(40)
            .charge(-120)
            .gravity(.1)
            .size([width, height])
            .on("tick", tick);

        var tip = d3.tip()
          .attr('class', 'd3-tip')
          .offset(function () {
              h = -10;
              if (currentZoom > 0) {
                  console.log(currentZoom);
                  //h = h * currentZoom;
                  console.log(h);
              }
              return [h, 0]
          })
          .html(function (d) {
              return "<strong>Nazwa:</strong> <span style='color:white'>" + d.name + "</span>";
          })

        var svg = d3.select("#diagramTree").append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.right + ")");

        if (showZoom) {
            svg
            .call(zoom);

            var slider = d3.select("#diagramTree").append("p").append("input")
              .datum({})
              .attr("type", "range")
              .attr("value", zoom.scaleExtent()[0])
              .attr("min", zoom.scaleExtent()[0])
              .attr("max", zoom.scaleExtent()[1])
              .attr("step", (zoom.scaleExtent()[1] - zoom.scaleExtent()[0]) / 100)
              .attr("id", "slider")
              .style(width, width);
        }

        var rect = svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .style("fill", "none")
            .style("pointer-events", "all");

        var container = svg.append("g");
        container.attr("id", "container");


        var link = container.append("g")
            .attr("class", "links")
            .selectAll(".link");

        var node = container.append("g")
            .attr("class", "nodes")
            .selectAll(".node");

        container.call(tip);

        /*var link = svg.selectAll(".link"),
            node = svg.selectAll(".node"); */

        var fileName = fileNameInput.files[0].name;

        d3.json(fileName, function (error, json) {
            root = json;
            update();
        });

        function update() {
            var nodes = flatten(root),
                links = d3.layout.tree().links(nodes);

            // Restart the force layout.
            force
                .nodes(nodes)
                .links(links)
                .start();

            // Update the links…
            link = link.data(links, function (d) { return d.target.id; });

            // Exit any old links.
            link.exit().remove();

            // Enter any new links.
            link.enter().insert("line", ".node")
                .attr("class", "link");

            // Update the nodes…
            node = node.data(nodes, function (d) { return d.id; });

            // Exit any old nodes.
            node.exit().remove();

            // Enter any new nodes.
            var nodeEnter = node.enter().append("g")
                  .attr("class", "node")
                  .call(force.drag);
            if (collapse) {
                nodeEnter
                    .on("click", click)
            }
            if (showTip) {

                nodeEnter
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide);
            }
            appendNodes(nodeEnter);
            appendText(nodeEnter);
            updateNodes();
        }

        function zoomed() {
            currentZoom = d3.event.scale;
            container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
            slider.property("value", d3.event.scale);
        }

        function appendNodes(nodeEnter) {
            if (symbolDisplay == 1) {
                nodeEnter.append("rect")
                    .attr("width", 2 * figureSize)
                    .attr("height", 2 * figureSize)
                    .attr("stroke", "black")
                    .attr("stroke-width", 1);

            } else {
                nodeEnter
                .append("circle")
                    .attr("stroke", theme[themeId][0])
                    .attr("stroke-width", 1.5)
                    .attr("r", function (d) { return figureSize; });
            }
        }

        function appendText(nodeEnter) {
            if (textDisplay) {
                nodeEnter.append("text")
                    .attr("font-family", "sans-serif")
                    .attr("font-size", "15px")
                    .attr('pointer-events', 'node')
                    .attr('text-anchor', 'middle')
                    .text(function (d) { return d.name; });
            }
        }

        function updateNodes() {
            if (symbolDisplay == 1) {
                node.select("rect")
    .style("fill", color);
            } else {
                node.select("circle")
     .style("fill", color);

            }
        };

        function color(d) {
            return d._children ? theme[themeId][0] : d.children ? theme[themeId][1] : theme[themeId][2];
        }

        function tick() {
            link.attr("x1", function (d) { return d.source.x; })
                .attr("y1", function (d) { return d.source.y; })
                .attr("x2", function (d) { return d.target.x; })
                .attr("y2", function (d) { return d.target.y; });

            node.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });
        }

        // Toggle children on click.
        function click(d) {
            if (d3.event.defaultPrevented) return; // ignore drag
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }
            update();
        }

        // Returns a list of all nodes under the root.
        function flatten(root) {
            var nodes = [], i = 0;

            function recurse(node) {
                if (node.children) node.children.forEach(recurse);
                if (!node.id) node.id = ++i;
                nodes.push(node);
            }

            recurse(root);
            return nodes;
        }

    };
    function displayJson() {
        var fileName = fileNameInput.files[0].name;
        console.log(fileName);
        $.getJSON(fileName, function (data) {
            var dataJson = data;
            console.log(dataJson);
            var json_text = JSON.stringify(dataJson, null, 4); // Indented 4 spaces
            $("#dataTree").empty();
            $("#dataTree").append("<div class='header'>" + fileName + ":</div><div><pre>" + json_text + "</pre></div>");
        });
    };
    d3.tip = function () {
        var direction = d3_tip_direction,
            offset = d3_tip_offset,
            html = d3_tip_html,
            node = initNode(),
            svg = null,
            point = null,
            target = null

        function tip(vis) {
            svg = getSVGNode(vis)
            point = svg.createSVGPoint()
            document.body.appendChild(node)
        }

        // Public - show the tooltip on the screen
        //
        // Returns a tip
        tip.show = function () {
            var args = Array.prototype.slice.call(arguments)
            if (args[args.length - 1] instanceof SVGElement) target = args.pop()

            var content = html.apply(this, args),
                poffset = offset.apply(this, args),
                dir = direction.apply(this, args),
                nodel = d3.select(node), i = 0,
                coords

            nodel.html(content)
              .style({ opacity: 1, 'pointer-events': 'all' })

            while (i--) nodel.classed(directions[i], false)
            coords = direction_callbacks.get(dir).apply(this)
            nodel.classed(dir, true).style({
                top: (coords.top + poffset[0]) + 'px',
                left: (coords.left + poffset[1]) + 'px'
            })

            return tip
        }

        // Public - hide the tooltip
        //
        // Returns a tip
        tip.hide = function () {
            nodel = d3.select(node)
            nodel.style({ opacity: 0, 'pointer-events': 'none' })
            return tip
        }

        // Public: Proxy attr calls to the d3 tip container.  Sets or gets attribute value.
        //
        // n - name of the attribute
        // v - value of the attribute
        //
        // Returns tip or attribute value
        tip.attr = function (n, v) {
            if (arguments.length < 2 && typeof n === 'string') {
                return d3.select(node).attr(n)
            } else {
                var args = Array.prototype.slice.call(arguments)
                d3.selection.prototype.attr.apply(d3.select(node), args)
            }

            return tip
        }

        // Public: Proxy style calls to the d3 tip container.  Sets or gets a style value.
        //
        // n - name of the property
        // v - value of the property
        //
        // Returns tip or style property value
        tip.style = function (n, v) {
            if (arguments.length < 2 && typeof n === 'string') {
                return d3.select(node).style(n)
            } else {
                var args = Array.prototype.slice.call(arguments)
                d3.selection.prototype.style.apply(d3.select(node), args)
            }

            return tip
        }

        // Public: Set or get the direction of the tooltip
        //
        // v - One of n(north), s(south), e(east), or w(west), nw(northwest),
        //     sw(southwest), ne(northeast) or se(southeast)
        //
        // Returns tip or direction
        tip.direction = function (v) {
            if (!arguments.length) return direction
            direction = v == null ? v : d3.functor(v)

            return tip
        }

        // Public: Sets or gets the offset of the tip
        //
        // v - Array of [x, y] offset
        //
        // Returns offset or
        tip.offset = function (v) {
            if (!arguments.length) return offset
            offset = v == null ? v : d3.functor(v)

            return tip
        }

        // Public: sets or gets the html value of the tooltip
        //
        // v - String value of the tip
        //
        // Returns html value or tip
        tip.html = function (v) {
            if (!arguments.length) return html
            html = v == null ? v : d3.functor(v)

            return tip
        }

        function d3_tip_direction() { return 'n' }
        function d3_tip_offset() { return [0, 0] }
        function d3_tip_html() { return ' ' }

        var direction_callbacks = d3.map({
            n: direction_n,
            s: direction_s,
            e: direction_e,
            w: direction_w,
            nw: direction_nw,
            ne: direction_ne,
            sw: direction_sw,
            se: direction_se
        }),

        directions = direction_callbacks.keys()

        function direction_n() {
            var bbox = getScreenBBox()
            return {
                top: bbox.n.y - node.offsetHeight,
                left: bbox.n.x - node.offsetWidth / 2
            }
        }

        function direction_s() {
            var bbox = getScreenBBox()
            return {
                top: bbox.s.y,
                left: bbox.s.x - node.offsetWidth / 2
            }
        }

        function direction_e() {
            var bbox = getScreenBBox()
            return {
                top: bbox.e.y - node.offsetHeight / 2,
                left: bbox.e.x
            }
        }

        function direction_w() {
            var bbox = getScreenBBox()
            return {
                top: bbox.w.y - node.offsetHeight / 2,
                left: bbox.w.x - node.offsetWidth
            }
        }

        function direction_nw() {
            var bbox = getScreenBBox()
            return {
                top: bbox.nw.y - node.offsetHeight,
                left: bbox.nw.x - node.offsetWidth
            }
        }

        function direction_ne() {
            var bbox = getScreenBBox()
            return {
                top: bbox.ne.y - node.offsetHeight,
                left: bbox.ne.x
            }
        }

        function direction_sw() {
            var bbox = getScreenBBox()
            return {
                top: bbox.sw.y,
                left: bbox.sw.x - node.offsetWidth
            }
        }

        function direction_se() {
            var bbox = getScreenBBox()
            return {
                top: bbox.se.y,
                left: bbox.e.x
            }
        }

        function initNode() {
            var node = d3.select(document.createElement('div'))
            node.style({
                position: 'absolute',
                opacity: 0,
                pointerEvents: 'none',
                boxSizing: 'border-box'
            })

            return node.node()
        }

        function getSVGNode(el) {
            el = el.node()
            if (el.tagName.toLowerCase() == 'svg')
                return el

            return el.ownerSVGElement
        }

        // Private - gets the screen coordinates of a shape
        //
        // Given a shape on the screen, will return an SVGPoint for the directions
        // n(north), s(south), e(east), w(west), ne(northeast), se(southeast), nw(northwest),
        // sw(southwest).
        //
        //    +-+-+
        //    |   |
        //    +   +
        //    |   |
        //    +-+-+
        //
        // Returns an Object {n, s, e, w, nw, sw, ne, se}
        function getScreenBBox() {
            var targetel = target || d3.event.target,
                bbox = {},
                matrix = targetel.getScreenCTM(),
                tbbox = targetel.getBBox(),
                width = tbbox.width,
                height = tbbox.height,
                x = tbbox.x,
                y = tbbox.y,
                scrollTop = document.documentElement.scrollTop || document.body.scrollTop,
                scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft


            point.x = x + scrollLeft
            point.y = y + scrollTop
            bbox.nw = point.matrixTransform(matrix)
            point.x += width
            bbox.ne = point.matrixTransform(matrix)
            point.y += height
            bbox.se = point.matrixTransform(matrix)
            point.x -= width
            bbox.sw = point.matrixTransform(matrix)
            point.y -= height / 2
            bbox.w = point.matrixTransform(matrix)
            point.x += width
            bbox.e = point.matrixTransform(matrix)
            point.x -= width / 2
            point.y -= height / 2
            bbox.n = point.matrixTransform(matrix)
            point.y += height
            bbox.s = point.matrixTransform(matrix)

            return bbox
        }

        return tip
    };

});
