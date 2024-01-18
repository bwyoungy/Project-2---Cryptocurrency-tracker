// use IIFE
(()=>{ 
    "use strict"

    /* Initialise global variables all coins, faveCoins, and data for report */
    let coins = new Map();
    let faveCoins = [];
    let reportData = new Map();

    /* Initialise global variables to save exchange rate of USD and set default as 0 */
    let exchangeUSDtoILS = 0;
    let exchangeUSDtoEUR = 0;
    // Get exchange rates from API
    loadExchangeRatesFromAPI();

    /* Initialise global variable for expiration time of coins data we fetched from API
       (currently is one hour: 1000 ms * 60 seconds in a minute * 60 minutes in an hour) */
    const coinsDataExpirationTime = 1000*60*60;

    /* Save variables of objects from DOM used a few times to lower times DOM is accessed */
    const homeFrameObj = document.getElementById("homeFrame");
    const reportFrameObj = document.getElementById("reportFrame");

    loadCoinsOnPage();

    // Add search event to searchbox and searchtype selector
    document.getElementById("searchBox").addEventListener("keyup", searchCoins);
    document.getElementById("searchType").addEventListener("change", searchCoins);

    // Show home frame on load
    homeFrameObj.style.display="grid";

    // Iterate over link objects to the frames - marked in HTML with class="frameLink"
    for (const aLink of document.getElementsByClassName("frameLink")) {
        // For each link object add a click event with a function to show only that frame
        aLink.addEventListener("click", function(){
            // Hide all frames
            for (const frame of document.getElementsByClassName("frame")) {
                frame.style.display="none";
            }
            
            // If the report frame was clicked, load the report data
            if (aLink.dataset.frame === "reportFrame") loadReportFrame();
            
            // Show the frame based on the link clicked (alink data-frame corresponds to section id)
            document.getElementById(this.dataset.frame).style.display="grid";
        });
    }

    // Function which saves information to localStorage as well as duration until expiry
    // param key: The key by which the information will be saved to localStorage
    // param value: The information to save
    // param duration: The time (in milliseconds) until entry in localStorage will expire
    function saveToLocalStorage(key, value, duration) {
        // Get current DateTime
        const now = new Date();
        
        // Create item to save to localStorage, consisting of the value and the expiry DateTime
        const item = {
            value: value,
            expiry: now.getTime() + duration
        };

        // Save the item in localStorage
        localStorage.setItem(key, JSON.stringify(item));
    }

    // Function which fetches information from localStorage, after checking if it's expired
    // param key: The key by which the information is saved in localStorage
    function fetchFromLocalStorage(key) {
        // Get the data from localStorage based on key
        const data = localStorage.getItem(key);

        // Check if data was retrieved, otherwise return null
        if (!data) return null;

        // Parse the data to recieve a workable item
        const item = JSON.parse(data);

        // Get current DateTime
        const now = new Date();

        // Check if current DateTime is beyond expiry DateTime
        // If it is remove the data from the localStorage and return null
        if (now.getTime() > item.expiry) {
            localStorage.removeItem(key);
            return null;
        }

        // If data was retrieved and expiry DateTime has not passed, return the value
        return item.value;
    }
    
    // Asynchronical function which loads exchange rates from API
    async function loadExchangeRatesFromAPI() {
        try {
            // Fetch exchange rates from API
            const response = await fetch("https://api.frankfurter.app/latest?from=USD&to=EUR,ILS");
            const ratesAPI = await response.json();

            // Set exchange rates
            exchangeUSDtoILS = ratesAPI.rates.ILS;
            exchangeUSDtoEUR = ratesAPI.rates.EUR;

        } catch (error) {
            // Alert user there was a problem retrieving the information
            alert("There was an error retrieving the information from the Exchange Rates API. Please try reloading the page or reach out to us.");
        }
    }

    // Load coins on page, from API or localStorage
    function loadCoinsOnPage() {
        
        // fetch coins JSON from localStorage
        let coinsJSON = fetchFromLocalStorage("coinsJSON");
        
        // If localStorage is null or undefined, get info from API and display appropriate message
        if (coinsJSON === null || coinsJSON === undefined) {
            loadCoinsFromAPI();
            homeFrameObj.innerHTML = `<div class="loader"></div>`;
        }
        else {
            // Load coins from localStorage
            fillCoinsMap(coinsJSON);

            // Display all coins
            displayCoins(coins.values(), homeFrameObj);
        }
    }

    // Asynchronical function which loads the coin information from the CoinGecko API
    async function loadCoinsFromAPI() {
        try {
            // Fetch coins from API and load the coins array with the json
            const response = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd");
            const coinsAPI = await response.json();
            // Save coins to localStorage
            saveToLocalStorage("coinsJSON", coinsAPI, coinsDataExpirationTime);
            
            // Load coins from localStorage
            fillCoinsMap(coinsAPI);

            // Display all coins
            displayCoins(coins.values(), homeFrameObj);

        } catch (error) {
            // Alert user there was a problem retrieving the information
            alert("There was an error retrieving the information from the CoinGecko API. Please try reloading the page or reach out to us.");
        }
    }

    // Saves coin information to the global coin map, based on a JSON coins string
    function fillCoinsMap(coinsJSON) {
        // Iterate over  the coins in JSON form and add each one to map variable with the key being the coin id
        for (const coin of coinsJSON) {
            coins.set(coin.id, coin);
        }
    }

    // Shows coins to the user
    // param coinsToShow: A collection of the coins to show 
    // param objToDisplay: The object on which to print the coins
    function displayCoins(coinsToShow, objToDisplay) {
        // initialise html string as empty
        let html = "";

        // Iterate over the coins and each one to the html
        for (const coin of coinsToShow) {
            html += createCoinCard(coin);
        }

        // Update display of coins on object passed in parameter
        objToDisplay.innerHTML = html;

        // Iterate over glyphicon star objects
        for (const star of document.getElementsByClassName("glyphicon-star")) {
            // For each star object add a click event with favouriteCoin function
            star.addEventListener("click", favouriteCoin);

            // Check if coin is favourited and colour accordingly
            if (faveCoins.includes(star.parentElement.dataset.coinid))
                star.style.color = "gold";
        }

        // Iterate over more info button objects - marked in HTML with class="moreInfoBtn"
        for (const btn of document.getElementsByClassName("moreInfoBtn")) {
            // For each btn object add a click event with toggleInfo function
            btn.addEventListener("click", toggleInfo);
        }
    }

    // Create a coin card based on coin argument
    function createCoinCard(coin) {
        const coinCard = `
        <div class="coinCard" data-coinid="${coin.id}">
            <span class="glyphicon glyphicon-star"></span>
            <span>${coin.name}</span><br>
            <span>Symbol: ${coin.symbol}</span><br>
            <img src="${coin.image}" alt="Image of ${coin.name}" class="coinImage"><br>
            <span></span>
            <button class="moreInfoBtn">More Info</button>
        </div>`;

        return coinCard;
    }

    // Displays or collapses extra information (coin price in different currencies) for the coin clicked
    function toggleInfo() {
        // Initialise extraInfo as empty
        let extraInfo = "";

        // Checking which situation we are in:
        // if text says "More Info", we want to display the extra info
        if(this.innerHTML === "More Info") {
            // Update text shown to opposite
            this.innerHTML = "Hide Info";
            
            // For ease of code create variable saving the coin's prices in USD
            // The global coins map is accessed via the coin id we had saved in the dataset of the parent element when building the html
            let coinUSDPrice = coins.get(this.parentElement.dataset.coinid).current_price;
            // Set extraInfo as coin price in USD, Euro, and Shekels (per specification request).
            // USD is per API data, Euro & Shekels calculated per exchange rate recieved from exchange rate API
            extraInfo = `Market value of coin:<br>
            $${coinUSDPrice.toFixed(2)}<br>
            €${(coinUSDPrice * exchangeUSDtoEUR).toFixed(2)}<br>
            ₪${(coinUSDPrice * exchangeUSDtoILS).toFixed(2)}<br>`
            
        }
        // if text says "Hide Info", we want to collapse it (setting the text as empty which is the init, so no need to change in else cause)
        else {
            // Update text shown to opposite
            this.innerHTML = "More Info";
        }

        // Set the span element above the button clicked with the extraInfo (either coin prices or empty string, depending if we are displaying or collapsing)
        this.previousElementSibling.innerHTML = extraInfo;
    }

    // Search for coins based on user's input in the searchBox and searchType chosen
    function searchCoins() {
        // Save searchTerm from searchBox and convert to lowerCase to increase compatibility
        let searchTerm = document.getElementById("searchBox").value.toLowerCase();

        // Save searchType chosen from select box
        let searchType = document.getElementById("searchType").value;

        // If search term is empty, display all coins
        if (searchTerm === "") displayCoins(coins.values(), homeFrameObj);
        // Otherwise filter by search term, creating new map from filtered array checking if the symbol contains the search term (per specification request)
        else {
            const filteredCoins = new Map(Array.from(coins).filter(([key,value]) => {
                // Check the property of the coin being checked based on the searchType (using eval to prevent code duplication and unnecessary conditions) to see if includes searchTerm
                if (eval(`value.${searchType}.toLowerCase().includes(searchTerm)`))
                    return true;
                return false;
            }));
            // Display only filtered coins to user
            displayCoins(filteredCoins.values(), homeFrameObj);
        }

    }

    // Adds coin to array of favourites
    function favouriteCoin() {
        // For ease of coin save coin id saved in the dataset of the parent element when building the html
        let thisCoinID = this.parentElement.dataset.coinid;

        // Check if star colour is gold (favourited) or not
        if (this.style.color === "gold") {
            // Check where we are clicking from
            // If clicking from homeFrame - unfavouriting by choice
            if (this.parentElement.parentElement.id === "homeFrame") {
                // Change colour to none (not-favourited)
                this.style.color = "";

                // Delete coin id from faveCoins array using splice method
                faveCoins.splice(faveCoins.indexOf(thisCoinID), 1);
            }
            // Otherwise clicking from modal - picking a coin to be replaced by 6th coin
            else {
                faveCoins.push(document.getElementById("modalCoinPicked").firstElementChild.dataset.coinid);
                // Delete coin id from faveCoins array using splice method
                // Coin ID gotten from parent element of star clicked
                faveCoins.splice(faveCoins.indexOf(this.parentElement.dataset.coinid), 1);
                
                // Close modal
                document.getElementById("replacementModal").style.display = "none";

                // Display all coins again, otherwise will show old favourites not updated
                // Using searchCoins function, so if user was mid-search when modal popped-up, will continue showing search results and not all coins
                searchCoins();
            }
        }
        else {
            // Check if there are five favourite coins yet
            // If not proceed with adding
            if (faveCoins.length < 5) {
                // Change colour to gold (favourited)
                this.style.color = "gold";

                // Add coin id to faveCoins array
                faveCoins.push(thisCoinID)
            }
            // otherwise offer replacing
            else {
                popUpCoinReplacement(thisCoinID)
            }
        }

        // Update favourite coins on marquee
        displayFaveCoinsMarquee();

    }

    // Shows favourite coins on marquee
    function displayFaveCoinsMarquee() {
        // Initialize html to display on marquee
        let marqueeHTML = "";

        // Check if there are coins favourited
        // If there aren't, display welcome to site message
        if (faveCoins.length === 0) marqueeHTML = "Welcome to the Cryptocurrency tracker!";
        // Otherwise, display favourite coins
        else {
            marqueeHTML += "Favourites: "
            // Iterate over faveCoins (id of coins favourited)
            for (const id of faveCoins) {
                // Getting the coin from the coins map
                let coinById = coins.get(id);
                // Add to marquee the symbol and price of the coin
                marqueeHTML += `${coinById.symbol} $${coinById.current_price.toFixed(2)}, `;
            }

            // Remove last comma and space for display
            marqueeHTML = marqueeHTML.slice(0,-2);
        }

        // Set marquee text on page
        document.getElementById("siteMarquee").innerHTML = marqueeHTML;
    }

    // Pops up a modal in which user can choose coin to be replaced by 6th coin clicked or can cancel
    function popUpCoinReplacement(thisCoinID) {
        // Save modal object to variable so as not to need to access DOM every time
        const replacementModal = document.getElementById("replacementModal");
        // Show the modal
        replacementModal.style.display = "block";
        // Add click event to cancel button that will close the modal (sets display as none)
        document.getElementById("closeModal").addEventListener("click", function(){
            replacementModal.style.display = "none";
        })
        // Adds click event to window outside of modal to close modal when clicking outside (acts like cancel button)
        window.addEventListener("click", function(event){
            if (event.target == replacementModal) {
                replacementModal.style.display = "none";
            }
        })

        // Show the coin picked, by sending it as an array of 1 to displayCoins function,
        // and sending modalCoinPicked element as the object to display on
        displayCoins([coins.get(thisCoinID)], document.getElementById("modalCoinPicked"));

        // Convert faveCoins (array of coin ids) to map to be able to send to displayCoins function
        const faveCoinsMap = new Map(Array.from(coins).filter(([key,value]) => {
            if (faveCoins.includes(value.id)) return true;
            return false;
        }));
        // Show currentFavourite coins, by sending them as an array to displayCoins function,
        // and sending modalFavouriteCoins element as the object to display on
        displayCoins(faveCoinsMap.values(), document.getElementById("modalFavouriteCoins"));
    }

    // Loads information for coins report
    async function loadReportFrame() {
        // Check if there are no favourite coins and display appropriate message if so
        if (faveCoins.length === 0) reportFrameObj.innerHTML = "There are no favourite coins selected. Go back to home page and favourite some coins so we can show the report for them.";
        // If there is no info in report data, get info from API and display appropriate message
        else {
            reportFrameObj.innerHTML = `<div id="reportLoad" class="loader"></div>`;
            
            reportFrameObj.innerHTML += `
            <div id="reportArea" display="none">
                <canvas id="reportCanvas" style="width:100%;max-width:700px"></canvas>
                <label for="reportPeriod">Time range for report:</label>
                <select id="reportPeriod">
                    <option value="7">1 week</option>
                    <option value="14">2 weeks</option>
                    <option value="30" selected>1 month</option>
                    <option value="90">3 months</option>
                    <option value="120">6 months</option>
                    <option value="270">9 months</option>
                    <option value="365">1 year</option>
                </select>
                <label for="reportCurrency">Currency for report:</label>
                <select id="reportCurrency">
                    <option value="usd" selected>US Dollar</option>
                    <option value="eur">Euro</option>
                    <option value="ils">New Israeli Shekel</option>
                </select>
            </div>
            `;

            document.getElementById("reportArea").style.display="none";

            // Create chart object - as we will update the data and redraw we need to use the same object throughout (also send it to called functions as a parameter)
            let chart = new Chart("reportCanvas", {type: "line", options: {legend: {display:true}}});
    
            // Bind event to draw report to change of value in selected period or currency
            document.getElementById("reportPeriod").addEventListener("change", loadReportData.bind(document.getElementById("reportPeriod"), chart));
            document.getElementById("reportCurrency").addEventListener("change", loadReportData.bind(document.getElementById("reportCurrency"), chart));

            loadReportData(chart);
        }
    }

    // Load the data for the report from CryptoCompare API
    async function loadReportData(chart) {
        await loadReportDataFromAPI();
        
        let reportLoadObj = document.getElementById("reportLoad");

        // If we have information in reportdata, draw the report (to avoid situations user picked only coins which CryptoCompare API doesn't have info for)
        if (reportData.size > 0) {
            drawReport(chart);
            
            // Hide loading message
            reportLoadObj.style.display="none";
            // Show report
            document.getElementById("reportArea").style.display="block";
        }
        // Display message to user to explain why report hasn't loaded
        else {
            reportLoadObj.innerText="The CryptoCompare API doesn't contain information for the coins favourited";
            reportLoadObj.className="";
        }
    }

    // Asynchronical function which loads the coin information from the CryptoCompare API
    async function loadReportDataFromAPI() {
        try {        
            // Empty reportData map as we want only current favourite coins and not information which might've stayed from previous use
            reportData.clear();
            
            // Iterate over favourite coins
            for (const coinID of faveCoins) {
                // Fetch report data for coin from API (with currency and range based on selection on HTML page)
                const response = await fetch(`https://min-api.cryptocompare.com/data/v2/histoday?fsym=${coins.get(coinID).symbol}&tsym=${document.getElementById("reportCurrency").value}&limit=${document.getElementById("reportPeriod").value}`);
                const coinsDataJSON = await response.json();
                
                // Check that we recieved a response, in case of mismatch between the 2 APIS (for example: mnt & tao don't exist in CryptoCompare)
                // and add new object to reportData map, containing coinID and the prices
                if (coinsDataJSON.Response === "Success") reportData.set(coinID, coinsDataJSON.Data.Data);
            }
        } catch (error) {
            // Alert user there was a problem retrieving the information
            alert("There was an error retrieving the information from the CryptoCompare API. Please try reloading the page or reach out to us.");
        }
    }

    // Function which draws the coins report
    function drawReport(chart) {
        // Initialise empty array for values of days which will be the x-axis of the chart
        const dayValues = [];

        // Initialise empty array for values of coins which will be the y-axis of the chart
        // this will be an array of objects, each one containing "label" (coinID), "data" (array of coin Values per day), "borderColor", and "fill"
        const coinValues = [];

        // Initialise an array of colours for the different line colours (5 maximum)
        const lineColours = ["red", "green", "blue", "purple", "orange"];
        // Initialise counter for colours
        let colourCount = 0;

        // Iterate over the data in the first map entry (there's always at least one by this point) to save day data for x-axis
        for (const data of reportData.values().next().value) {
            // Convert data (saved in milliseconds) to a date
            let dataDate = new Date(data.time*1000);
            
            // Save to x-axis array the format to display to the user: a string with the day of the month and the short form of the month
            dayValues.push(dataDate.getDate() + " " + dataDate.toLocaleString('default', { month: 'short' }));
        }

        // Iterate over reportData map and save coin values to array in objects for y-axis
        for (const [coinID, data] of reportData) {
            // Initialise empty array to save daily coin values
            let dataValues = [];
            // Iterate over daily data and save the daily coin data (end of day close value) to use for y-axis
            for (const dayData of data) dataValues.push(dayData.close);

            // Add to coin values the daily data for current coin iterated
            coinValues.push({
                label: `${coins.get(coinID).name} (${coins.get(coinID).symbol})`,
                data: dataValues,
                borderColor: lineColours[colourCount++], // choose current colour and advance counter
                fill: false
            });
        }

        // Update data for chart
        chart.data.labels = dayValues;
        chart.data.datasets = coinValues;
        chart.update();
    }
})()