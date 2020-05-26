var dati;
var eventi;

d3.csv("data/events.csv", function (error, csv) {
    if (error) { 
        console.log(error);  //Log the error.
	throw error;
    }

    csv.forEach(function(d){
        var data = d.Date.split(' ')

        d.DateMs = new Date(data[0] +"/"+ data[1] + "/19"+data[2]);

        d.Date = data[0] + " " + data[1];

    });

    eventi = csv;
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

        var dataInizio = d.StartDate.split('/')
        var dataFine = d.EndDate.split('/')

        //devo aggiungere il "19" davanti all'anno se no mi calcola i millisecondi del 2040 anzichè 1940

        d.StartDateMs = new Date(dataInizio[0] +"/"+ dataInizio[1] + "/19"+dataInizio[2]);

        if(d.Nationality == "United Kingdom")
            d.EndDateMs = new Date(dataFine[0] + "/31"  +"/19"+dataFine[2]); //united kingdom ha i dati mensili ma la data di fine è scritta male -> aggiungo il 31
        else
            d.EndDateMs = new Date(dataFine[0] + "/" + dataFine[1] +"/19"+dataFine[2]);




    });

    dati= csv.filter(function(d){

        //timeline delle battaglie non dei bombardamenti
        if(d.CivilianRate != 1 && d.Tags != "air-firebomb" && d.Tags != "air-nuclear" ){
            return d;
        }
    });

    dati = dati.sort(sortByDateAscending);



    createDatiPerPaese("Germany");
    console.log(dati);
});

function sortByDateAscending(a, b) {
    return a.StartDateMs - b.StartDateMs;
}

function createDatiPerPaese(paese){

    //var soldatiMortiTotale = 0;

    var subDati = dati.filter(function(d){

       if(d.Nationality == paese && !isNaN(d.DeathsFinal) ){
            //soldatiMortiTotale += d.DeathsFinal * (1-d.CivilianRate);
            return d;                
        }          
    });

    //d3.select('#totalDeaths').text(numberWithCommas(soldatiMortiTotale));

    createBarChart(subDati, paese, 0);
    createLineChart(subDati);

}

function createBarChart(subDati, paese, daDove){

    var h = 400;
    var w = 800;

    var startBar = 170; 

    var numBars = 9; 


    var colorScale = d3.scaleLinear()
    .domain([0, d3.max(subDati, function (d) {
        return d.DeathsFinal;
    })])
    .range([40,200]);

    //Mostro solo i primi 10 dati
    var datiVisibili = subDati.slice(daDove, daDove + numBars);
   
    var heightScale = d3.scaleLinear()
        .domain([0, d3.max(subDati, function (d) {
                return d.DeathsFinal;
        })])
        .range([0, h-10]);

    var xScale = d3.scaleLinear()
        .domain([0, datiVisibili.length])
        .range([startBar, w]);


    var widthScale = d3.scaleBand()
        .domain(d3.range(datiVisibili.length))
        .range([startBar, w])
        .padding(0.05);


    d3.selectAll(".tooltip").remove().exit();
    


    
    //select
    var bars = d3.select("#bars").selectAll("rect").data(datiVisibili);
    var circles = d3.select("#circles").selectAll("circle").data(datiVisibili);
    
  
    //enter
    bars.enter()
        .append("rect")
        .attr("y", function(d){return h - heightScale(d.DeathsFinal);})
        .attr("x", function(d,i){return xScale(i);})
        .attr("height",function(d){ return heightScale(d.DeathsFinal); })
        .attr("width",function(d){ return widthScale.bandwidth();})
        .style('fill',function(d){ return "rgb( 0,0," + (255 - colorScale(d.DeathsFinal)) +")";});

    circles.enter()
        .append("circle")
        .attr("cy", function(d){return h - heightScale(d.DeathsFinal);})
        .attr("cx", function(d,i){return xScale(i) + widthScale.bandwidth()/2;})
        .attr("r",7)
        .style("fill","orange")
        .style("display",function(d){ 

            var display = "none";

            eventi.forEach(function(d2){

                if(d2.countries!=undefined){
                    var paesi = d2.countries.split("_");

                    if(paesi.includes(d.Nationality) && d2.DateMs <= d.EndDateMs && d2.DateMs >= d.StartDateMs)
                        display = "block"                          
                }

            });
            return display;
        });
    
     //update
     bars
        .transition()
        .duration(500)
        .attr("y", function(d){return h - heightScale(d.DeathsFinal);})
        .attr("height",function(d){ return heightScale(d.DeathsFinal); })
        .attr("width", function(){ return widthScale.bandwidth();})
        .attr("x", function(d,i){return xScale(i);})
        .style('fill',function(d){ return "rgb( 0,0," + (255 - colorScale(d.DeathsFinal)) +")";});

    circles
        .transition()
        .duration(500)
        .attr("cy", function(d){return h - heightScale(d.DeathsFinal);})
        .attr("cx", function(d,i){return xScale(i) + widthScale.bandwidth()/2;})
        .style("display",function(d){ 

            var display = "none";

            eventi.forEach(function(d2){

                if(d2.countries!=undefined){
                    var paesi = d2.countries.split("_");

                    if(paesi.includes(d.Nationality) && d2.DateMs <= d.EndDateMs && d2.DateMs >= d.StartDateMs)
                        display = "block"                          
                }

            });
            return display;
        });

    bars.select("title").remove();
    //exit
    bars.exit().remove();
    circles.exit().remove();

    var xTickValues = [];

    var i;
    for (i = 0; i < datiVisibili.length; i++) {

        var dataAmeta = datiVisibili[i].EndDateMs - (datiVisibili[i].EndDateMs - datiVisibili[i].StartDateMs)/2;
        if(paese == "Italy")
            xTickValues[i] = new Date(dataAmeta).getFullYear();
        else
            xTickValues[i] = meseToNome(new Date(dataAmeta).getMonth()+1)+" "+ new Date(dataAmeta).getFullYear();

    } 

    var AssexScale = d3.scaleBand()
        .domain(xTickValues)
        .range([startBar,w]);

    var xAxis = d3.axisBottom(AssexScale);

    d3.select('#xAxis')
        .call(xAxis)
        .attr("class","tick")
        .attr("transform", "translate(0," + (h+5)  + ")")
        .selectAll("text")
        .attr("transform", "translate(0,5)");


    var AsseyScale = d3.scaleLinear()
        .domain([0, d3.max(subDati, function (d) {
                return d.DeathsFinal;
        })])
        .range([h-10, 5]);

    var yAxis = d3.axisLeft(AsseyScale);  
    
        d3.select('#yAxis')
            .transition().duration(500)
            .attr("transform", "translate("+(startBar-5)+",10)")   
            .call(yAxis);
    
    //onover tooltip
    var tooltip = d3.select("body").append("div") 
            .attr("class", "tooltip")       
            .style("opacity", 0);


    d3.select("#bars")
        .selectAll("rect")
        .on("click",function(d){console.log(d);})
        .on("mouseover",function(d){
            d3.select(this).style("fill", "orange");

            tooltip.transition()    
                    .duration(200)    
                    .style("opacity", .9);  

                    var start = d.StartDate.split('/');
                    var end = d.EndDate.split('/');


            if(d.Nationality == "United Kingdom")

                tooltip.html(
                    "<span class='textImp'> Deaths: </span> " +numberWithCommas(d.DeathsFinal) 
                    +"<br><br> <span class='textImp'> Period:</span> "
                    + meseToNome(+start[0])+ " 19" + start[2]  )
                        .style("left", (d3.event.pageX) + "px")   
                        .style("top", (d3.event.pageY - 48) + "px");
            else
                tooltip.html(
                        "<span class='textImp'> Deaths: </span> " +numberWithCommas(d.DeathsFinal) 
                        +"<br><br> <span class='textImp'> Start Date:</span> "
                        +start[1] + " " + meseToNome(+start[0])+ " 19" + start[2]
                        +"<br><br> <span class='textImp'> End Date:</span> "
                        +end[1] + " " + meseToNome(+end[0])+ " 19" + end[2]  )
                            .style("left", (d3.event.pageX) + "px")   
                            .style("top", (d3.event.pageY - 48) + "px");  
                

        })
        .on('mouseout', function(d, i) {
        
            d3.select(this).style('fill',function(d){ return "rgb( 0,0," + (255 - colorScale(d.DeathsFinal)) +")";});
            
            tooltip.transition()    
            .duration(200)    
            .style("opacity", 0);  

        });

        d3.select("#circles")
        .selectAll("circle")
        .on("mouseover",function(d){

            d3.select(this).attr("r", 9);

            tooltip.transition()    
                    .duration(200)    
                    .style("opacity", .9);  

            var nota = "<span class='textImp'> Big Events:  </span><br><ul>";

            eventi.forEach(function(d2){

                if(d2.countries!=undefined){
                    var paesi = d2.countries.split("_");

                    if(paesi.includes(d.Nationality) && d2.DateMs <= d.EndDateMs && d2.DateMs >= d.StartDateMs)
                        nota += "<li><span class='textImp2'>" +d2.Date + ": </span>" + d2.Info + "</li>"; 
                    
                }
                
            });
            nota+="</ul>"
           
            var start = d.StartDate.split('/');
            var end = d.EndDate.split('/');

            if(nota !=  "<span class='textImp'> Big Events:  </span><br><ul></ul>")
                tooltip.html(
                    "<span class='textImp'> Total Deaths from "  +start[1] + " " + meseToNome(+start[0])
                    +"  to  "  +end[1] + " " + meseToNome(+end[0])+ " </span>: "
                    +numberWithCommas(d.DeathsFinal) +"<br><br>"+nota)
                        .style("left", (d3.event.pageX) + "px")   
                        .style("top", (d3.event.pageY - 48) + "px");  

        })
        .on('mouseout', function(d, i) {
        
            d3.select(this).attr('r',7);
            
            tooltip.transition()    
            .duration(200)    
            .style("opacity", 0);  

        });

        


    if(daDove+numBars >= Object.keys(subDati).length){    
        d3.select("#next").style("display","none");
    }
    else{
        d3.select("#next").style("display","block");
    }

    if(daDove-numBars < 0){    
        d3.select("#prev").style("display","none");
    }
    else{
        d3.select("#prev").style("display","block");
    }

    d3.select("#next")
        .on("click",function(){          
                d3.select("#prev")
                    .style("display","block");

                createBarChart(subDati,paese,daDove+numBars);
            
        });

    d3.select("#prev")
        .on("click",function(d){
            createBarChart(subDati,paese,daDove-numBars);
        });
    


}

function createLineChart(dati){

    var totMorti = 0;
    var data=[];

    dati.forEach(function (d) {

        if(!isNaN(d.DeathsFinal)){
            totMorti += d.DeathsFinal;
            console.log(d);
            var dato = {MortiFinora:totMorti, date:d.StartDate};
        }

        data.push(dato);
    });

    console.log(totMorti);
    console.log(data);

    var aScale = d3.scaleLinear()
        .domain([0, totMorti ])
        .range([0, 580]);

    var iScale = d3.scaleLinear()
        .domain([0, data.length])
        .range([10, 790]);





    var aLineGenerator = d3.line()
        .x(function (d, i) {
            return iScale(i);
        })
        .y(function (d) {
            return 600-aScale(d.MortiFinora); 
        });


    //select
    var chartline_a = d3.select("#line");
    var line_a = chartline_a.selectAll("path").data([data]);

    //enter
    line_a.enter()
        .append("path")
        .datum(data)
        .attr("d", aLineGenerator(data));
    
  
     //update
     line_a.transition()
     .duration(300)
     .attr("d", aLineGenerator(data));
 
    //exit
    line_a.exit().remove();


}


function meseToNome(s){
    switch(s){
        case 1 : s = "Jan" ;
        break;
        case 2 : s = "Feb" ;
        break;
        case 3 : s = "Mar" ;
        break;
        case 4 : s = "Apr" ;
        break;
        case 5 : s = "May" ;
        break;
        case 6 : s = "Jun" ;
        break;
        case 7 : s = "Jul" ;
        break;
        case 8 : s = "Aug" ;
        break;
        case 9 : s = "Sep" ;
        break;
        case 10 : s = "Oct" ;
        break;
        case 11 : s = "Nov" ;
        break;
        case 12 : s = "Dec" ;
        break;
    }

    return s;
}

function dataToNum(s){
    var data = s.split("/");
    data[0] = +data[0];
    data[1]= +data[1];
    data[2] = + data[2]

    return data;
}


function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
