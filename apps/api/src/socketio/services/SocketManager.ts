import { Server } from "socket.io"

export class SocketManager {
  private static instance: SocketManager
  private io: Server | null = null

  private constructor() {}

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager()
    }
    return SocketManager.instance
  }

  public setIO(io: Server) {
    if (this.io) {
      throw new Error("Socket.IO instance already initialized")
    }
    this.io = io
  }

  public getIO(): Server {
    if (!this.io) {
      throw new Error("Socket.IO instance not initialized")
    }
    return this.io
  }
}
