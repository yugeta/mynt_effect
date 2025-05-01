/**
 * Fade-In
 * - 要素をイベントに合わせて opacity 0.0 -> opacity 1.0 にする
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

export class Fadein{
  constructor(options){
    if(!options || !options.elm){return}
    this.options = options || {}
    this.set_css()
    this.setting(this.options.elm)
    this.event_mode()
  }

  groups = []
  name = "fadein"

  event_mode(){
    switch(this.options.event_mode){
      case "click":
        this.options.elm.addEventListener("click", this.view.bind(this))
        break

      case "scroll":
      default:
        window.addEventListener("scroll", this.scroll.bind(this))
        // requestanimationframe(this.scroll.bind(this))
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
    link.href      = `${this.root_path}/fadein.css`
    link.className = this.name
    document.head.appendChild(link)
  }

  // 文字をエレメントに分解
  setting(elm){
    if(!elm){return}
    elm.classList.add(`${this.name}-element`)
    elm.style.setProperty("--anim-speed" , `${this.options.speed}ms`)
    elm.style.setProperty("--anim-delay" , `${this.options.delay}ms`)
  }

  view(){
    const elm  = this.options.elm
    elm.setAttribute("data-anim","1")
  }


  // グループ処理
  scroll(){
    const elm = this.options.elm
    const rect = elm.getBoundingClientRect()

    // 未再生
    if(elm.getAttribute("data-anim") !== "1"
    && rect.top > -100
    && rect.top - this.page_height < -100){
      this.view()
    }

    // 再生済み、画面外に出た場合の処理
    else if(this.options.repeat
    && elm.getAttribute("data-anim") === "1"
    && (rect.top - this.page_height > 0 || rect.top < (-rect.height))){
      elm.setAttribute("data-anim" , "0")
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