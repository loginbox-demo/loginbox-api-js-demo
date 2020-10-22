class SocketClient {

  constructor () {
    this.handles = {}
  }

  addHandle (type, callback) {
    this.handles[type] = callback
  }

  setAddress (address) {
    this.address = address
  }

  onclose () {

  }

  connect () {
    const self = this
    return new Promise((resolve, reject) => {
      try {
        if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
          return resolve()
        }

        if (!this.address) {
          return reject('未配置LoginBox接口地址')
        }

        this.webSocket = new WebSocket(this.address)


        this.webSocket.onclose = function () {
          self.log('与LoginBox断开连接')
          self.onclose()
          self.webSocket = null
        }

        this.webSocket.onerror = function (e) {
          console.error('onerror', e)
          self.close()
          reject('与LoginBox连接出错，请检查LoginBox监听服务是否启动和监听端口是否一致')
        }

        this.webSocket.onopen = function () {
          self.log('与LoginBox连接成功')
          resolve()
        }


        this.webSocket.onmessage = function (e) {
          self.log('收到数据:' + e.data);
          if (!e.data) {
            return self.showError('LoginBox数据为空')
          }
          try {
            const data = JSON.parse(e.data)
            if (!data || !data.type) {
              return self.showError('LoginBox数据解析失败')
            }
            if (!self.handles[data.type]) {
              return self.showError('LoginBox数据类型无法识别:' + data.type)
            }
            self.handles[data.type](data)
          } catch (e) {
            console.log(e)
            return self.showError('LoginBox数据解析失败')
          }

        }
      } catch (e) {
        reject(e)
      }

    })

  }

  showError (error) {
    console.error(error)
  }

  log (info) {
    console.log(info)
  }

  send (type, data) {
    console.log(type, data)
    this.webSocket.send(JSON.stringify({type, data}))
  }

  close () {
    if (this.webSocket) {
      if (this.webSocket.readyState !== WebSocket.CLOSING || this.webSocket.readyState !== WebSocket.CLOSED) {
        this.webSocket.close()
      }
      this.webSocket = null
    }
  }
}

var socketClient = new SocketClient();
socketClient.setAddress('ws://127.0.0.1:6789')
socketClient.showError = function (error) {
  const div = document.createElement('div')
  div.style.color = 'red'
  div.innerText = error && error.message ? error.message : error
  document.body.append(div)
}
socketClient.log = function (info) {
  const div = document.createElement('div')
  div.innerText = info
  document.body.append(div)
}