// 格式化的进度输出 用来显示当前爬取的进度
export const formatProgress = (options: { current: number, total?: number }): string => {
  const {
    current,
    total = 50,
  } = options
  let percent = (current / total) * 100
  let done = ~~(current / total * 40)
  let left = 40 - done
  let str = `当前进度：[${''.padStart(done, '=')}${''.padStart(left, '-')}]   ${percent}%`
  return str
}

export const sleep = (time: number) => new Promise(resolve => setTimeout(resolve, time))