var w = 850,
    h = 900,
    data = [];

var zoom = function () {
    vis.attr('transform', 'translate(' + d3.event.translate +')scale(' + d3.event.scale + ')');
};

var stars = d3.select('#head')
    .append('svg')
    .selectAll('image')
    .data(d3.range(4))
    .enter()
    .append('image')
        .attr({
            'xlink:href': 'chiflag.svg',
            x: function (d) { return 80 + (d * 120); },
            y: 0,
            width: 550,
            height: 250
        });


var vis = d3.select('#container')
    .append('svg')
    .attr({
        id: 'main',
        width: w,
        height: h
    })
    .append('g')
    .call(d3.behavior.zoom()
        .scaleExtent([1, 10])
        .on('zoom', zoom)
    );

var projection = d3.geo.albers()
    .translate([w / 2, h / 2])
    .scale(120000)
    .rotate([87.605, 0])
    .center([0, 41.833])

var path = d3.geo.path()
    .projection(projection);

var init_img_group = function () {
    vis.append('g')
        .attr({
            id: 'img_group',
            transform: 'translate(470, 50)'
        })
};

var mem_actions = {
    enter: function () {
        d3.select(this)
            .select('text')
            .transition().duration(500)
            .style('opacity', 0.9);
        
        d3.select(this)
            .select('circle')
            .transition().duration(500)
            .attr('r', 12);
    
    },
    leave: function (id) {
        d3.select(this)
            .select('text')
            .transition().duration(500)
            .style('opacity', 0);

        d3.select(this)
            .select('circle')
            .transition().duration(500)
            .attr('r', 7);
    }
};

var render_memory = function (row) {
    var group = vis.append('g')
        .on('mouseenter', mem_actions.enter)
        .on('mouseleave', mem_actions.leave);

    group.append('circle')
        .attr({
            cx: projection(row.loc)[0],
            cy: projection(row.loc)[1],
            r: 7
        });

    group.append('text')
        .text('"' + row.memory + '" -' + row.name + ' (' + row.age + ')')
        .classed('hidden', true)
        .attr({
            x: projection(row.loc)[0] - 2,
            y: projection(row.loc)[1] - 11
        });

};

var lm_actions = {
    enter: function (row) {
        return function () {
            var img_group = d3.select('#img_group');

            d3.select(this)
                .select('image')
                .transition().duration(500)
                .attr({
                    x: projection(row.loc)[0] - (28 / 2) - 10,
                    y: projection(row.loc)[1] - (28 / 2) - 10,
                    width: 48,
                    height: 48
                });

            img_group.append('image')
                .attr({
                    id: 'large_img',
                    'xlink:href': row.imageurl,
                    width: 310,
                    height: 310 / row.img_ratio
                });

            img_group.append('text')
                .text('"' + row.caption + '"')
                .attr({
                    id: 'large_cap',
                    x: 310 / 2,
                    y: (310 / row.img_ratio) + 31,
                    'text-anchor': 'middle'
                });
            
            img_group.append('text')
                .text('-' + row.name + ' (' + row.age + ')')
                .attr({
                    id: 'small_cap',
                    x: 310 / 2,
                    y: (310 / row.img_ratio) + 65,
                    'text-anchor': 'middle'
                });            

            img_group
                .transition().duration(500)
                .style('opacity', 1);   
        };             
    },

    leave: function (row) {
        return function () {    
            d3.select(this)
                .select('image')
                .transition().duration(500)
                .attr({
                    x: projection(row.loc)[0] - (28 / 2),
                    y: projection(row.loc)[1] - (28 / 2),
                    width: 28,
                    height: 28
                });

            d3.selectAll('#large_img').transition().duration(500).style('opacity', 0).remove();
            d3.selectAll('#large_cap').transition().duration(500).style('opacity', 0).remove();
            d3.selectAll('#small_cap').transition().duration(500).style('opacity', 0).remove();
        };
    }
};

var render_landmark = function (row) {
    var group = vis.append('g')
        .on('mouseenter', lm_actions.enter(row))
        .on('mouseleave', lm_actions.leave(row));

    group.append('image')
        .attr({
            'xlink:href': 'camera.svg',
            x: projection(row.loc)[0] - (28 / 2),
            y: projection(row.loc)[1] - (28 / 2),
            width: 28,
            height: 28
        });
};

var render_dream = function (row) {
    if (row.memory) {
        render_memory(row);
    } else {
        render_landmark(row);
    }
};

render_map = function () {
    d3.json('wards.json', function(wards_topo) {
        var wards_geo = topojson.feature(wards_topo, wards_topo.objects.wards).features;

        vis.selectAll('path')
            .data(wards_geo)
            .enter()
            .append('path')
                .attr('id', function (d, i) { return i; })
                .attr('d', path);                
        
        var key = 'https://docs.google.com/spreadsheets/d/1R2XHnq9IgJ6edLN2Dn_Tn_U3ZoPE5BEe0Mk1wupmsa8/pubhtml';

        var build_url = function (intersection) {
            var start = 'http://maps.googleapis.com/maps/api/geocode/json?address=',
                end = '&sensor=false',
                mid = intersection.split(' ').join('+') + ',+Chicago,+IL';

            return start + mid + end;
        };

        var process_data = function (rows) {
            rows.forEach(function (row) {
                var clean = row;

                if (row.imageurl) {
                    var img = new Image();
                    img.src = row.imageurl;
                    img.onload = function () { clean.img_ratio = img.width / img.height; };
                }

                d3.json(build_url(row.intersection), function(goog_json) {
                    var lng = goog_json.results[0].geometry.location.lng,
                        lat = goog_json.results[0].geometry.location.lat;
                    
                    clean.loc = [lng, lat];
                    delete clean.intersection;
                    
                    render_dream(clean);
                });
            });
        };

        var load_data = function () {
            Tabletop.init({
                key: key,
                callback: process_data,
                simpleSheet: true
            });
        };        
    
    init_img_group();    
    load_data();
    });
};

render_map();

