var dati;
var WORLD;
var cities;


d3.csv("data/worldcities.csv", function (error, csv) {
    if (error) { 
        console.log(error);  //Log the error.
	throw error;
    }

    cities = csv;
    //console.log(citiesPosition);
    selectPaese("Germany"); 

    
});

d3.csv("data/WW2 Casualties - Incidents.csv", function (error, csv) {
    if (error) { 
        console.log(error);  //Log the error.
	throw error;
    }
    
    csv.forEach(function (d) {
        d.minDeaths = +d.minDeaths;
        d.maxDeaths = +d.maxDeaths;
        d.DeathsFinal = +d.DeathsFinal;
        d.CivilianRate = +d.CivilianRate;
        d.IntentionalRate = +d.IntentionalRate;

    });
    
    //se nei dati è presente la location allora è luogo bombardamento
    dati = csv.filter(function(d){
        if(d.Location != ""){
            return d;
        }

    });

    console.log("dati");
    console.log(dati);

});


d3.json("data/world1938.json", function (error, world) {
    if (error) { 
        console.log(error);  //Log the error.
	throw error;
    }
    
    WORLD = world;
    //console.log(paese); 
    

});

var country;

//creo i dati per il paese
function selectPaese(paese){

    var mappaPaese = WORLD.features.filter(function(d){  
        if(d.properties.NAME == paese) 
            return d;
    })
    country = paese;

    var datiPaese = []
    var locations = [];

    var contoMortiPaese = 0;

    dati.forEach(function(d){
        
            
        if(d.Nationality == paese){

            var contoMortiLocation = 0;

            if(d.DeathsFinal)
                contoMortiPaese += d.DeathsFinal;

       
            //alcune location si ripetono, devo fare un ciclo, sommare i morti e metterli nella stessa location (la data è la stessa)
            //se non ho già calcolato i morti totali per quella location li calcolo
            if(!locations.includes(d.Location)){
                dati.forEach(function(d2){ 
                    
                    if(d.Location == d2.Location)           
                        if(d2.DeathsFinal)
                            contoMortiLocation += d2.DeathsFinal;
                                                   
                                 
                });
                if(d.Location != "Vienna, Germany" && d.Location != "Konigsberg, Germany"){
                    
                    if(contoMortiLocation!=0){ //se non ci sono morti non metto quella location nei dati

                        var dataInizio = d.StartDate.split('/')

                        var dataMs = new Date(dataInizio[0] +"/"+ dataInizio[1] + "/19"+dataInizio[2]);

                        var dato = {Nationality:d.Nationality, DeathsFinal:contoMortiLocation, Location:d.Location, 
                                        Notes:d.Notes, Date:d.StartDate/*Date:date*/, DateMs:dataMs};
                       
                        locations.push(d.Location);
                        datiPaese.push(dato);
                    }
                }
            }
        }
    });    

    var totText = d3.select("#totalDeaths");
    totText.html("Total Deaths by Air-bomb:  <strong style='padding-left:10px;'> " + numberWithCommas(contoMortiPaese)+"</strong>");
    console.log(contoMortiPaese);
    //dati in ordine alfabetico
    datiPaese = datiPaese.sort(sortByName);


    createBarChart(datiPaese);
    drawMap(mappaPaese,datiPaese);

}

function sortByName(a, b) {
    return a.Location.localeCompare(b.Location);
}

//asse x locations, asse y numero morti totali a causa di bombardamenti in quella location
function createBarChart(datiBar){
    console.log(datiBar);
    
    var h = 300;
    var w = 620;

    var startBar = 90; 

    var heightScale = d3.scaleLinear()
        .domain([0, d3.max(datiBar, function (d) {
            return d.DeathsFinal;
        })])
        .range([0, h-5]);

    var xScale = d3.scaleLinear()
        .domain([0, datiBar.length ])
        .range([startBar,w]);

    var widthScale = d3.scaleBand()
        .domain(d3.range(datiBar.length))
        .range([startBar, w])
        .padding(0.05);

    var colorScale = d3.scaleLinear()
        .domain([0, d3.max(datiBar, function (d) {
            return d.DeathsFinal;
        })])
        .range([40,200]);
    
    //select
    var bars = d3.select("#bars").selectAll("rect").data(datiBar);
  
    //enter
    bars.enter()
        .append("rect")
        .attr("y", function(d){return h - heightScale(d.DeathsFinal);})
        .attr("x", function(d,i){return xScale(i);})
        .attr("height",function(d){ return heightScale(d.DeathsFinal);})
        .attr("width",function(d){ return widthScale.bandwidth();})
        .style("fill",function(d){ return "rgb( " + (255 - colorScale(d.DeathsFinal)) +",0,0)";})
        .attr("id",function(d){ return d.Location+"B"});//aggiungo B per distingure id dei barchart e dei cerchi

    
     //update
     bars.transition()
        .duration(500)
        .attr("y", function(d){return h - heightScale(d.DeathsFinal);})
        .attr("x", function(d,i){return xScale(i);})
        .attr("height",function(d){ return heightScale(d.DeathsFinal); })
        .attr("width", function(d){ return widthScale.bandwidth();})
        .style("fill",function(d){ return "rgb( " + (255 - colorScale(d.DeathsFinal)) +",0,0)";})        
        .attr("id",function(d){ return d.Location+"B"});;
    

    //exit
    bars.exit().remove();

    var AsseyScale = d3.scaleLinear()
        .domain([0, d3.max(datiBar, function (d) {
                return d.DeathsFinal;
        })])
        .range([h-5, 0]);

    var yAxis = d3.axisLeft(AsseyScale);  
    
    d3.select('#yAxis')
        .attr("transform", "translate("+(startBar-5)+",5)")   
        .call(yAxis);

    //onover
    var tooltip = d3.select("body").append("div") 
            .attr("class", "tooltip")       
            .style("opacity", 0);

    d3.select("#bars")
        .selectAll("rect")
        .on("click",function(d){console.log(d);})
        .on("mouseover",function(d,i){
            d3.select(this).style("fill", "orange");

            tooltip.transition()    
                    .duration(200)    
                    .style("opacity", .9);  

            var dateBombardamenti = d.Date

            if(d.Notes != "")
                tooltip.html("<span class='textImp2'>" + d.Notes + " </span> <br>"
                    +"<span class='textImp'> Location:</span> " +d.Location
                    +"<br><span class='textImp'> Total Deaths:</span> " +numberWithCommas(d.DeathsFinal)
                    +"<br><br><span class='textImp'> Bombing date :</span> " + dateBombardamenti)  
                        .style("left", (d3.event.pageX + 10) + "px")   
                        .style("top", (d3.event.pageY - 28) + "px");
            else
                tooltip.html("<span class='textImp'> Location:</span> " +d.Location
                    +"<br><span class='textImp'> Total Deaths:</span> " +numberWithCommas(d.DeathsFinal)
                    +"<br><br><span class='textImp'> Bombing date :</span> " + dateBombardamenti)  
                        .style("left", (d3.event.pageX + 10) + "px")   
                        .style("top", (d3.event.pageY - 28) + "px");


            d3.select("[id='" + d.Location + "']")//coloro corrispondente cerchio
                .attr("r",8)
                .style("fill", "orange");

            d3.select("[id='" + d.Location + "']").moveToFront();//lo metto sopra agli altri pallini
            
   
        })
        .on('mouseout', function(d, i) {
        
            d3.select(this).style("fill",  "rgb( " + (255 - colorScale(d.DeathsFinal)) +",0,0)");

            d3.select("[id='" + d.Location + "']")
            .attr("r",5)
            .style("fill", "rgb( " + (255 - colorScale(d.DeathsFinal)) +",0,0)");
        
            
            tooltip.transition()    
            .duration(200)    
            .style("opacity", 0);  

        });


}


function drawMap(world,datiPaese) {

    var projection;

    if(country == "Japan")
        projection = d3.geoMercator()
            .scale(1040)
            .center([0,40]) 
            .translate([-2150,110]);
    else if(country == "Germany")
            projection = d3.geoMercator()
                .scale(1500)
                .center([0,40]) 
                .translate([0,580]);
    else{
        projection = d3.geoMercator()
                .scale(1300)
                .center([0,40]) 
                .translate([350,630]);
    }
    var path = d3.geoPath()
            .projection(projection);


    var mappa = d3.select("#map").selectAll("path").data(world);

        mappa.enter()
            .append("path")
            .attr("d", path)
            .attr("class", "countries")
            .style("fill", "lightgrey")

        mappa.transition().duration(500)
            .attr("d", path);
        
        mappa.exit().remove();

        var citiesPosition = [];

        cities.forEach(function (d) {
            if(d.country == "Japan" || d.country == "Germany" || d.country == "United Kingdom"){
                var coord = projection([d.lng,d.lat]);
                var dato ={location:d.city_ascii +", "+ d.country, Coord:coord}
                citiesPosition.push(dato);
            }
        });

        var colorScale = d3.scaleLinear()
        .domain([0, d3.max(datiPaese, function (d) {
            return d.DeathsFinal;
        })])
        .range([40,200]);

        var cerchi = d3.select("#cerchi").selectAll("circle").data(datiPaese)

        var count = 0;

       cerchi.enter()
            .append("circle")
            .attr("r",5)
            .attr("cx", function(d){
                var pos = citiesPosition.filter(function(item) { 
                    if(item.location == d.Location) {
                        count +=1;
                        return item;
                    }
                    else if(country == "United Kingdom"){ //formato del nome in United kingdom diverso
                        var loc = item.location.split(",");
                        if(loc[0] == d.Location)
                            return item;                            
                    }
                });

                if(pos[0] != undefined)        
                    return pos[0].Coord[0];
            })
            .attr("cy", function(d){
                var pos = citiesPosition.filter(function(item) { 
                    if(item.location == d.Location) {
                        return item;
                    }
                    else if(country == "United Kingdom"){ //formato del nome in United kingdom diverso
                        var loc = item.location.split(",");
                        if(loc[0] == d.Location)
                            return item;    
                    }
                });
                if(pos[0] != undefined)        
                    return pos[0].Coord[1];
            })
            .attr("id",function(d){ return d.Location})
            .style("fill",function(d){ return "rgb( " + (255 - colorScale(d.DeathsFinal)) +",0,0)";});


            console.log(count);

        //update
        cerchi.transition().duration(500)
            .attr("cx", function(d){

                var pos = citiesPosition.filter(function(item) { 
                    if(item.location == d.Location) {
                        return item;
                    }
                    else if(country == "United Kingdom"){ //formato del nome in United kingdom diverso
                        var loc = item.location.split(",");
                        if(loc[0] == d.Location){
                            return item;
                        }
                    }
                });
                if(pos[0] != undefined)        
                    return pos[0].Coord[0];
            })
            .attr("cy", function(d){
                var pos = citiesPosition.filter(function(item) { 
                    if(item.location == d.Location) {
                        return item;
                    }
                    else if(country == "United Kingdom"){ //formato del nome in United kingdom diverso
                        var loc = item.location.split(",");
                        if(loc[0] == d.Location)
                            return item;    
                    }
                });
                if(pos[0] != undefined)        
                    return pos[0].Coord[1];
            })
            .attr("id",function(d){ return d.Location})
            .style("fill",function(d){ return "rgb( " + (255 - colorScale(d.DeathsFinal)) +",0,0)";});


        
        //exit
        cerchi.exit().remove();

        d3.select("#cerchi")
            .selectAll("circle")
            .on("mouseover",function(d){
                d3.select(this).style("fill", "orange");
                d3.select(this).moveToFront();
                d3.select(this).attr("r",8);
                
                d3.select("[id='" + d.Location + "B']")//coloro corrispondente barra
                    .style("fill", "orange");
    
                tooltip.transition()    
                        .duration(200)    
                        .style("opacity", .9); 
                var dateBombardamenti = d.Date;
                           
                        
                if(d.Notes != "")
                    tooltip.html("<span class='textImp2'>" + d.Notes + " </span> <br>"
                                +"<span class='textImp'> Location:</span> " +d.Location
                                +"<br><span class='textImp'> Total Deaths:</span> " +numberWithCommas(d.DeathsFinal)
                                +"<br><br><span class='textImp'> Bombing date :</span><br> " + dateBombardamenti)  
                        .style("left", (d3.event.pageX + 10) + "px")   
                        .style("top", (d3.event.pageY - 28) + "px");
                else
                        tooltip.html(
                                "<span class='textImp'> Location:</span> " +d.Location
                                +"<br><span class='textImp'> Total Deaths:</span> " +numberWithCommas(d.DeathsFinal)
                                +"<br><br><span class='textImp'> Bombing date :</span><br> " + dateBombardamenti)  
                        .style("left", (d3.event.pageX + 10) + "px")   
                        .style("top", (d3.event.pageY - 28) + "px");
             
            })
            .on('mouseout', function(d, i) {
                
                d3.select(this).style("fill","rgb( " + (255 - colorScale(d.DeathsFinal)) +",0,0)");
                d3.select(this).attr("r",5);

                d3.select("[id='" + d.Location + "B']")//coloro corrispondente barra
                .style("fill", "rgb( " + (255 - colorScale(d.DeathsFinal)) +",0,0)");
                
                tooltip.transition()    
                .duration(200)    
                .style("opacity", 0);  
    
            });
            



    var tooltip = d3.select("body").append("div") 
            .attr("class", "tooltip")       
            .style("opacity", 0);
    
    
}

function numberWithCommas(x) {
    return x.toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

d3.selection.prototype.moveToFront = function() {  
    return this.each(function(){
      this.parentNode.appendChild(this);
    });
  };