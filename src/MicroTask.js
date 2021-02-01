export default class MicroTask {
    constructor() {
      this.queue = []
      this.statusList = {TO_DO: 0, DONE: 1, RUNNING: 2, STOP: 3}
      this.taskStatus = this.statusList.STOP
    }
  
    add(task, forceCommit = false) {
      this.queue.push({task, status: this.statusList.TO_DO})
      if (forceCommit) {
        if (this.taskStatus !== this.statusList.RUNNING) {
          this.commit()
        }
      }
    }
  
    commit() {
      /* notion de transaction */
      /* do nothing from now */
      this.taskStatus = this.statusList.RUNNING
      while (this.queue.length) {//use generator?
        const { task, status } = this.queue.pop()
        if (status === this.statusList.DONE || typeof task !== "function") { continue }
        try { task() } catch (reason) { console.log(reason) } //for now perform
      }
      this.taskStatus = this.statusList.STOP
    }
  
    start() {
      setTimeout(() => {
        this.commit()
      }, 0)
    }
  
    reset() {
      this.queue = []
    }
  }