// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const driverStartButton = document.querySelector("#driver_start_button");

driverStartButton.addEventListener("click", function(clickEvent) {
   const xhr = new XMLHttpRequest();
   xhr.open("POST", "http://localhost:8080/api/session");
   xhr.send();
   xhr.onreadystatechange = function(){
       if(xhr.readyState === 4 && xhr.status === 200) {
           console.log(xhr.responseText);
       }
   }
})

