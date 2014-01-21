d3.csv('change_by_group_trimmed_clean_MANUAL.csv', (x) ->
    
    dataset = x

    w = 900
    h = 900
    svg_pad = h/15
    spacing = .1

    center_rad = h/50
    center_pad = center_rad * (spacing * 2)

    inner_scale = d3.scale.ordinal()
        .domain(d3.range(Object.keys(dataset[0]).length - 2))
        .rangeRoundBands([center_rad + center_pad, h/2 - svg_pad], spacing)

    # see: http://bl.ocks.org/mbostock/5577023
    brew = [
        "#f7fbff"
        "#deebf7"
        "#c6dbef"
        "#9ecae1"
        "#6baed6"
        "#4292c6"
        "#2171b5"
        "#08519c"
        "#08306b"
    ]

    get_brew = (x) ->
        domain = [-1, 1]
        range = brew
        cut = (domain[1] - domain[0]) /  brew.length
        brew[Math.floor(Math.abs(domain[0] - x) / cut)]

    arc = d3.svg.arc()
        .innerRadius((d, i) -> inner_scale(i))
        .outerRadius((d, i) -> inner_scale(i) + inner_scale.rangeBand())
        .startAngle(0)
        .endAngle(2*Math.PI)

    svg = d3.select("body")
        .append("svg")
        .style({
            'position': 'fixed'
            'margin-left': -w/2 + 'px'
            'left': '50%'
            #'background-color': 'rgba(0, 0, 0, 0.7)'
        })
        .attr("width", w)
        .attr("height", h)
        
    svg.append('circle')
        .attr('cx', w/2)
        .attr('cy', h/2)
        .attr('r', center_rad)
        .attr('fill', 'red')

    svg.selectAll("path")
        .data(Object.keys(dataset[0]).slice(2))
        .enter()
            .append("path")
            .attr("transform", "translate(" + w/2 + "," + h/2 + ")")
            .attr("d", arc)
            .attr('fill', (x) -> get_brew(dataset[0][x]))

    svg.append('rect')
        .attr('x', w - svg_pad - svg_pad*1.5)
        .attr('y', svg_pad)
        .attr('height', svg_pad/2)
        .attr('width', svg_pad*1.5)
        .attr('fill', '#6baed6')

    svg.selectAll('text')
        .data([Object.keys(dataset[0])[1]])
        .enter()
            .append('text')
            .attr('id', 'tick')
            .text((x) -> dataset[0][x])
            .attr('x', w - svg_pad - svg_pad*1.5/2)
            .attr('y', svg_pad + svg_pad/4 + 5)
            .attr('text-anchor', 'middle')
            .attr('font-size', 18)    
            .attr('fill', 'white')
            .attr('text-anchor', 'middle')

    svg.append('rect')
        .attr('x', svg_pad)
        .attr('y', svg_pad)
        .attr('height', svg_pad/2)
        .attr('width', svg_pad*1.5)
        .attr('fill', '#6baed6')

    svg.append('text')
        .attr('id', 'control')
        .text('START')
        .attr('text-anchor', 'middle')
        .attr('font-size', 18)
        .attr('x', svg_pad + (svg_pad*1.5)/2)
        .attr('y', svg_pad + svg_pad/4 + 5)
        .attr('fill', 'white')

    i = 1
    step = ->
        svg.selectAll("path")
            .attr('fill', (x) -> get_brew(dataset[i][x]))
        i += 1

        svg.selectAll("#tick")
            .text((x) -> dataset[i - 1][x])

    d3.select('#control')
        .on('click', ->
            cycle = setInterval(->
                if i < dataset.length
                    step()
                else
                    clearInterval(cycle) 
            , 50)
        )

)