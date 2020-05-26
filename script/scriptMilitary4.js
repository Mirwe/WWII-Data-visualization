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
        

        
        else if(dataFine[2]!=undefined && !dataFine[2].includes("19"))
            d.EndDateMs = new Date(dataFine[0] + "/" + dataFine[1] +"/19"+dataFine[2]);
        else
            d.EndDateMs = new Date(dataFine[0] + "/" + dataFine[1] +"/"+dataFine[2]);





    });


    dati = csv.filter(function(d){

        if(d.CivilianRate != 1 && d.Tags != "air-firebomb" && d.Tags != "air-nuclear" && !isNaN(d.DeathsFinal) ){
             return d;                }
                
     });
 
     createDatiPerPaese("Germany");


});

function sortByDateAscending(a, b) {
    return a.StartDateMs - b.StartDateMs;
}


function createDatiPerPaese(paese){

    var subDati = dati.filter(function(d){
        
    
       if(d.Nationality == paese )
            return d;           
               
    });

    if(paese == "United Kingdom"){
        var datoMancante = {Nationality:"United Kingdom", StartDate:"3/1/1940", EndDate:"3/31/1940", StartDateMs: new Date("3/1/1940"), EndDateMs: new Date("3/31/1940"), DeathsFinal:0};
        subDati.push(datoMancante);
        var datoMancante = {Nationality:"United Kingdom", StartDate:"9/1/1940", EndDate:"9/31/1940", StartDateMs: new Date("9/1/1940"), EndDateMs: new Date("9/31/1940"), DeathsFinal:0};
        subDati.push(datoMancante);
    }

    



    subDati = subDati.sort(sortByDateAscending);

    console.log(subDati);

    if(paese =="United States")
        createDatiPerUnitedStates(subDati);
    else
        createBarChart(subDati, paese);

}


function createDatiPerUnitedStates(data){

    //in united states ho i dati mensili delle battaglie ma i dati sono molto disordinati;
    //il dicembre del 41 è ripetuto due volte
    //ho anche 4 dati annuali e 1 dato che contiene 5 anni
    //devo riditribuire questi 5 dati

    var mortiMensili = [];
    var altriMorti = [];
    var mortiDicembre = 0;

    data.forEach(function(d){
        
        if(d.StartDate=="12/1/41" && d.EndDate=="12/31/41"){
            mortiDicembre += d.DeathsFinal;

        }


        if(d.EndDateMs-d.StartDateMs>2595600000){ // 2592000000 dati mensili giusti

            if(d.EndDateMs-d.StartDateMs <= 31536000000){// dati annuali, devo ridistribuire
                    
                var data = d.StartDate.split('/')
                    
                var datoPerAnno = {anno: data[2], morteMensile:d.DeathsFinal/12};
                mortiMensili.push(datoPerAnno);

            }else{//c'è un altro dato che raccoglie altri soldati morti in 44 mesi
                    altriMorti.push(d.DeathsFinal/43);
            }
        }
    });



    data.forEach(function(d){
        if(d.EndDateMs-d.StartDateMs<=2592000000){
            var data = d.StartDate.split('/')

            mortiMensili.forEach(function(m){
                if(m.anno == data[2])
                    d.DeathsFinal += m.morteMensile;  
            }) 
            

            if(data[2]!="46" && data[2]!="41"){

                if(data[2]=="45"){   //contiene il mese fino all'8
                    if(data[0]!= "9" && data[0]!= "10" && data[0]!= "11" && data[0]!= "12"){
                        d.DeathsFinal += altriMorti[0]; 
                    }
                }
                else
                    d.DeathsFinal += altriMorti[0];
            }              

        }
   
    });

    var messo = 0

    data = data.filter(function(d){
            
        if(d.EndDateMs-d.StartDateMs<=2595600000 ){

            if(d.StartDate=="12/1/41" && d.EndDate=="12/31/41"){
                if (messo == 0){
                    messo = 1;
                    d.DeathsFinal = mortiDicembre;
                    return d;
                }
            }
            else
                return d;

            }
        })
    

    createBarChart(data, "United States");


}

function createBarChart(data, paese){

    var h = 400;
    var w = 1200;

    var startBar = 170; 

    var colorScale = d3.scaleLinear()
    .domain([0, d3.max(data, function (d) {
        return d.DeathsFinal;
    })])
    .range([40,200]);
   
    var heightScale = d3.scaleLinear()
        .domain([0, d3.max(data, function (d) {
                return d.DeathsFinal;
        })])
        .range([0, h-10]);

    var xScale = d3.scaleLinear()
        .domain([0, data.length])
        .range([startBar, w]);


    var widthScale = d3.scaleBand()
        .domain(d3.range(data.length))
        .range([startBar, w])
        .padding(0.05);


    d3.selectAll(".tooltip").remove().exit();
    


    
    //select
    var bars = d3.select("#bars").selectAll("rect").data(data);
    var circles = d3.select("#circles").selectAll("circle").data(data);
    
  
    //enter
    bars.enter()
        .append("rect")
        .attr("y", function(d){return h - heightScale(d.DeathsFinal);})
        .attr("x", function(d,i){return xScale(i);})
        .attr("height",function(d){ return heightScale(d.DeathsFinal); })
        .attr("width",function(d){ return widthScale.bandwidth();})
        .style('fill',function(d){ return "rgb( 0,0," + (255 - colorScale(d.DeathsFinal)) +")";})
        .on("click",function(d){console.log(d)});

    circles.enter()
        .append("circle")
        .attr("cy", function(d){return h - heightScale(d.DeathsFinal);})
        .attr("cx", function(d,i){return xScale(i) + widthScale.bandwidth()/2;})
        .attr("r",6)
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

    var AssexScale = d3.scaleTime()
        .domain([new Date(data[0].StartDateMs), new Date(data[data.length-1].EndDateMs)])
        .range([startBar,w]);

    if(paese == "Italy"){
        var AssexScale = d3.scaleTime()
        .domain([new Date(data[0].StartDateMs), new Date(data[data.length-1].EndDateMs)])
        .range([startBar,w]);

        AssexScale.nice();
    
    }



    console.log(AssexScale.domain());


    var xAxis = d3.axisBottom(AssexScale);

    d3.select('#xAxis')
        .call(xAxis)
        .attr("class","tick")
        .attr("transform", "translate(0," + (h+5)  + ")")
        .selectAll("text")
        .attr("transform", "translate(0,5)");


    var AsseyScale = d3.scaleLinear()
        .domain([0, d3.max(data, function (d) {
                return d.DeathsFinal;
        })])
        .range([0,h-10]);

    var yAxis = d3.axisLeft(heightScale.range([h-10, 0]));  
    
    d3.select('#yAxis')
            .transition().duration(500)
            .attr("transform", "translate("+(startBar-5)+",10)")   
            .call(yAxis);


    var yGridLine = d3.axisLeft()
            .scale(heightScale)
            .tickSize(-(w-startBar))
            .tickFormat("");
      
    d3.select('#lines')
            .transition().duration(500)
            .attr("transform", "translate("+(startBar-5)+",10)")
            .call(yGridLine);
        
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
        
            d3.select(this).attr('r',6);
            
            tooltip.transition()    
            .duration(200)    
            .style("opacity", 0);  

        });

        



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
    return x.toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
