import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: (requestOrigin, callback) => {
      const allowed =
        !requestOrigin ||
        requestOrigin.startsWith('http://localhost:') ||
        requestOrigin.startsWith('http://127.0.0.1:') ||
        requestOrigin === process.env.FRONTEND_URL;
      
      if (allowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  },
})
export class TicketGateway {
  @WebSocketServer()
  server: Server;
  
  emitToAgents(event:string, payload:any, exceptSocketId?: string) {
    if (exceptSocketId) {
      this.server.to('agents').except(exceptSocketId).emit(event, payload);
    } else {
      this.server.to('agents').emit(event, payload);
    }
  }

  emitToEmploye(event:string,payload:any,employeeId:string) {
    this.server.to(`employee:${employeeId}`).emit(event, payload)
  }

  @SubscribeMessage('join:employee')
  handelEmployeJoin(@ConnectedSocket() client:Socket,@MessageBody() data:{employeeId:string}) {
    client.join(`employee:${data.employeeId}`)
  }

  @SubscribeMessage('join:agents')
  handelJoin(@ConnectedSocket() client:Socket) {
    client.join('agents')
  }
}
