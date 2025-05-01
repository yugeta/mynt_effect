import { DestructImage } from "./destruct_image.js"

class Main{
  constructor(){
    this.img.addEventListener("click", this.click_image.bind(this))
  }

  get img(){
    return document.querySelector(".sample-image")
  }

  click_image(e){
    const myImage = e.target
    myImage.setAttribute("data-status", "active")
    
    new DestructImage({
      element: myImage,
      src: myImage.src,
      vectorsCount: 12,
      velocityRate: 1.2,			
      accelerationRate: 0.7,
      zIndex: 0,
      finished: () => { 
        console.log('finished')
        this.img.removeAttribute("data-status")
      }
    })
  }
}

switch(document.readyState){
  case "complete":
  case "interactive":
    new Main();break
  default:
    window.addEventListener("DOMContentLoaded", (()=>new Main()))
}