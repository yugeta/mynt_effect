import { Typewriter } from "../../src/typewriter.js"

class Main{
  constructor(){
    const elms = document.querySelectorAll(".text-1")

    for(const elm of elms){
      new Typewriter({
        event_mode : "scroll",
        elm        : elm,
        group      : 1,
        speed      : 30,
        // duration   : 50,
        delay      : 0,
        repeat     : null,
      })
    }

  }
}

switch(document.readyState){
  case "complete":
  case "interactive":
    new Main();break
  default:
    window.addEventListener("DOMContentLoaded", (()=>new Main()))
}