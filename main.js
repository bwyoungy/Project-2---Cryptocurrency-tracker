// use IIFE
(()=>{ 
    "use strict"

    // initialise global variable as a map to hold coins
    let coins = new Map();

    // Load coins from localStorage and parse from JSON
    fillCoinsMap(JSON.parse(localStorage.getItem("coinsJSON")));

    // If coins null or empty, get info from API
    if (coins === null || coins.size === 0) loadCoinsFromAPI();

    displayCoins();

    // show home frame on load
    document.getElementById("homeFrame").style.display="block";

    // Iterate over link objects to the frames - marked in HTML with class="frameLink"
    for (const aLink of document.getElementsByClassName("frameLink")) {
        // for each link object add a click event with a function to show only that frame
        aLink.addEventListener("click", function(){
            // hide all frames
            for (const frame of document.getElementsByClassName("frame")) {
                frame.style.display="none";
            }
            // show the frame based on the link clicked (alink data-frame corresponds to section id)
            document.getElementById(this.dataset.frame).style.display="block";
        });
    }

    async function loadCoinsFromAPI() {
        try {
            // Fetch coins from API and load the coins array with the json
            const response = await fetch("https://api.coingecko.com/api/v3/coins/");
            coinsAPI = await response.json();
            // Save coins in localStorage as JSON
            localStorage.setItem("coinsJSON", JSON.stringify(coinsAPI));

            fillCoinsMap(coinsAPI);

        } catch (error) {
            // Alert user there was a problem retrieving the information
            alert("There was an error retrieving the information from the CoinGecko API. Please try reloading the page or reach out to us.");
        }
    }

    function fillCoinsMap(coinsJSON) {
        // Iterate over  the coins in JSON form and add each one to map variable with the key being the coin id
        for (const coin of coinsJSON) {
            coins.set(coin.id, coin);
        }
    }

    function displayCoins() {
        // initialise html string as empty
        let html = `<div class="grid">`;

        // Iterate over the coins and each one as a card to the html
        for (const coin of coins.values()) {
            html += `<div class="card">
            <span>${coin.name}</span><br>
            <span>${coin.symbol}</span><br>
            <img src="${coin.image.small}" alt="Image of ${coin.name}"><br>
            <button id="${coin.id}">More Info</button>
            </div>`
        }

        html += "</div>"

        // Update display of coins on home section
        document.getElementById("homeFrame").innerHTML = html;
    }

})()