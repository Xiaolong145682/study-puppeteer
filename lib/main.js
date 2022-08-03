"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// 引入一些需要用到的库以及一些声明
const puppeteer = __importStar(require("puppeteer")); // 引入Puppeteer
// import mongo from '../lib/mongoDb' // 需要用到的 mongodb库，用来存取爬取的数据
const chalk_1 = __importDefault(require("chalk")); // 一个美化 console 输出的库
const log = console.log; // 缩写 console.log
const TOTAL_PAGE = 50; // 定义需要爬取的网页数量，对应页面下部的跳转链接
// 格式化的进度输出 用来显示当前爬取的进度
function formatProgress(current) {
    let percent = (current / TOTAL_PAGE) * 100;
    let done = ~~(current / TOTAL_PAGE * 40);
    let left = 40 - done;
    let str = `当前进度：[${''.padStart(done, '=')}${''.padStart(left, '-')}]   ${percent}%`;
    return str;
}
const sleep = (time) => new Promise(resolve => setTimeout(resolve, time));
// 进入代码的主逻辑
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // 首先通过Puppeteer启动一个浏览器环境
        const browser = yield puppeteer.launch();
        log(chalk_1.default.green('服务正常启动'));
        // 使用 try catch 捕获异步中的错误进行统一的错误处理
        try {
            // 打开一个新的页面
            const page = yield browser.newPage();
            // 监听页面内部的console消息
            page.on('console', msg => {
                if (typeof msg === 'object') {
                    console.dir(msg);
                }
                else {
                    log(chalk_1.default.blue(msg));
                }
            });
            // 打开我们刚刚看见的淘宝页面
            yield page.goto('https://s.taobao.com/search?q=gtx1080&imgfile=&js=1&stats_click=search_radio_all%3A1&initiative_id=staobaoz_20180416&ie=utf8');
            log(chalk_1.default.yellow('页面初次加载完毕'));
            // 使用一个 for await 循环，不能一个时间打开多个网络请求，这样容易因为内存过大而挂掉
            for (let i = 1; i <= TOTAL_PAGE; i++) {
                // 找到分页的输入框以及跳转按钮
                const pageInput = yield page.$(`.J_Input[type='number']`);
                const submit = yield page.$('.J_Submit');
                // 模拟输入要跳转的页数
                yield (pageInput === null || pageInput === void 0 ? void 0 : pageInput.type('' + i));
                // 模拟点击跳转
                yield (submit === null || submit === void 0 ? void 0 : submit.click());
                // 等待页面加载完毕，这里设置的是固定的时间间隔，之前使用过page.waitForNavigation()，但是因为等待的时间过久导致报错（Puppeteer默认的请求超时是30s,可以修改）,因为这个页面总有一些不需要的资源要加载，而我的网络最近日了狗，会导致超时，因此我设定等待2.5s就够了
                yield sleep(2500);
                // 清除当前的控制台信息
                console.clear();
                // 打印当前的爬取进度
                log(chalk_1.default.yellow(formatProgress(i)));
                log(chalk_1.default.yellow('页面数据加载完毕'));
                // 处理数据，这个函数的实现在下面
                yield handleData();
                // 一个页面爬取完毕以后稍微歇歇，不然太快淘宝会把你当成机器人弹出验证码（虽然我们本来就是机器人）
                yield sleep(2500);
            }
            // 所有的数据爬取完毕后关闭浏览器
            yield browser.close();
            log(chalk_1.default.green('服务正常结束'));
            // 这是一个在内部声明的函数，之所以在内部声明而不是外部，是因为在内部可以获取相关的上下文信息，如果在外部声明我还要传入 page 这个对象
            function handleData() {
                return __awaiter(this, void 0, void 0, function* () {
                    // 现在我们进入浏览器内部搞些事情，通过page.evaluate方法，该方法的参数是一个函数，这个函数将会在页面内部运行，这个函数的返回的数据将会以Promise的形式返回到外部 
                    const list = yield page.evaluate(() => {
                        var _a, _b, _c, _d;
                        // 先声明一个用于存储爬取数据的数组
                        const writeDataList = [];
                        // 获取到所有的商品元素
                        let itemList = document.querySelectorAll('.item.J_MouserOnverReq');
                        // 遍历每一个元素，整理需要爬取的数据
                        for (let item of itemList) {
                            // 首先声明一个爬取的数据结构
                            let writeData = {
                                picture: undefined,
                                link: undefined,
                                title: undefined,
                                price: undefined
                            };
                            // 找到商品图片的地址
                            let img = item.querySelector('img');
                            writeData.picture = (_a = img === null || img === void 0 ? void 0 : img.src) !== null && _a !== void 0 ? _a : '';
                            // 找到商品的链接
                            let link = item.querySelector('.pic-link.J_ClickStat.J_ItemPicA');
                            writeData.link = (_b = link === null || link === void 0 ? void 0 : link.href) !== null && _b !== void 0 ? _b : '';
                            // 找到商品的价格，默认是string类型 通过~~转换为整数number类型
                            let price = item.querySelector('strong');
                            writeData.price = ~~((_c = price === null || price === void 0 ? void 0 : price.innerText) !== null && _c !== void 0 ? _c : '');
                            // 找到商品的标题，淘宝的商品标题有高亮效果，里面有很多的span标签，不过一样可以通过innerText获取文本信息
                            let title = item.querySelector('.title>a');
                            writeData.title = (_d = title === null || title === void 0 ? void 0 : title.innerText) !== null && _d !== void 0 ? _d : '';
                            // 将这个标签页的数据push进刚才声明的结果数组
                            writeDataList.push(writeData);
                        }
                        // 当前页面所有的返回给外部环境
                        return writeDataList;
                    });
                    console.log('爬取到的数据：', list);
                    // 得到数据以后写入到mongodb
                    // const result = await mongo.insertMany('GTX1080', list)
                    log(chalk_1.default.yellow('写入数据库完毕'));
                });
            }
        }
        catch (error) {
            // 出现任何错误，打印错误消息并且关闭浏览器
            console.log(error);
            log(chalk_1.default.red('服务意外终止'));
            yield browser.close();
        }
        finally {
            // 最后要退出进程
            process.exit(0);
        }
    });
}
main();
//# sourceMappingURL=main.js.map