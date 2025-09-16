import { AsyncResource } from "node:async_hooks"
import { EventEmitter } from "node:stream"
import { Worker } from "node:worker_threads"

// from https://nodejs.org/api/async_context.html#using-asyncresource-for-a-worker-thread-pool

const kTaskInfo = Symbol("kTaskInfo")
const kWorkerFreedEvent = Symbol("kWorkerFreedEvent")

type TaskInfoCallback<R> = (error: Error | null, result: R | null) => void

class WorkerPoolTaskInfo<R> extends AsyncResource {
  public callback: TaskInfoCallback<R>

  constructor(callback: TaskInfoCallback<R>) {
    super("WorkerPoolTaskInfo")
    this.callback = callback
  }

  done(err: Error | null, result: R | null) {
    this.runInAsyncScope(this.callback, null, err, result)
    this.emitDestroy() // `TaskInfo`s are used only once.
  }
}

type EnhancedWorker<R> = Worker & { [kTaskInfo]?: WorkerPoolTaskInfo<R> | null }

export class WorkerPool<T, R> extends EventEmitter {
  private scriptPath: string
  private workers: EnhancedWorker<R>[]
  private freeWorkers: EnhancedWorker<R>[]
  private tasks: { task: T; callback: TaskInfoCallback<R> }[]

  constructor(numThreads: number, scriptPath: string) {
    super()
    this.scriptPath = scriptPath
    this.workers = []
    this.freeWorkers = []
    this.tasks = []

    for (let i = 0; i < numThreads; i++) {
      this.addNewWorker()
    }

    // Any time the kWorkerFreedEvent is emitted, dispatch
    // the next task pending in the queue, if any.
    this.on(kWorkerFreedEvent, () => {
      const first = this.tasks.shift()
      if (first) {
        const { task, callback } = first
        this.runTask(task, callback)
      }
    })
  }

  addNewWorker() {
    const worker = new Worker(this.scriptPath) as EnhancedWorker<R>

    worker.on("message", (result: R) => {
      // In case of success: Call the callback that was passed to `runTask`,
      // remove the `TaskInfo` associated with the Worker, and mark it as free
      // again.
      worker[kTaskInfo]?.done(null, result)
      worker[kTaskInfo] = null
      this.freeWorkers.push(worker)
      this.emit(kWorkerFreedEvent)
    })

    worker.on("error", err => {
      // In case of an uncaught exception: Call the callback that was passed to
      // `runTask` with the error.
      if (worker[kTaskInfo]) worker[kTaskInfo].done(err, null)
      else this.emit("error", err)
      // Remove the worker from the list and start a new Worker to replace the
      // current one.
      this.workers.splice(this.workers.indexOf(worker), 1)
      this.addNewWorker()
    })

    this.workers.push(worker)
    this.freeWorkers.push(worker)
    this.emit(kWorkerFreedEvent)
  }

  runTask(task: T, callback: TaskInfoCallback<R>) {
    if (this.freeWorkers.length === 0) {
      // No free threads, wait until a worker thread becomes free.
      this.tasks.push({ task, callback })
      return
    }

    const worker = this.freeWorkers.pop()

    if (worker) {
      worker[kTaskInfo] = new WorkerPoolTaskInfo(callback)
      worker.postMessage(task)
    }
  }

  close() {
    return Promise.all(this.workers.map(worker => worker.terminate()))
  }
}
