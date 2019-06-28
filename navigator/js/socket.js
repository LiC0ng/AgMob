
function sendWebsocket()
{ 
    var id = document.getElementById("session-id").value;
    var url = "ws://localhost:8080/api/session" + id + "navigator"
    var ws = new WebSocket("wss://echo.websocket.org")

    ws.onopen = function()
    {
        ws.send("hello");
    }

    ws.onmessage = function(evt)
    {
        var recevied_mas = evt.data;
        console.log("received")
    }

    ws.onclose = function()
    {
        console.log("closed")
    }

    ws.onerror = function(evt)
    {
        alert("error")
    }
}