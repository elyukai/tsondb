import { AsyncResource } from "node:async_hooks"
import { EventEmitter } from "node:events"
import { Worker } from "node:worker_threads"
import { error, ok, type Result } from "../../shared/utils/result.ts"

// from https://nodejs.org/api/async_context.html#using-asyncresource-for-a-worker-thread-pool

const kTaskInfo = Symbol("kTaskInfo")
const kWorkerFreedEvent = Symbol("kWorkerFreedEvent")

type TaskInfoCallback<R> = (result: Result<R, Error>) => void

class WorkerPoolTaskInfo<R> extends AsyncResource {
  public callback: TaskInfoCallback<R>

  constructor(callback: TaskInfoCallback<R>) {
    super("WorkerPoolTaskInfo")
    this.callback = callback
  }

  done(result: Result<R, Error>) {
    this.runInAsyncScope(this.callback, null, result)
    this.emitDestroy() // `TaskInfo`s are used only once.
  }
}

type EnhancedWorker<R> = Worker & { [kTaskInfo]?: WorkerPoolTaskInfo<R> | null }

export class WorkerPool<T, R, I = undefined> extends EventEmitter {
  private scriptPath: string
  private workers: EnhancedWorker<R>[]
  private freeWorkers: EnhancedWorker<R>[]
  private tasks: { task: T; callback: TaskInfoCallback<R> }[]
  private initialData: I

  constructor(
    ...args: I extends undefined
      ? [numThreads: number, scriptPath: string, initialData?: I]
      : [numThreads: number, scriptPath: string, initialData: I]
  ) {
    const [numThreads, scriptPath, initialData] = args
    super()
    this.scriptPath = scriptPath
    this.workers = []
    this.freeWorkers = []
    this.tasks = []
    this.initialData = initialData as I

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
    const worker = new Worker(this.scriptPath, {
      workerData: this.initialData,
    }) as EnhancedWorker<R>

    worker.on("message", (result: R) => {
      // In case of success: Call the callback that was passed to `runTask`,
      // remove the `TaskInfo` associated with the Worker, and mark it as free
      // again.
      worker[kTaskInfo]?.done(ok(result))
      worker[kTaskInfo] = null
      this.freeWorkers.push(worker)
      this.emit(kWorkerFreedEvent)
    })

    worker.on("error", err => {
      // In case of an uncaught exception: Call the callback that was passed to
      // `runTask` with the error.
      if (worker[kTaskInfo] && err instanceof Error) worker[kTaskInfo].done(error(err))
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
