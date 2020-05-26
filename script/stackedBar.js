var dati;
var Asse = ["Japan", "Italy" ,"Germany","Hungary","Croatia",/*"Slovakia", "Romania", "Bulgaria"*/];
var Alleati = ["United Kingdom","United States","Soviet Union","France", "China",
/*"Australia", "Belgium", "Brazil","Dutch East Indies", "Canada", "Denmark", "Greece", "Netherlands", "New Zealand", "Norway","South Africa",*/ "Poland",  "Yugoslavia"];

var popolazione = [];
var nomi = [];

var datiMortiTot = [];
var datiMortiAsse = [];
var datiMortiAlleati = [];

d3.csv("data/popolazione.csv", function (error, csv) {   
                            
    csv.forEach(function(d){
        d.Popolation = +d.Popolation;
        
        var dato ={Nationality:d.Nationality, Popolazione:d.Popolation, CodeName:d.codeName}
        popolazione.push(dato);
    } )
   
})

d3.csv("data/WW2 Casualties - Incidents.csv", function (error, csv) {
    if (error) { 
        console.log(error);  //Log the error.
	throw error;
    }
    
    csv.forEach(function (d) {
        // Convert numeric values to 'numbers'
        d.DeathsFinal = +d.DeathsFinal;
        d.CivilianRate = +d.CivilianRate;
        d.IntentionalRate = +d.IntentionalRate;
    });
    

    csv.forEach(function (d) {

        if(Asse.includes(d.Nationality) || Alleati.includes(d.Nationality) /*|| altri.includes(d.Nationality)*/){

            var giaPresente = 0;
            //controllo di non avere gia calcolato i morti per quel paese
            datiMortiTot.forEach(function(d2){
                if(d2.Nationality == d.Nationality){
                    giaPresente = 1;
                    return;
                }
            })
            //se non ho calcolato i morti per paese allora li calcolo e lo aggiungo ai dati
            if(giaPresente == 0){
                var contoMorti = 0;
                var contoCivili = 0;
                var contoIncidenti = 0;
                var contoCiviliMortiIncidente = 0;

                csv.forEach(function (d2) {
                    if(d2.Nationality == d.Nationality && !isNaN(d2.DeathsFinal)){
                        contoMorti += d2.DeathsFinal;
                        contoCivili += d2.DeathsFinal * d2.CivilianRate;
                        contoIncidenti += d2.DeathsFinal * (1-d2.IntentionalRate);
                        contoCiviliMortiIncidente += d2.DeathsFinal *  d2.CivilianRate * (1-d2.IntentionalRate);
                    }
                }); 

                var fazione;

                if(Asse.includes(d.Nationality))
                    fazione = 1
                else
                    fazione = 0

                //var percentualePop = contoMorti * 100 / pop;

                var dato = {Nationality:d.Nationality, /*CodeName:name, */MortiTotali:contoMorti,  Soldati:contoMorti-contoCivili,Civili:contoCivili, 
                    Incidenti:contoIncidenti, CiviliIncidente: contoCiviliMortiIncidente, /*Popolazione:pop,PercentualePopDead: percentualePop ,*/Fazione:fazione};

                datiMortiTot.push(dato);

            }
        }
    });

    dati = datiMortiTot

    dati = dati.sort(sortMortiTotali);
    dati = dati.sort(sortAlleati);; // in questo modo i dati sono ordinati per numero vittime totali, prima tutti gli alleati poi asse

    

    console.log(dati);
    
    createBarChart(true);
});



var h = 320;
var w = 850;
var startBar = 100; 

var AssexScale = d3.scaleBand()
.range([startBar,w]);


function createBarChart(soldierFirst/*,percPop*/){

    var xScale = d3.scaleLinear()
        .domain([0, dati.length])
        .range([startBar, w]);

    var heightScale = d3.scaleLinear()
        .domain([0, d3.max(dati, function (d) {
            //if(!percPop)
                return d.MortiTotali;
           /* else
                return  d.MortiTotali * 100 / d.Popolazione;*/
        })])
        .range([0, h]);

    var widthScale = d3.scaleBand()
        .domain(d3.range(dati.length))
        .range([startBar, w])
        .padding(0.05);
    
    if(soldierFirst == true)
        var stack = d3.stack()
            .keys(["Civili", "Soldati"])
            .order(d3.stackOrderReverse)
            .offset(d3.stackOffsetNone);
    else
        var stack = d3.stack()
            .keys(["Civili", "Soldati"])
            .order(d3.stackOrderNone)
            .offset(d3.stackOffsetNone);

    var series = stack(dati);

    var colors = ["rgb(53, 227, 91)","rgb(188, 246, 200)"]


    /*d3.stack().keys(keys)(dati) ritorna:
        key: Civili: d[0] = 0, d[1] = numero civili
        key: Soldati: d[0] = numero civili, d[1] = numero morti totali -> d[1]-d[0] = numero soldati*/ 

    //select
    var groups = d3.select("#bars")
                .selectAll("g")
                .data(series);
    //enter
    groups.enter()
                .append("g")
                .attr("class",function(d){return d.key;})
                .attr("fill", function(d) { 
                    if(d.key == "Soldati")
                            return colors[0];
                    else 
                            return colors[1]; 
                }).selectAll("rect").data(function(d) {return d; })
                .enter()
        .append("rect")
        .attr("x", function(d,i) { return xScale(i); })
        .attr("y", function(d) { return  h - heightScale(d[1] - d[0]) - heightScale(d[0]); })
        .attr("height", function(d) { return heightScale(d[1] - d[0]); })
        .attr("width", widthScale.bandwidth());
        
    
    
    //update
    groups.selectAll("rect").data(function(d) {return d; }).transition()
        .duration(500)
        .attr("x", function(d,i) { return xScale(i); })
        .attr("y", function(d) {
            /*if(percPop)
               return  h - heightScale((d[1] - d[0])*100/d.data.Popolazione) - heightScale(d[0] *100/d.data.Popolazione); 
            else*/
                return  h - heightScale(d[1] - d[0]) - heightScale(d[0]); 
                
        })
        .attr("height", function(d) { 
            /*if(percPop)
                return heightScale((d[1] - d[0])*100/d.data.Popolazione); 
            else*/
                return heightScale(d[1] - d[0]);
            
        })
        .attr("width", widthScale.bandwidth());

    //valori label asse x
    var xTickValues = [];

    var i;
    for (i = 0; i < dati.length; i++) {
        xTickValues[i] = dati[i].Nationality;
    } 

    var xAxis = d3.axisBottom(AssexScale.domain(xTickValues));

    d3.select('#xAxis')
        .call(xAxis)
        .attr("class","tick")        
        .attr("transform", "translate(0," + (h+5)  + ")")       
        .selectAll("text")
        .attr("transform", "translate(0,5)")
        .attr("fill",function(d){if(Asse.includes(d)) return "red"; else return "blue";})
        .style("font-weight","bold")
        .call(wrap, widthScale.bandwidth());

    var yAxis = d3.axisLeft(heightScale.range([h,5]));  
    
    d3.select('#yAxis')
    .transition().duration(500)
        .attr("transform", "translate("+(startBar-5)+",0)")   
        .call(yAxis);
    
    //onover tooltip
    var tooltip = d3.select("body").append("div") 
            .attr("class", "tooltip")       
            .style("opacity", 0);

    var cosa;

    d3.select("#bars")
        .selectAll("rect")
        .on("click",function(d){console.log(d);})
        .on("mouseover",function(d){ 

            if(d3.select(this).style("fill") == colors[0])
                cosa = "Soldiers";
            else
                cosa = "Civilians";

            var fazione;
            if(Alleati.includes(d.data.Nationality))
                fazione = "Allies";
            else
                fazione = "Axis"

            /*if(percPop)
                tooltip.html("<span class='textImp'>"+cosa+"</span> " +((d[1]-d[0])*100/d.data.Popolazione).toFixed(1) +" %")  
                        .style("left", (d3.event.pageX) + "px")   
                        .style("top", (d3.event.pageY - 28) + "px");
             
            else   */             
                tooltip.html("<span class='textNation'>"+d.data.Nationality+"</span>"
                            + "<br><span class='textImp'>"+cosa+"</span> " +numberWithCommas(d[1]-d[0]) )
                        .style("left", (d3.event.pageX) + "px")   
                        .style("top", (d3.event.pageY - 28) + "px");
            
           
            d3.select(this).style("fill", "orange");

            tooltip.transition()    
                    .duration(200)    
                    .style("opacity", .9);  

        })
        .on('mouseout', function(d, i) {
        
            d3.select(this).style("fill",function(d){
                if(cosa == "Civilians")
                    return colors[1];
                else 
                    return colors[0]; 
            });
        
            tooltip.transition()    
                .duration(200)    
                .style("opacity", 0);  
        });
}




function sortMortiTotali(a, b) {
    return a.MortiTotali - b.MortiTotali;
}

function sortSoldati(a, b) {
    return a.Soldati - b.Soldati;
}

function sortCivili(a, b) {
    return a.Civili - b.Civili;
}

function sortAlleati(a, b) {
    return a.Fazione - b.Fazione;
}

function sortAsse(a, b) {
    return b.Fazione - a.Fazione;
}


function sortByValue(val/*,percPop*/){

    var xScale = d3.scaleLinear()
        .domain([0, dati.length])
        .range([startBar, w]);

    var widthScale = d3.scaleBand()
        .domain(d3.range(dati.length))
        .range([startBar, w])
        .padding(0.05);

    d3.select("#bars").selectAll("g").selectAll('rect')
        .sort(function(a, b) {
            if(val == "FazioneAlleati")
                return d3.ascending(a.data.Fazione, b.data.Fazione);
            else if(val == "FazioneAsse")
                return d3.descending(a.data.Fazione, b.data.Fazione);
            else
                return d3.ascending(a.data[val], b.data[val]);
        })
        .transition('sorting')
        .delay(function(d, i){
            return i * 20;
        })
        .duration(1000)
        .attr('x', function(d, i) {
            return xScale(i);
        });

    if(val == "MortiTotali")
        dati = dati.sort(sortMortiTotali)
    else if(val == "Soldati")
        dati = dati.sort(sortSoldati);
    else if(val == "Civili")
        dati = dati.sort(sortCivili);
    else if(val == "FazioneAlleati")
        dati = dati.sort(sortAlleati)
    else if(val == "FazioneAsse")
        dati = dati.sort(sortAsse)

    var xTickValues = [];

    var i;
    for (i = 0; i < dati.length; i++) {
        xTickValues[i] = dati[i].Nationality;
    } 

    var xAxis = d3.axisBottom(AssexScale.domain(xTickValues));

    d3.select('#xAxis').transition().duration(1000).delay(function(d, i){return i * 25;  })
    .call(xAxis);

    setTimeout(() => {     
        d3.select('#xAxis')     
            .selectAll("text") 
            .call(wrap, widthScale.bandwidth());  
    }, 0.1);

}


function numberWithCommas(x) {
    return x.toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function wrap(text, width) {
    
    text.each(function() {

      var text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 1.1, // ems
          y = text.attr("y"),
          dy = parseFloat(text.attr("dy")),
          tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em")
      while (word = words.pop()) {
        line.push(word)
        tspan.text(line.join(" "))
        if (tspan.node().getComputedTextLength() > width) {
          line.pop()
          tspan.text(line.join(" "))
          line = [word]
          tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", `${++lineNumber * lineHeight + dy}em`).text(word)
        }
      }
    })
  }

