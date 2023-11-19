// use IIFE
(()=>{ 
    "use strict"

    // show home frame on load
    document.getElementById("homeFrame").style.display="block";

    let validationObjs = document.getElementsByClassName("taskInputField");
    
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

})()