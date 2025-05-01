/**
 * タイプライター表示処理
 * 
 * 【Summary】
 * - エレメント内の文章を１文字ずつタイプライターを打ち込むような表示をする機能
 * 
 * 【Howto】
 * - エレメントに、class = "typewriter"を設置する。
 * - 以下のパラメータ（クラスをセットしたエレメントの属性）をセットすることで個別にカスタマイズが可能
 * - 属性セットは、複数同時にセットできます。
 * 
 * 【Param】
 * - data-typewriter-speed 
 *   - default : 100
 *   - type : Number(ms)
 *   - １文字表示のスピード
 *   - sample : <p data-typewriter-speed="50">サンプルタイトル</p>
 * 
 * - data-typewriter-duration 
 *   - default : 無し（speedに準拠する）
 *   - type : Number(ms)
 *   - エレメント内の文章を完了する時間 
 *   - data-typewriter-durationがセットされている場合、data-typewriter-speedの値は無効になります。
 *   - sample : <p data-typewriter-duration="2000">サンプルタイトル</p>
 * 
 * - data-typewriter-repeat 
 *   - スクロールで画面内に入る場合にサイドアニメーションを再生するか、１度きりの表示かをエレメント（グループ）毎に設定できます。
 *   - true : 画面に入るたびにアニメーションスタートします
 *   - default : false（ページロードで１回のみの表示）
 *   - グループセットされている場合は、グループ内でtrueがセットされた場合、対照グループ全てのエレメントでtrueになります。
 *   - sample : <p data-typewriter-repeat>サンプルタイトル</p>
 * 
 * - data-typewriter-delay
 *   - エレメント内の表示開始遅延時間の指定ができます。
 *   - default : 0
 *   - type : Number(ms)
 *   - sample : <p data-typewriter-delay="500">サンプルタイトル</p>  
 */

export class Typewriter{
  options = {
    selector         : ".typewriter,.apper",
    target_className : "typewriter-word",
    speed     : 100 // *ms
  }
  groups = []

  constructor(){
    this.set_css()
    this.event()
    this.init()
  }

  set_css(){
    if(document.querySelector(`linl[href="page/index/css/typewriter.css"]`)){return}
    const link = document.createElement("link")
    link.rel  = "stylesheet"
    link.href = "page/index/css/typewriter.css"
    document.head.appendChild(link)
  }

  event(){
    window.addEventListener("scroll" , this.scroll.bind(this))
    window.addEventListener("resize" , this.scroll.bind(this))
  }

  init(){
    let elms = document.querySelectorAll(this.options.selector)
    for(let elm of elms){
      const group_name = elm.getAttribute("data-typewriter-group")
      const group_data = this.groups.find(e => e.name === group_name)

      // 文字をエレメントに分解
      const delay_num = this.set_split_value(elm, group_data ? group_data.delay_num : 0)
      const repeat    = elm.hasAttribute("data-typewriter-repeat") ? true : false

      if(group_name && group_data){
        group_data.elms.push(elm)
        group_data.delay_num = delay_num
        group_data.repeat    = group_data.repeat || repeat
      }
      else{
        this.groups.push({
          name      : group_name,
          elms      : [elm],
          delay_num : delay_num,
          repeat    : repeat
        })
      }
    }
  }

  // 文字をエレメントに分解
  set_split_value(elm, delay_num){
    if(!elm || !elm.innerHTML){return}
    const new_elm = document.createElement("div")
    delay_num    += this.get_delay(elm)
    const speed   = this.get_speed(elm)

    while(elm.innerHTML){
      
      switch(elm.firstChild.nodeType){
        // element
        case 1:
          delay_num += speed
          elm.style.setProperty("animation-delay" , delay_num +"ms")
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
            delay_num += speed
            let span = document.createElement("span")
            span.className = this.options.target_className
            span.style.setProperty("animation-delay" , delay_num +"ms")
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
    elm.setAttribute("data-view","1")

    return delay_num
  }

  get_delay(elm){
    return Number(elm.getAttribute("data-typewriter-delay") || 0) || 0
  }

  // data-typewriter-speed（１文字ごとのスピード）, data-typewriter-duration（文章完了の時間）を元に算出
  get_speed(elm){
    let speed = null
    if(elm.hasAttribute("data-typewriter-duration")){
      const duration = Number(elm.getAttribute("data-typewriter-duration"))
      const str_count = elm.textContent.length
      speed = duration / str_count
    }
    else if(elm.hasAttribute("data-typewriter-speed")){
      speed = Number(elm.getAttribute("data-typewriter-speed"))
    }

    return speed || this.options.speed
  }

  scroll(e){
    this.group_run()
  }

  // グループ処理
  group_run(){
    for(const group_data of this.groups){
      if(!group_data.elms.length){continue}
      const rect = group_data.elms[0].getBoundingClientRect()

      // 未再生
      if(group_data.elms[0].getAttribute("data-anim") !== "1"
      && rect.top > -100
      && rect.top - this.page_height < -100){
        for(const elm of group_data.elms){
          elm.setAttribute("data-anim" , "1")
        }
      }

      // 再生済み、画面外に出た場合の処理
      else if(group_data.repeat
      && group_data.elms[0].getAttribute("data-repeat") !== "0"
      && group_data.elms[0].getAttribute("data-anim") === "1"
      && (rect.top - this.page_height > 0 || rect.top < (-rect.height))){
        for(const elm of group_data.elms){
          elm.setAttribute("data-anim" , "0")
        }
      }

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