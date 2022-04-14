;
(function () {
	'use stric'
	const doc = window.document
	const $ = (el, method = false) => {
		if (method) {
			return doc.querySelectorAll(el)
		} else {
			return doc.querySelector(el)
		}
	}
	function getRandomArrayValue(arr, num) { // 从数组中随机抽取不重复的值
		var sData = arr.slice(0), i = arr.length, min = i - num, item, index;
		while (i-- > min) {
			index = Math.floor((i + 1) * Math.random());
			item = sData[index];
			sData[index] = sData[i];
			sData[i] = item;
		}
		return sData.slice(min);
	}
	class Game {
		constructor(arg) {
			const chessboard = [
				[3, 2],
				[3, 4],
				[5, 4],
				[6, 6]
			]
			this.opt = Object.assign({
				el: 'body', // 棋盘节点
				level: 1, // 棋盘行数
				timeCallback() {}, // 计时器回调
				stepSuccess() {}, // 翻棋正确
				success() {} // 成功完成游戏
			}, arg)
			this.opt.chessboard = chessboard[this.opt.level]
			this.el = $(this.opt.el)
		}
		paint() { // 绘制棋盘
			this.el.innerHTML = ""
			this.__levelHard = false
			this.__noClick = false
			this.__recordSteps = [] // 下棋步数记录
			this.__ms = 0
			this.__paintInit = true
			this.el.classList.add('loading-start')
			this.el.classList.remove('no-animate')
			if (this.opt.level == 3) { // 开启地狱模式
				alert('此模式关闭动画，错误翻棋关闭时间缩短为100ms')
				this.el.classList.add('no-animate')
				this.__levelHard = true
			}
			const chessboard = this.opt.chessboard
			
			// 生成棋子图案可用区间
			const max = chessboard[0] * chessboard[1] / 2
			let iconArr = getRandomArrayValue(ICONS, max)
			iconArr = [...iconArr, ...iconArr].sort(() => Math.random() - 0.5)
			this.__chessboardIcons = iconArr
			// 渲染行
			this.chessboard = Array.from({length: chessboard[0]}).map((row, index) => {
				const rowEl = doc.createElement('div')
				rowEl.className = 'game-row'
				this.el.appendChild(rowEl)
				// 渲染列
				return Array.from({length: chessboard[1]}).map((child, cindex) => {
					const colEl = doc.createElement('div')
					colEl.className = 'game-col'
					rowEl.appendChild(colEl)
			
					const chess = doc.createElement('div')
					const id = `game-chess-${index}-${cindex+1}`
					chess.id = id
					chess.className = 'game-chess'
					
					let icon = iconArr[cindex]
					if (index) {
						icon = iconArr[index * chessboard[1] + cindex]
					}
					
					chess.innerHTML = `<svg class="icon" aria-hidden="true">
						<use xlink:href="#icon-${icon}"></use>
					</svg>`
					colEl.appendChild(chess)
					
					const obj = {
						position: [index, cindex + 1],
						el: chess,
						status: false,
						icon
					}
					chess.addEventListener('click', () => {
						if (!this.__noClick) {
							this.step(obj, chess)
						}
					})
					return obj
				})
			})
		}
		step(chess, el) { // 开始翻棋子
			if (this.__paintInit) { // 开始游戏
				this.time()
				this.__paintInit = false
				this.el.classList.remove('loading-start')
				// TODO: 开始游戏清空图标（防止作弊的功能，因动画问题未解决暂未开放）
				// const svgNodes = this.el.querySelectorAll('svg')
				// svgNodes.forEach(_ => _.remove())
			}
			
			if (!chess.status) { // 落点不能是有棋子的位置
				el.classList.add('game-chess__focus')
				if (this.__chessA) { // 翻开第二个
					this.__chessZ = chess
					// 计算位置是否符合游戏规则
					const toStep = this.toStep(chess)
					if (toStep) {
						this.__chessZ = chess
						this.__chessA.status = true
						this.__chessA.el.classList.add('game-chess__close')
						this.__chessA = undefined
						this.__chessZ.status = true
						this.__chessZ.el.classList.add('game-chess__close')
						this.__chessZ = undefined
						// 翻开成功就判断是否成功完成游戏
						if (this.isSucessGame()) {
							if (this.__clearTime) {
								clearTimeout(this.__clearTime)
							}
							Object.prototype.toString.call(this.opt.success) === '[object Function]' && this.opt.success({
								ms: this.__ms,
								steps: this.__recordSteps
							})
						}
					} else {
						// 翻棋错误清理
						this.clearFoucs()
					}
				} else {
					this.__chessA = chess
				}
				this.recordStep(this.__chessA, this.__chessZ)
			}
		}
		clearFoucs() { // 清理翻开的棋子
			return new Promise(res => {
				this.__noClick = true
				window.setTimeout(() => {
					this.__chessA?.el.classList.remove('game-chess__focus')
					this.__chessA = undefined
					this.__chessZ?.el.classList.remove('game-chess__focus')
					this.__chessZ = undefined
					this.__noClick = false
					res()
				}, this.__levelHard ? 100 : 500)
			})
		}
		addSvg(chess) { // TODO: 暂时无用
			chess.el.innerHTML = `<svg class="icon" aria-hidden="true">
				<use xlink:href="#icon-${chess.icon}"></use>
			</svg>`
		}
		toStep(chess) { // 计算目标位置是否符合游戏规则
			return this.__chessA.icon == chess.icon
		}
		recordStep(a, z) { // 记录步骤，参数：当前棋子、上一个棋子
			this.__recordSteps.push({
				a: a?.position,
				z: z?.position
			})
			Object.prototype.toString.call(this.opt.stepSuccess) === '[object Function]' && this.opt.stepSuccess(this.__recordSteps)
		}
		time() { // 计时器
			this.__clearTime = setTimeout(() => {
				this.__ms = this.__ms + 17
				Object.prototype.toString.call(this.opt.timeCallback) === '[object Function]' && this.opt.timeCallback(this.__ms)
				this.time()
			}, 17)
		}
		isSucessGame() { // 是否成功完成游戏
			// 验证棋子是否全部被翻开
			let num = this.opt.chessboard[0] * this.opt.chessboard[1]
			isSucess:
			for (let i = 0; i < this.chessboard.length; i++) {
				const child = this.chessboard[i]
				for (let j = 0; j < child.length; j++) {
					if (!child[j].status) { // 包含不成功的直接判定为未完成游戏
						break isSucess
					} else {
						num--
					}
				}
			}
			if (num == 0) { // 剩余未翻开棋子为0则游戏成功
				return true
			}
			return false
		}
		reset() { // 重新开始游戏
			this.__ms = 0
			if (this.__clearTime) {
				clearTimeout(this.__clearTime)
			}
		}
	}

	window.Game = Game
}());