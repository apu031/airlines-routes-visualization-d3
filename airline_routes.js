// A global variable to store the data to be visualized
let store = {}

/**
 * This function aynchronusly loads all the data in a promise based fashion.
 */ 
function loadData() {
	return Promise.all([
		// Loading the airline routes data
		//d3.csv("routes.csv"),
		d3.csv("https://raw.githubusercontent.com/apu031/airlines-routes-visualization-d3/master/data/routes.csv"),
		
		// Loading the geoJson map
		//d3.json("countries.geo.json"),
		d3.json("https://raw.githubusercontent.com/apu031/airlines-routes-visualization-d3/master/data/countries.geo.json"),
		
	]).then(datasets => {
		
		store.routes = datasets[0];
		store.geoJSON = datasets[1]
		return store;
	})
}

/**
 * This function aggregates the routes data.
 * It groups the items based on AirlineID, and AirlineName, and count the total number of routes.
 */ 
function groupByAirline(data) {
	console.log(d3)
	// Iterate over each route, producing a dictionary where the keys is are the ailines ids 
	// and the values are the information of the airline.
	let result = data.reduce((result, d) => {
		let currentData = result[d.AirlineID] || {
			"AirlineID": d.AirlineID,
			"AirlineName": d.AirlineName,
			"Count": 0
		}
		
		currentData.Count += 1 // Incrementing the count (number of routes) of ariline.
		
		result[d.AirlineID] = currentData // Saving the updated information in the dictionary using the airline id as key.

		return result;
	}, {})

	// We use this to convert the dictionary produced by the code above, 
	// into a list, that will make it easier to create the visualization. 
	result = Object.keys(result).map(key => result[key])
	
	result = result.sort((result1, result2) => d3.descending(result1.Count, result2.Count)) // Sort the data in descending order of count.
	
	return result
}

/**
 * This function configures the barchart canvas. [elementID = "#AirlinesChart"]
 */ 
function getAirlinesChartConfig(elementID) {
	let width = 350;
	let height = 400;
	let margin = {
		top: 10,
		bottom: 50,
		left: 130,
		right: 10
	}
	
	// The body is the area that will be occupied by the bars.
	// Compute the width of the body by subtracting the left and right margins from the width.
	let bodyHeight = height - margin.top - margin.bottom
	let bodyWidth = width - margin.left - margin.right

	//The container is the SVG where we will draw the chart.
	//In our HTML, it is the svg tag with the id AirlinesChart
	let container = d3.select(elementID)
	
	// Setting the width and height of the container
	container
		.attr("width", width)
		.attr("height", height)

	return { width, height, margin, bodyHeight, bodyWidth, container }
}

/**
 * This function computes the scales for the bars.
 */ 
function getAirlinesChartScales(airlines, config) {
	let { bodyWidth, bodyHeight } = config;
	
	// Using d3.max to get the highest Count value we have on the airlines list.
	let maximunCount = d3.max(airlines.map((d) => d.Count))
	
	
	let xScale = d3.scaleLinear()
						// Setting the domain to go from 0 to the maximun value found for the field 'Count'
						.domain([0, maximunCount])
						// Setting the range to go from 0 to the width of the body
						.range([0, bodyWidth])
						
		
	let yScale = d3.scaleBand()
		.domain(airlines.map(a => a.AirlineName))
		.range([0, bodyHeight])
		.padding(0.2)
		
	return { xScale, yScale }
}

/**
 * This function draws the bars and the linking lines
 */ 
function drawBarsAirlinesChart(airlines, scales, config, elementIdForMap) {
	let {margin, container} = config; // this is equivalent to 'let margin = config.margin; let container = config.container'
	let {xScale, yScale} = scales


	let body = container.append("g")
							.style("transform", `translate(${margin.left}px,${margin.top}px)`)

	let bars = body.selectAll(".bar")
						// Using the .data method to bind the airlines to the bars (elements with class bar)
						.data(airlines)

	//Adding a rect tag for each airline
	bars
		.enter()
		.append("rect")

		.attr("height", yScale.bandwidth())
		.attr("y", (d) => yScale(d.AirlineName))
		//Setting the width of the bar to be proportional to the airline count using the xScale
		.attr("width", d => xScale(d.Count))

		.attr("fill", "#2A5599")

		// Introducing interactions
		// Adding listener for mouseenter
		.on("mouseenter", function(d) {

			// Calling the drawRoutes function passing the AirlineID id 'd'
			drawRoutes(d.AirlineID, elementIdForMap)
			// Changing the fill color of the bar to "#992A5B" as a way to highlight the bar. Hint: use d3.select(this)
			d3.select(this).attr("fill", "#992A5B")
		})
		// Adding listener for mouseleave
		.on("mouseleave", function(d) {
		  
			drawRoutes(null, elementIdForMap) // This will cause the function to remove all lines in the chart since there is no airline withe AirlineID == null.

			// Changing the fill color of the bar back to "#2A5599"
			d3.select(this).attr("fill", "#2A5599")
		})
}

/**
 * This function generates the axes for the barchart.
 */
function drawAxesAirlinesChart(airlines, scales, config){
	let {xScale, yScale} = scales
	let {container, margin, height} = config;
	let axisX = d3.axisBottom(xScale)
				.ticks(5)
	
	// Appending a g tag to the container, 
	// translate it based on the margins and call the axisX axis to draw the bottom axis.
	container.append("g")
				.style("transform", `translate(${margin.left}px,${height - margin.bottom}px)`)
				.call(axisX)

	let axisY = d3.axisLeft(yScale)
	// Appending a g tag to the container, 
	// translate it based on the margins and call the axisY axis to draw the left axis.
	container.append("g")
				.style("transform", `translate(${margin.left}px, ${margin.top}px)`)
				.call(axisY)
}

/**
 * This function draws the barchart.
 */	
function drawAirlinesChart(airlines, elementIdForChart, elementIdForMap) {
	let config = getAirlinesChartConfig(elementIdForChart)
	let scales = getAirlinesChartScales(airlines, config)
	drawBarsAirlinesChart(airlines, scales, config, elementIdForMap)
	drawAxesAirlinesChart(airlines, scales, config);
}

/**
 * This function configures the map canvas. [elementId = "#Map"]
 */ 
function getMapConfig(elementId){
	let width = 600;
	let height = 400;
	let container = d3.select(elementId)
	container
		.attr("height", height)
		.attr("width", width)
	return {width, height, container}
}

/**
 * This function computes the projection required to translate the longitude and latitude into 2D space.
 */ 
function getMapProjection(config) {
	let {width, height} = config;
	let projection = d3.geoMercator()

	// 97 is the zooming effect
	projection.scale(97)
				.translate([width / 2, height / 2 + 20])
			
	store.mapProjection = projection;
	return projection;
}

/**
 * This function draws the base map.
 */ 
function drawBaseMap(container, countries, projection){
	let path = d3.geoPath()
					// Creating a geoPath generator and 
					// setting its projection to be the projection passed as parameter.
					.projection(projection) 

	container.selectAll("path")
				.data(countries)
				.enter()
				.append("path")
				
				// Using the path generator to draw each country
				.attr("d", path)
				.attr("stroke", "#CCCCCC")
				.attr("fill", "#EEEEEE")
}

/**
 * This function draws the map by calling the required functions.
 */ 
function drawMap(geoJeon, elementIdForMap) {
	let config = getMapConfig(elementIdForMap);
	let projection = getMapProjection(config)
	drawBaseMap(config.container, geoJeon.features, projection)
}

/**
 * This function aggregates the routes data.
 * It groups the items based on AirlineID, and AirlineName, and count the total number of routes.
 */ 
function groupByAirport(data) {
	
	// Using reduce to transform a list into a object where each key points to an aiport. 
	// This way makes it easy to check if is the first time we are seeing the airport.
	let result = data.reduce((result, d) => {
		
		// The || sign in the line below means that in case the first option is anything that Javascript consider false (this insclude undefined, null and 0), the second option will be used. 
		// Here if result[d.DestAirportID] is false, it means that this is the first time we are seeing the airport, so we will create a new one (second part after ||)
		let currentDest = result[d.DestAirportID] || {
			"AirportID": d.DestAirportID,
			"Airport": d.DestAirport,
			"Latitude": +d.DestLatitude,
			"Longitude": +d.DestLongitude,
			"City": d.DestCity,
			"Country": d.DestCountry,
			"Count": 0
		}
		currentDest.Count += 1
		result[d.DestAirportID] = currentDest

		//After doing for the destination airport, also updating the airport the airplane is departing from.
		let currentSource = result[d.SourceAirportID] || {
			"AirportID": d.SourceAirportID,
			"Airport": d.SourceAirport,
			"Latitude": +d.SourceLatitude,
			"Longitude": +d.SourceLongitude,
			"City": d.SourceCity,
			"Country": d.SourceCountry,
			"Count": 0
		}
		currentSource.Count += 1
		result[d.SourceAirportID] = currentSource

		return result
	}, {})
	
	// Maping the keys to the actual ariorts, this is an way to transform the object we got in the previous step into a list.
	result = Object.keys(result).map(key => result[key])
	return result
}

/**
 * This function draws all the airports on the map.
 */ 
function drawAirports(airports, elementIdForMap) {
	let config = getMapConfig(elementIdForMap);
	let projection = getMapProjection(config)
	let container = config.container;
		
	let circles = container.selectAll("circle");
					
	circles
		// Binding the airports to the circles using the .data method.
		.data(airports)
		.enter()
		.append("circle")
		.attr("r", 1)

		// Setting the x and y position of the circle using the projection to convert longitude and latitude to x and y position.
		.attr("cx", d => projection([+d.Longitude, +d.Latitude])[0])
		.attr("cy", d => projection([+d.Longitude, +d.Latitude])[1]) 
		// Setting the fill color of the circle to  "#2A5599"
		.attr("fill", "#2A5599")    
}

/**
 * This function draws all the routes on the map. [containerId = "#Map"]
 */ 
function drawRoutes(airlineID, elementIdForMap) {
	let routes = store.routes
	let projection = store.mapProjection 
	let container = d3.select(elementIdForMap)
	
	let selectedRoutes = routes.filter(function(route) {
		return route.AirlineID === airlineID // Filtering the routes to keep only the routes which AirlineID is equal to the parameter airlineID received by the function
	})
	
	let bindedData = container.selectAll("line")
								.data(selectedRoutes, d => d.ID) // This second parameter tells D3 what to use to identify the routes, this hepls D3 to correctly find which routes have been added or removed.
	
	bindedData
		.enter() 
		.append("line") // Using the .enter selector to append a line for each new route.
		.attr("x1", d => projection([+d.SourceLongitude, d.SourceLatitude])[0]) // For each line set the start of the line (x1 and y1) to be the position of the source airport (SourceLongitude and SourceLatitude)
		.attr("y1", d => projection([+d.SourceLongitude, d.SourceLatitude])[1])
		.attr("x2", d => projection([+d.DestLongitude, d.DestLatitude])[0]) // For each line set the end of the line (x2 and y2) to be the position of the source airport (DestLongitude and DestLatitude)
		.attr("y2", d => projection([+d.DestLongitude, d.DestLatitude])[1])
		// Setting the color of the stroke of the line to "#992A2A"
		.style("stroke", "#992A2A")
		// Setting the opacity to 0.1
		.style("opacity", 0.1)
		
	bindedData
		.exit()
		.remove() // Using the .exit function over bindedData to remove any routes that does not satisfy the filter.
}

/**
 * This function calls every other draw functions in proper order.
 */ 
function showData(elementIdForChart, elementIdForMap) {
	//Getting the routes from our store variable
	let routes = store.routes
	console.log(routes)

	// Computing the number of routes per airline.
	let airlines = groupByAirline(store.routes);
	// console.log(airlines)

	// Drawing airlines barchart
	drawAirlinesChart(airlines, elementIdForChart, elementIdForMap)
	
	console.log(elementIdForMap)

	// Drawing map
	drawMap(store.geoJSON, elementIdForMap)

	// Getting the list of the airports
	let airports = groupByAirport(store.routes);

	// Drawing the airports
	drawAirports(airports, elementIdForMap)
}