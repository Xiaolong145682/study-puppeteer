// 引入一些需要用到的库以及一些声明
import * as puppeteer from 'puppeteer' // 引入Puppeteer
// import mongo from '../lib/mongoDb' // 需要用到的 mongodb库，用来存取爬取的数据
// import chalk from 'chalk' // 一个美化 console 输出的库

const chalk = {
  red: (str: string) => `\x1b[31m${str}\x1b[0m`,
  green: (str: string) => `\x1b[32m${str}\x1b[0m`,
  blue: (str: string) => `\x1b[34m${str}\x1b[0m`,
  yellow: (str: string) => `\x1b[33m${str}\x1b[0m`,
  magenta: (str: string) => `\x1b[35m${str}\x1b[0m`,
  cyan: (str: string) => `\x1b[36m${str}\x1b[0m`,
}

const log = console.log // 缩写 console.log
const TOTAL_PAGE = 5 // 定义需要爬取的网页数量，对应页面下部的跳转链接

// 定义要爬去的数据结构
interface IWriteData {
  link?: string // 爬取到的商品详情链接
  picture?: string // 爬取到的图片链接
  price?: string // 价格，number类型，需要从爬取下来的数据进行转型
  title?: string // 爬取到的商品标题
}

// 格式化的进度输出 用来显示当前爬取的进度
function formatProgress(current: number): string {
  let percent = (current / TOTAL_PAGE) * 100
  let done = ~~(current / TOTAL_PAGE * 40)
  let left = 40 - done
  let str = `当前进度：[${''.padStart(done, '=')}${''.padStart(left, '-')}]   ${percent}%`
  return str
}

const sleep = (time: number) => new Promise(resolve => setTimeout(resolve, time))

// 进入代码的主逻辑
async function main() {
  // 首先通过Puppeteer启动一个浏览器环境
  const browser = await puppeteer.launch({
    headless: false, // 是否使用 headless 模式
  })
  log(chalk.green('服务正常启动'))
  // 使用 try catch 捕获异步中的错误进行统一的错误处理
  try {
    // 打开一个新的页面
    const page = await browser.newPage()
    // 监听页面内部的console消息
    page.on('console', msg => {
      if (typeof msg === 'object') {
        console.dir(msg)
      } else {
        log(chalk.blue(msg))
      }
    })

    // 打开我们刚刚看见的淘宝页面
    await page.goto('https://www.lagou.com/wn/jobs?kd=web%E5%89%8D%E7%AB%AF&city=%E6%B7%B1%E5%9C%B3')
    log(chalk.yellow('页面初次加载完毕'))
    await handleData()

    // 所有的数据爬取完毕后关闭浏览器
    // await browser.close()
    log(chalk.green('服务正常结束'))

    // 这是一个在内部声明的函数，之所以在内部声明而不是外部，是因为在内部可以获取相关的上下文信息，如果在外部声明我还要传入 page 这个对象
    async function handleData() {
      console.log(chalk.yellow('开始处理数据'))
      // 使用evaluate方法在浏览器中执行传入函数（完全的浏览器环境，所以函数内可以直接使用window、document等所有对象和方法）
      let data = await page.evaluate(() => {
        let list = document.querySelectorAll('#jobList .list__YibNq .item__10RTO')
        let res = []
        for (let i = 0; i < list.length; i++) {
          res.push({
            name: (list[i].querySelector('.item-top__1Z3Zo .company-name__2-SjF a'))?.textContent,
            company: (list[i].querySelector('.item-top__1Z3Zo .p-top__1F7CL a'))?.textContent,
            salary: (list[i].querySelector('.item-top__1Z3Zo .money__3Lkgq'))?.textContent,
            require: list[i].querySelector('.list__YibNq .item__10RTO .item-bom__cTJhu .il__3lk85')?.textContent,
          })
        }
        return res
      })
      console.log(data)

      log('写入数据库完毕');
    }

  } catch (error) {
    // 出现任何错误，打印错误消息并且关闭浏览器
    console.log(error)
    log(chalk.red('服务意外终止'))
    await browser.close()
  } finally {
    // 最后要退出进程
    process.exit(0)
  }
}

main()