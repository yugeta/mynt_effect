export class BrokenMirror{
  frame    = 0
  groups   = null
  option   = null
  size     = null
  frameElm = null
  img      = null
	// src = null

  constructor(options){
    if(!options || !options.elm) {
      throw 'argument is invalid.'
    }
		
		// デフォルト値を反映
    this.options = Object.assign({
			vectorsCount     : 12,
			velocityRate     : 0.5,
			accelerationRate : 0.5,
			zIndex           : 0,
			finished         : null,
			delay            : 1000,
			style            : {},
		}, options || {})

		this.promise = new Promise((resolve, reject)=>{
			this.resolve = resolve
			this.reject  = reject
			this.event_mode()
		})

		

		// this.setting()
	}

	event_mode(){
    switch(this.options.event_mode){
      case "click":
        this.options.elm.addEventListener("click", this.click.bind(this))
        break

      case "scroll":
      default:
        window.addEventListener("scroll", this.scroll.bind(this))
        requestAnimationFrame(this.scroll.bind(this))
        // setTimeout(this.scroll.bind(this), this.delay)
        break
    }
  }

	click(){
		this.view()
	}

	scroll(){
		const elm = this.options.elm
    const rect = elm.getBoundingClientRect()

    // 未再生
    if(elm.getAttribute("data-anim") !== "1"
    && rect.top > -100
    && rect.top - this.page_height < -100){
      // this.view()
			setTimeout(this.view.bind(this), this.options.delay)
    }

    // 再生済み、画面外に出た場合の処理
    else if(this.options.repeat
    && elm.getAttribute("data-anim") === "1"
    && (rect.top - this.page_height > 0 || rect.top < (-rect.height))){
      // elm.setAttribute("data-anim" , "0")
    }
	}

	view(){
    // 対象の<img>
    this.img = this.options.elm

    // 処理中は何もしない
    if(typeof this.img.destructImageFlag !== 'undefined' && this.img.destructImageFlag){return -1}

    this.img.style.setProperty("opacity", "0.0", "")
		this.img.style.setProperty("pointer-events", "none", "")

    // 画像の矩形を計算する
    const rect = this.img.getBoundingClientRect()

    // 処理中のフラグを立てる
    this.img.destructImageFlag = true

    // 変更前のsrcを退避
    const imgSrc = this.img.src
  
    // 画像のサイズを求める
    this.size = {
      width  : rect.width,
      height : rect.height,
    }
  
    // 枠を作成する
    this.frameElm                = document.createElement('div')
		this.frameElm.className      = this.options.elm.className
    this.frameElm.style.position = `absolute`
		this.frameElm.style.left     = this.options.style.left ?? `${rect.left}px`
    this.frameElm.style.top      = this.options.style.top  ?? `${rect.top}px`
    this.frameElm.style.width    = `${rect.width}px`
    this.frameElm.style.height   = `${rect.height}px`
    this.frameElm.style.clipPath = `polygon(0px 0px, ${rect.width}px 0px, ${rect.width}px ${rect.height}px, 0px ${rect.height}px)`
    this.frameElm.style.overflow = `hidden`
  
    // 枠をbodyに追加
    this.options.elm.parentNode.appendChild(this.frameElm)
  
    // ポリゴングループを作成する
    this.groups = this.getPolygonGroups(this.options, this.size)
  
    // ガラスの破片を作成する
    this.groups.forEach((group, i) => {
      group.forEach((polygon, j) => {
        // <img>を作成
        const imgElm = document.createElement('img')
        imgElm.src = imgSrc
        imgElm.className             = this.options.elm.className
        imgElm.style.position        = `absolute`
        imgElm.style.top             = `${rect.top}`
        imgElm.style.left            = `${rect.left}`
        imgElm.style.width           = `${rect.width}px`
        imgElm.style.height          = `${rect.height}px`
        imgElm.style.clipPath        = this.getClipPath(this.groups[i][j])
        imgElm.style.transformOrigin = `${polygon.quantity.g.x}px ${polygon.quantity.g.y}px`
        // 枠に<img>を追加
        this.frameElm.appendChild(imgElm)
  
        polygon.imgElm = imgElm
      })
    })
  
    // option.srcを先読みする
    const tmpImg = new Image()
    const tmpTimeoutId = setTimeout(() => {
      throw 'image load timeout error'
    }, 10000);
    tmpImg.onload = () => {
      clearTimeout(tmpTimeoutId)
      this.img.src = this.options.src;
      requestAnimationFrame(this.anim.bind(this));
    };
    tmpImg.onerror = () => {
      clearTimeout(tmpTimeoutId)
      throw 'image load error'
    };
    tmpImg.src = this.options.src;
  
    return 0
  }

  // ポリゴングループ作成
	getPolygonGroups(option, size) {
		// canvasの中心から伸びるベクトル群を求める
		const vectors = this.getBaseVectors(option.vectorsCount, 2, 7)

		// canvasの中心から伸びる線分の端点群(canvasの境界上の点)を求める
		const ends = this.getLineEnds(size, vectors)

		// 辺を分割する(中央点とcanvasの端点も含む)
		const edges = this.getDividesEdges(size, ends, 0.95, [3, 4])

		// 多角形を取得する(多角形は三角形か凸四角形となる)
		let groups = this.getPolygonGroupsNoCorners(edges)

		// 4隅の三角形のポリゴン群を取得する
		// (放射状の線がほぼ隅の点と重なる場合もあるのでその時は三角形のポリゴンが作成されないが無視してもいいかもしれない)
		const cornerPolygons = this.get4CornersPolygons(size, ends)

		// 4隅の三角形のポリゴン群を最後尾のグループに追加する
		groups[groups.length - 1] = groups[groups.length - 1].concat(cornerPolygons);	

		this.addGroupQuantities(option, size, groups)

		return groups
	}

  // 中央からの放射状のベクトルを求める
	getBaseVectors(divides, base, delta) {
		// 中心から放射状に分割する
		let randVals = []

		for(let i = 0; i < divides; i += 1) {
			randVals.push(this.rand(base, base + delta))
		}

		const sum = randVals.reduce((p, c) => c + p, 0)

		// radに変換
		randVals = randVals.map(v => Math.PI * 2 * v / sum)

		const ret = []

		for(let i = 0, angle = this.rand(0, Math.PI * 2); i < divides; i += 1) {
			if(i !== 0) {
				angle += randVals[i - 1]
			} 
			ret.push({
				x: Math.cos(angle),
				y: Math.sin(angle),
			})
		}

		return ret
	}

  // 中央からの放射状のベクトルから線分の端点を求める
	getLineEnds(size, vectors) {
		const center = {
			x: size.width  / 2,
			y: size.height / 2,
		}

		const cSlope = size.height / size.width

		const ret = vectors.map(v => {
			// ベクトルの傾きを求める
			let slope
			if(Math.abs(v.x) > 0.0001) {// 0徐算を防ぐ
				slope = v.y / v.x
			} else {
				if(v.y > 0) {slope = 100000} 
        else        {slope = 100000}
			}

			let ret = { x: 0, y: 0 }

			if(v.x >= 0 && Math.abs(slope) < cSlope) {
				ret = {
					x: size.width / 2,
					y: slope * size.width / 2,
				}
			} else if(v.x < 0 && Math.abs(slope) < cSlope) {
				ret = {
					x: -size.width / 2,
					y: slope * (-size.width / 2),
				}
			} else if(v.y >= 0) {
				ret = {
					x: (1 / slope) * size.height / 2,
					y: size.height / 2,
				}
			} else {
				ret = {
					x: (1 / slope) * (-size.height / 2),
					y: -size.height / 2,
				}
			}

			// はみ出している場合は修正する
			if(ret.x <= -size.width / 2)     {ret.x = -size.width / 2} 
      else if(ret.x >= size.width / 2) {ret.x =  size.width / 2}

			if(ret.y <= -size.height / 2)     {ret.y = -size.height / 2} 
      else if(ret.y >= size.height / 2) {ret.y =  size.height / 2}

			ret.x += center.x
			ret.y += center.y

			return ret
		})

		return ret
	}

  // 線分を分割する
	getDividesEdges(size, ends, lenRate, divides) {
		const center = {
			x: size.width  / 2,
			y: size.height / 2,
		}

		// 辺を分割する
		const dividedEdges = ends.map(end => {
			const ret = []
			// 単位ベクトルを求める
			const v = {
				x: end.x - center.x,
				y: end.y - center.y,
			};
			const len = Math.sqrt(v.x * v.x + v.y * v.y)
			v.x /= len
			v.y /= len
			let dividesSum = divides.reduce((p, c) => p + c, 0)
			
			for(let i = 0; i <= divides.length; i += 1) {
				if(i === 0) {
					ret.push({
						x: center.x,
						y: center.y,
					});
				} 
        else {
					const baseRate = divides[i - 1] / dividesSum
					const rate = baseRate * this.rand(0.5, 1.0)
					const curLen = len * lenRate * rate
					const prev = ret[ret.length - 1]
					ret.push({
						x: prev.x + v.x * curLen,
						y: prev.y + v.y * curLen,
					})
				}
			}
			ret.push({
				x: end.x,
				y: end.y
			});
			return ret
		});

		return dividedEdges
	}
	
  // 線分からポリゴンを作成する
	getPolygonGroupsNoCorners(edges) {
		const groups = []

		// edgeの配列の大きさはすべて同じになっている
		for(let j = 0; j < edges[0].length - 1; j += 1) {
			const polygons = []

			for(let i = 0; i < edges.length; i += 1) {
				const inext = (i + 1) % edges.length,
					edge = edges[i],
					nextEdge = edges[inext]

				const polygon = []
				if(j !== 0) {
					polygon.push(edge[j])
				}
				polygon.push(nextEdge[j])
				polygon.push(nextEdge[j + 1])
				polygon.push(edge[j + 1])

				polygons.push(polygon)
			}
			groups.push(polygons)
		}

		return groups
	}

  // 4隅の多角形(三角形)を取得する
	get4CornersPolygons(size, ends) {
		// 各端の座標を求める

		// 上端のX
		const topXPositions = ends.filter(end => end.y === 0).map(end => end.x)
		const topMinX = Math.min(...topXPositions)
		const topMaxX = Math.max(...topXPositions)

		// 下端のX
		const bottomXPositions = ends.filter(end => end.y === size.height).map(end => end.x)
		const bottomMinX = Math.min(...bottomXPositions)
		const bottomMaxX = Math.max(...bottomXPositions)

		// 左端のY
		const leftYPositions = ends.filter(end => end.x === 0).map(end => end.y)
		const leftMinY = Math.min(...leftYPositions)
		const leftMaxY = Math.max(...leftYPositions)
		
		// 右端のY
		const rightYPositions = ends.filter(end => end.x === size.width).map(end => end.y)
		const rightMinY = Math.min(...rightYPositions)
		const rightMaxY = Math.max(...rightYPositions)

		// 隅毎に多角形を作成する
		const polygons = []
		let polygon
		
		// 左上隅
		if(leftMinY !== Infinity && topMinX !== Infinity) {
			polygon = []
			polygon.push({ x: 0, y: 0 })
			polygon.push({ x: 0, y: leftMinY })
			polygon.push({ x: topMinX, y: 0 })
			polygons.push(polygon)
		}		

		// 右上隅
		if(topMaxX !== -Infinity && rightMinY !== Infinity) {
			polygon = []
			polygon.push({ x: size.width, y: 0 })
			polygon.push({ x: topMaxX, y: 0 })
			polygon.push({ x: size.width, y: rightMinY })
			polygons.push(polygon)
		}		

		// 左下隅
		if(bottomMinX !== Infinity && leftMaxY !== -Infinity) {
			polygon = []
			polygon.push({ x: 0, y: size.height })
			polygon.push({ x: bottomMinX, y: size.height })
			polygon.push({ x: 0, y: leftMaxY })
			polygons.push(polygon)
		}

		// 右下隅
		if(rightMaxY !== -Infinity && bottomMaxX !== -Infinity) {
			polygon = []
			polygon.push({ x: size.width, y: size.height })
			polygon.push({ x: size.width, y: rightMaxY })
			polygon.push({ x: bottomMaxX, y: size.height })
			polygons.push(polygon)
		}

		return polygons
	}

  // 重心、初速度、初期位置からの相対位置、回転軸(保留)、角速度(保留)を求める
	// 割と雑に決める(基本的に中心に近いものが大きく動くようにする)
	addGroupQuantities(option, size, groups) {
		const c = {
			x: size.width / 2,
			y: size.height / 2,
		}

		const xRate = size.width / 720,
			yRate = size.height / 480

		groups.forEach((group, i) => {

			group.forEach((polygon, j) => {

				// 重心を求める
				const g = this.getGravity(polygon)

				// 中心からの重心までの方向ベクトルを求める
				const v = {
					x: g.x - c.x,
					y: g.y - c.x
				}

				// ベクトルの長さを求める
				const len = Math.sqrt(v.x * v.x + v.y * v.y)

				// 単位ベクトル化
				v.x /= len
				v.y /= len

				// ずれ量を求める(中心からポリゴンの中心に向かってぶれる)
				// これが初速度となる
				let deltaX, deltaY
				if(i === 0) {// 中心に一番近い => 大きくぶれる
					deltaX = option.velocityRate * xRate * this.rand(5, 10) * v.x
					deltaY = option.velocityRate * yRate * this.rand(5, 10) * v.y
				} else if(i === 1) {// 中心に一番近い => 大きくぶれる
					deltaX = option.velocityRate * xRate * this.rand(3, 5) * v.x
					deltaY = option.velocityRate * yRate * this.rand(3, 5) * v.y
				} else {// 中心に一番近くない => 小さくぶれる
					deltaX = option.velocityRate * xRate * this.rand(1, 2) * v.x
					deltaY = option.velocityRate * yRate * this.rand(1, 2) * v.y
				}

				// 遅延処理(何フレーム後に動き出すか)
				let late;
				if(i === 0) {// 中心に一番近い => 遅延あまりなし
					late = this.randInt(1, 5)
				} else if(i === 1) {// 中心に2番目に近い => 遅延ややあり
					late = this.randInt(8, 10)
				} else {// 中心に一番近くない => 遅延あり
					late = this.randInt(5, 15)
				}

				// 角速度
				let vr;
				if(i === 0) {// 中心に一番近い => 速い
					vr = this.rand(5, 15) / 360 * Math.PI * 2
				} else if(i === 1) {// 中心に2番目に近い => やや遅い
					vr = this.rand(2, 3) / 360 * Math.PI * 2
				} else {// 中心に一番近くない => 遅い
					vr = this.rand(1, 2) / 360 * Math.PI * 2
				}

				// 回転軸を決定する
				let xaxis, yaxis, zaxis
				xaxis = v.y
				yaxis = -v.x
				if(i === 0) {// 中心に一番近い => 遅延あまりなし
					zaxis = this.rand(0.1, 0.2)
				} else if(i === 1) {// 中心に2番目に近い => 遅延ややあり
					zaxis = this.rand(0.05, 0.1)
				} else {// 中心に一番近くない => 遅延あり
					zaxis = this.rand(0.025, 0.05)
				}

				polygon.quantity = {
					g: g,
					x: deltaX,
					y: deltaY,
					r: 0,
					xaxis: xaxis,
					yaxis: yaxis,
					zaxis: zaxis,
					vx: deltaX,
					vy: deltaY,
					vr: vr,
					late: late,
				}
			})
		})
	}

  // 乱数作成
	rand(min, max) {
		if(!min && !max) {
			return Math.random()
		} else {
			return min + Math.random() * (max - min)
		}		
	}

	// 整数の乱数作成
	randInt(min, max) {
		return Math.floor( Math.random() * (max + 1 - min) ) + min
	}

  // クリップ用のパスを取得
	getClipPath(polygon) {
		let path = 'polygon('
		polygon.forEach((pos, i) => {
			if(i !== 0) {
				path += ', '
			}
			path += `${pos.x}px ${pos.y}px`
		});
		path += ')'
		return path
	}

  // ポリゴンの重心を求める
	getGravity(polygon) {
		const g = polygon.reduce((p, c) => { return { x: p.x + c.x, y: p.y + c.y }; }, { x: 0, y: 0 })
		g.x /= polygon.length
		g.y /= polygon.length
		return g
	}

  // 毎フレーム呼ばれる関数
	anim(){
		this.frame++;
		this.groups.forEach((group, i) => {
	 		group.forEach((polygon, j) => {
	 			const q = polygon.quantity

	 			if(this.frame >= q.late) {
	 				// 位置と角度を更新
	 				const time = this.frame - q.late
	 				q.x += q.vx
	 				q.y = q.vy * time + 0.5 * this.options.accelerationRate * (this.size.height / 480) * time * time
	 				q.r += q.vr
	 			}		 			

	 			// <img>の表示を変更
	 			polygon.imgElm.style.left      = `${q.x}px`
	 			polygon.imgElm.style.top       = `${q.y}px`
	 			polygon.imgElm.style.transform = `rotate3d(${q.xaxis}, ${q.yaxis}, ${q.zaxis}, ${q.r}rad)`
	 		})
	 	})

	 	if(this.checkFinished(this.groups, this.size)) {
			this.finish()
		} else {
			requestAnimationFrame(this.anim.bind(this))
		}
	}

	finish(){
		this.groups.forEach((group, i) => {
			group.forEach((polygon, j) => {
				polygon.imgElm.remove()
			})
		})
		this.frame = 0
		this.frameElm.remove()
		delete this.img.destructImageFlag
		if(this.options.repeat){
			this.img.style.removeProperty("opacity")
			this.img.style.removeProperty("pointer-events")
		}
		// this.options.finished()
		this.resolve()
	}

  // 終了判定
	// Y+方向のみで判断する(回転していない状態で判断する)
	checkFinished(groups, size) {
		return groups.every(group => 
			group.every(polygon => {
				return polygon.every(pos => polygon.quantity.y - pos.y > size.height)
			})
		)
	}

	// scroll
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