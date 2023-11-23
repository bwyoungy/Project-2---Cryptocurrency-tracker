// use IIFE
(()=>{ 
    "use strict"

    // Initialise global variable as a map to hold coins
    let coins = new Map();
    loadCoinsOnPage();

    // Add search event to searchbox
    document.getElementById("searchBox").addEventListener("keyup", searchCoins);

    // Show home frame on load
    document.getElementById("homeFrame").style.display="grid";

    // Iterate over link objects to the frames - marked in HTML with class="frameLink"
    for (const aLink of document.getElementsByClassName("frameLink")) {
        // For each link object add a click event with a function to show only that frame
        aLink.addEventListener("click", function(){
            // Hide all frames
            for (const frame of document.getElementsByClassName("frame")) {
                frame.style.display="none";
            }
            // Show the frame based on the link clicked (alink data-frame corresponds to section id)
            document.getElementById(this.dataset.frame).style.display="grid";
        });
    }

    // Load coins on page, from API or localstorage
    function loadCoinsOnPage() {
        // If coins null or empty, get info from API
        if (coins === null || coins.size === 0) loadCoinsFromAPI();

        // Load coins from localStorage and parse from JSON
        fillCoinsMap(JSON.parse(localStorage.getItem("coinsJSON")));

        // Display all coins
        displayCoins(coins.values());
    }

    // Asynchronical function which loads the coin information from the CoinGecko API
    async function loadCoinsFromAPI() {
        try {
            // Fetch coins from API and load the coins array with the json
            const response = await fetch("https://api.coingecko.com/api/v3/coins/");
            const coinsAPI = await response.json();
            // Save coins in localStorage as JSON
            localStorage.setItem("coinsJSON", JSON.stringify(coinsAPI));

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
    function displayCoins(coinsToShow) {
        // initialise html string as empty
        let html = "";

        // Iterate over the coins and each one to the html
        for (const coin of coinsToShow) {
            html += `
            <div class="coinCard">
                <span class="glyphicon glyphicon-star"></span>
                <span>${coin.name}</span><br>
                <span>Symbol: ${coin.symbol}</span><br>
                <img src="${coin.image.small}" alt="Image of ${coin.name}"><br>
                <span></span>
                <button data-coinid="${coin.id}" class="moreInfoBtn">More Info</button>
            </div>`
        }

        // Update display of coins on home section
        document.getElementById("homeFrame").innerHTML = html;

        // Iterate over glyphicon star objects
        for (const star of document.getElementsByClassName("glyphicon-star")) {
            // for each star object add a click event with favouriteCoin function
            star.addEventListener("click", favouriteCoin);
        }

        // Iterate over more info button objects - marked in HTML with class="moreInfoBtn"
        for (const btn of document.getElementsByClassName("moreInfoBtn")) {
            // for each btn object add a click event with toggleInfo function
            btn.addEventListener("click", toggleInfo);
        }
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
            
            // For ease of code create variable saving the coins prices in different currencies (an object)
            // The global coins map is accessed via the coin id we had saved in the dataset when building the html
            let coinPrice = coins.get(this.dataset.coinid).market_data.current_price;
            // Set extraInfo as coin price in USD, Euro, and Shekels (per specification request)
            extraInfo = `Market value of coin:<br>
            $${coinPrice.usd}<br>
            €${coinPrice.eur}<br>
            ₪${coinPrice.ils}<br>`
            
        }
        // if text says "Hide Info", we want to collapse it (setting the text as empty which is the init, so no need to change in else cause)
        else {
            // Update text shown to opposite
            this.innerHTML = "More Info";
        }

        // Set the span element above the button clicked with the extraInfo (either coin prices or empty string, depending if we are displaying or collapsing)
        this.previousElementSibling.innerHTML = extraInfo;
    }

    // Search for coins based on user's input in the searchBox
    function searchCoins() {
        // Save searchTerm from searchBox and convert to lowerCase to increase compatibility
        let searchTerm = document.getElementById("searchBox").value.toLowerCase();

        // If search term is empty, display all coins
        if (searchTerm === "") displayCoins(coins.values());
        // Otherwise filter by search term, creating new map from filtered array checking if the symbol contains the search term (per specification request)
        else {
            const filteredCoins = new Map(Array.from(coins).filter(([key,value]) => {
                if (value.symbol.includes(searchTerm)) return true;
                return false;
            }));
            // Display only filtered coins to user
            displayCoins(filteredCoins.values());
        }

    }

    function favouriteCoin() {
        
    }

})()