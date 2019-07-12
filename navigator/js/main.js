function get_session(){
  const xhr = new XMLHttpRequest();
  let url = "http://localhost:8080/session";
  let param = document.getElementById("session-id").value;
  xhr.open("GET", url+"/"+param);
  xhr.send();
  xhr.onreadystatechange = function(){
    if(xhr.readyState === 4 && xhr.status === 200) {
      console.log(xhr.responseText);
    }
  }
}
