/**
 * タイプラーター文字表示
 * - カタカタと打ち込んでいるように文字を表示する
 * 
 * # Param
 * - elm   : 文字列の格納されているエレメント
 * - event : 表示するイベントタイミング
 *  - scroll     : スクロールで画面にin（要素の縦半分（または画面中央）したタイミングで表示開始
 *  - null(none) : デフォルトは、スクロール表示
 *  - click      : 対象の要素をクリックした時に表示開始
 * - speed  : 表示スピード (default: 500)
 * - delay  : 表示開始を遅らせるスピード (default: 100)
 * - repeat : 繰り返し表示処理をする場合は true , ページ表示で１度きりの場合は false（または設定しない）
 */

export class Typewriter{
  constructor(options){
    if(!options || !options.elm){return}
    this.options = options || {}
    this.set_css()
    this.setting()
    this.event_mode()
  }

  groups = []
  name = "typewriter"

  event_mode(){
    switch(this.options.event_mode){
      case "click":
        this.options.elm.addEventListener("click", this.view.bind(this))
        break

      case "scroll":
      default:
        // this.scroll()
        window.addEventListener("scroll", this.scroll.bind(this))
        this.scroll()
        break
    }
  }

  get root_path(){
    return import.meta.url.split("/").slice(0,-1).join("/")
  }

  set_css(){
    if(document.querySelector(`link.${this.name}`)){return}
    const link     = document.createElement("link")
    link.rel       = "stylesheet"
    link.href      = `${this.root_path}/typewriter.css`
    link.className = this.name
    document.head.appendChild(link)
  }

  // 文字をエレメントに分解
  setting(delay_num){
    const elm = this.options.elm
    delay_num = delay_num || 0
    if(!elm || !elm.innerHTML){return}
    elm.classList.add(this.name)
    const new_elm = document.createElement("div")
    delay_num    += this.options.delay

    while(elm.innerHTML){
      
      switch(elm.firstChild.nodeType){
        // element
        case 1:
          delay_num += this.options.speed
          elm.firstChild.classList.add(`${this.name}-word`)
          elm.firstChild.style.setProperty("animation-delay" , `${delay_num}ms`)
          new_elm.appendChild(elm.firstChild)
        break

        // text
        case 3:
          let word = elm.firstChild.textContent.slice(0,1)
          elm.firstChild.textContent = elm.firstChild.textContent.slice(1)

          // 改行コード
          if(word === "\n"){
            let new_text = document.createTextNode(word)
            new_elm.appendChild(new_text)
          }

          // 文字列
          else{
            delay_num += this.options.speed
            let span = document.createElement("span")
            span.classList.add(`${this.name}-word`)
            span.style.setProperty("animation-delay" , `${delay_num}ms`)
            span.textContent = word
            new_elm.appendChild(span)
          }

          // HTMLの空行を対象外にする
          if(elm.firstChild.textContent === ""){
            elm.removeChild(elm.firstChild)
          }
        break
      }
    }
    elm.innerHTML = new_elm.innerHTML

    return delay_num
  }

  view(){
    const elm      = this.options.elm
    const rect     = elm.getBoundingClientRect()

    elm.setAttribute("data-anim","1")

    // 未再生
    if(elm.getAttribute("data-anim") !== "1"
    && rect.top > -100
    && rect.top - this.page_height < -100){
      elm.setAttribute("data-anim" , "1")
    }

    // 再生済み、画面外に出た場合の処理
    else if(this.options.repeat
    && elm.getAttribute("data-anim") === "1"
    && (rect.top - this.page_height > 0 || rect.top < (-rect.height))){
      elm.setAttribute("data-anim" , "0")
    }
  }


  // グループ処理
  scroll(){
    const elm = this.options.elm
    // for(const group_data of this.groups){
    // if(!group_data.elms.length){continue}
    const rect = elm.getBoundingClientRect()

    // 未再生
    if(elm.getAttribute("data-anim") !== "1"
    && rect.top > -100
    && rect.top - this.page_height < -100){
      // elm.setAttribute("data-anim" , "1")
      this.view()
    }

    // 再生済み、画面外に出た場合の処理
    else if(this.options.repeat
    && elm.getAttribute("data-anim") === "1"
    && (rect.top - this.page_height > 0 || rect.top < (-rect.height))){
      elm.setAttribute("data-anim" , "0")
      // this.view()
    }
  }

  get scroll_y(){
    return document.scrollingElement.scrollTop
  }

  get page_height(){
    return window.innerHeight
  }

  get page_size(){
    return document.scrollingElement.scrollHeight
  }


}