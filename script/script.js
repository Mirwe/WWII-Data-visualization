var dati;
var world;

//carico vittime mondiali e le metto in dati
d3.csv("data/WW2 Casualties - Incidents.csv", function (error, csv) {
    if (error) { 
        console.log(error); 
	throw error;
    }
    
    csv.forEach(function (d) {
        // Convert numeric values to 'numbers'
        d.minDeaths = +d.minDeaths;
        d.maxDeaths = +d.maxDeaths;
        d.DeathsFinal = +d.DeathsFinal;
        d.CivilianRate = +d.CivilianRate;
        d.IntentionalRate = +d.IntentionalRate;


    });
    console.log(csv);
    dati = csv;


});

//carico la mappa del mondo del 1938
d3.json("data/world1938.json", function (error, mondo) {
    if (error) { 
        console.log(error); 
	throw error;
    }

    world=mondo;
    drawMap("total");
});


function drawMap(value) {

    /*var colorScale = d3.scaleLinear()
        .domain([0, 20000000])
        .range(['rgb(210,251,255)','rgb(3,19,43)']);*/

    if(value == "total" || value == "civilians" || value =="soldier"){
        var colori = ["#f0f7fd", "rgb(222,235,247)", "rgb(198,219,239)", "rgb(158,202,225)", "rgb(107,174,214)", "rgb(66,146,198)","rgb(33,113,181)","rgb(8,81,156)","rgb(8,30,107)","rgb(3,19,43)"];
        var dominio = [100,1000,10000,100000,500000,1000000,5000000,10000000,16000000,22000000];

        var colorScale = d3.scaleThreshold()//d3.scaleLog()
                    .domain(dominio)
                    .range(colori);                  
    }
    else if(value == "holocaust"){
        var colori = ["rgb(255, 229, 234)", "rgb(255, 179, 192)", "rgb(255, 128, 150)", "rgb(255, 77, 108)", "rgb(255, 26, 66)", "rgb(230, 0, 40)","rgb(179, 0, 31)","rgb(128, 0, 22)","rgb(77, 0, 13)","rgb(26, 0, 4)"];
        var dominio = [100,1000,10000,100000,200000,400000,800000,1000000,2000000,3000000];

        var colorScale = d3.scaleThreshold()
                    .domain(dominio)
                    .range(colori);

    }

    projection = d3.geoMercator()
    .scale(140)
    .center([0,40]) 
    .translate([410,290]);

    var path = d3.geoPath()
            .projection(projection);
    
    //select
    var map = d3.select("#map").selectAll("path")
                .data(world.features);

    //enter
    map.enter()
            .append("path")
            .attr("d", path)
            .attr("class", "countries")
            .style("fill", function(d) { 

                var countDeaths = 0;
                //conto numero vittime
                dati.forEach(function (d2) {

                    if(d2.Nationality == d.properties.NAME && !isNaN(d2.DeathsFinal))

                        if(value == "holocaust" && d2.Tags =="holocaust-jewish")
                            countDeaths += d2.DeathsFinal;
                        else if(value == "total")
                            countDeaths += d2.DeathsFinal;
                        else if(value == "civilians")
                            countDeaths += d2.DeathsFinal * d2.CivilianRate;
                        else if(value == "soldier")
                            countDeaths += d2.DeathsFinal * (1-d2.CivilianRate);

                });
                //coloro in base al numero di vittime
                return colorScale(countDeaths); 
            });

    //update
    map.transition()
     .duration(1000)
     .style("fill", function(d) { 

        var countDeaths = 0;
        
        dati.forEach(function (d2) {

            if(d2.Nationality == d.properties.NAME && !isNaN(d2.DeathsFinal)){

                if(value == "holocaust" && d2.Tags =="holocaust-jewish")
                    countDeaths += d2.DeathsFinal;
                else if(value == "total")
                    countDeaths += d2.DeathsFinal;
                else if(value == "civilians")
                    countDeaths += d2.DeathsFinal * d2.CivilianRate;
                else if(value == "soldier")
                    countDeaths += d2.DeathsFinal * (1-d2.CivilianRate);
            }
        });

        return colorScale(countDeaths); });


    var tooltip = d3.select("body").append("div") 
            .attr("class", "tooltip")       
            .style("opacity", 0);
    
    
    d3.select("#map")
            .selectAll("path.countries")
            .on('mouseover', function(d, i) {
                
                d3.select(this).style("fill", "orange");

                var countDeaths = 0;

                dati.forEach(function (d2) {
                    if(d2.Nationality == d.properties.NAME && !isNaN(d2.DeathsFinal)){
                   
                        if(value == "holocaust" && d2.Tags =="holocaust-jewish")
                            countDeaths += d2.DeathsFinal;
                        else if(value == "total")
                            countDeaths += d2.DeathsFinal;
                        else if(value == "civilians")
                            countDeaths += d2.DeathsFinal * d2.CivilianRate; 
                        else if(value == "soldier")
                            countDeaths += d2.DeathsFinal * (1-d2.CivilianRate);
                    }
                });
                                
                tooltip.transition()    
                    .duration(200)    
                    .style("opacity", .9);  
                var testo;
                
                if(value =="holocaust")
                    testo = "Holocaust victims:";
                else if( value == "total")
                    testo = "Total casualties:";
                else if(value == "soldier")
                    testo = "Military casualties:";
                else if(value == "civilians")
                    testo = "Civilian casualties:"

                tooltip.html("<strong>" +d.properties.NAME+"</strong>" + "<br> <span class='textImp'>"+ testo +"</span> " +numberWithCommas(countDeaths))  
                    .style("left", (d3.event.pageX) + "px")   
                    .style("top", (d3.event.pageY - 28) + "px");  
                
            })
            .on('mouseout', function(d, i) {

                var countDeaths = 0;
                
                dati.forEach(function (d2) {
                    if(d2.Nationality == d.properties.NAME && !isNaN(d2.DeathsFinal) )
                        if(value == "holocaust" && d2.Tags =="holocaust-jewish")
                            countDeaths += d2.DeathsFinal;
                        else if(value == "total")
                            countDeaths += d2.DeathsFinal;
                        else if(value == "civilians")
                            countDeaths += d2.DeathsFinal * d2.CivilianRate;
                        else if(value == "soldier")
                            countDeaths += d2.DeathsFinal * (1-d2.CivilianRate);
                        
                    
                });
        
                d3.select(this).style('fill',colorScale(countDeaths));
                
                tooltip.transition()    
                .duration(200)    
                .style("opacity", 0);  

            });

    //creo leggenda
    var quadrati = d3.select("#legend")
                        .selectAll("rect.colore")
                        .data(colori);

    quadrati
        .enter()
        .append("rect")
        .attr("class","colore")
        .attr("x", 20)
        .attr("y",function(d,i){return i*20+10;})
        .attr("width",20)
        .attr("height",20)
        .attr("fill", function(d){return d});

    quadrati.transition()
        .duration(1000)
        .attr("fill", function(d){return d});

    var testi =  d3.select("#legend ")
                    .selectAll("text")
                    .data(dominio);

   
    testi.enter()
        .append("text")
        .attr("x", 45)
        .attr("y",function(d,i){return i*20+25;})
        .text(function(d){return "< " + numberWithCommas(d);})
        .attr("font-size","12px");

    testi.transition()
        .duration(1000).text(function(d){return "< " + numberWithCommas(d);})


}

function numberWithCommas(x) {
    return x.toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}